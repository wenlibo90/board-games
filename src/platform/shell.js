// 平台外壳：首页/路由、通用对局控制、教学挂载
// 每种棋通过 games/<id>/index.js 提供的模块清单接入，外壳不含任何棋种专属逻辑

import { GAMES, getGame } from './registry.js';
import { getTheme, toggleTheme } from '../core/theme.js';
import { TutorialController } from './tutorial.js';

const DIFFICULTIES = [
  { value: 'easy', label: '入门' },
  { value: 'medium', label: '初级' },
  { value: 'hard', label: '中级' },
];

export class Shell {
  constructor() {
    this.theme = getTheme();
    this.game = null;
    this.view = null;
    this.tutorial = null;
    this.difficulty = 'medium';
    this.thinking = false;
    this.aiTimer = null;
    this.hint = null;
    this.overlay = null;
    this.config = {};
    this.helpers = {};
    this.activeTab = 'play';
    this._cacheDom();
    this._applyTheme(this.theme);
    this._renderHome();
    this._bindGlobal();
    window.addEventListener('hashchange', () => this._route());
    this._route();
  }

  _cacheDom() {
    this.$ = (id) => document.getElementById(id);
    this.homeView = this.$('home-view');
    this.homeGrid = this.$('home-grid');
    this.gameView = this.$('game-view');
    this.gameTitle = this.$('game-title');
    this.gameTagline = this.$('game-tagline');
    this.gameTabs = this.$('game-tabs');
    this.playPanel = this.$('play-panel');
    this.tutorialPanel = this.$('tutorial-panel');
    this.tutorialHost = this.$('tutorial-host');
    this.sidePanel = this.$('side-panel');
    this.resultBanner = this.$('result-banner');
    this.resultText = this.$('result-text');
    this.boardFrame = this.$('board-frame');
    this.customHost = this.$('custom-page-host');
  }

  _applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const palette = this.game ? this.game.palettes[theme] : null;
    if (palette && this.view) this.view.setPalette(palette);
    if (this.tutorial) this.tutorial.setPalette(this.game ? this.game.palettes[theme] : {});
  }

  _bindGlobal() {
    this.$('theme-toggle').addEventListener('click', () => {
      this._applyTheme(toggleTheme(this.theme));
    });
    this.$('btn-home').addEventListener('click', () => {
      location.hash = '#/';
    });
    this.gameTabs.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
    });
  }

  // ---------- 首页 ----------
  _renderHome() {
    this.homeGrid.innerHTML = GAMES.map(
      (g) => `
      <button class="game-card" type="button" data-game="${g.id}" style="--accent:${g.accent}">
        <span class="game-card-art" aria-hidden="true">${g.art || ''}</span>
        <span class="game-card-body">
          <span class="game-card-name">${g.name}<em>${g.nameEn}</em></span>
          <span class="game-card-tagline">${g.tagline}</span>
          <span class="game-card-desc">${g.description}</span>
          <span class="game-card-go">进入棋盘</span>
        </span>
      </button>`
    ).join('');
    this.homeGrid.querySelectorAll('[data-game]').forEach((el) => {
      el.addEventListener('click', () => {
        location.hash = `#/${el.dataset.game}`;
      });
    });
  }

  _route() {
    const id = (location.hash || '#/').replace(/^#\/?/, '').trim();
    if (!id || id === 'home') {
      this._showHome();
      return;
    }
    const mod = GAMES.find((g) => g.id === id);
    if (!mod) {
      this._showHome();
      return;
    }
    this._openGame(mod);
  }

  _showHome() {
    this._clearAiTimer();
    document.documentElement.removeAttribute('data-game');
    document.documentElement.removeAttribute('data-custom-page');
    if (this.customPage && this.customPage.destroy) { this.customPage.destroy(); this.customPage = null; }
    if (this.customHost) this.customHost.classList.add('is-hidden');
    this.homeView.classList.remove('is-hidden');
    this.gameView.classList.add('is-hidden');
    this.gameTabs.classList.add('is-hidden');
  }

  _openGame(mod) {
    this._clearAiTimer();
    document.documentElement.setAttribute('data-game', mod.id);
    if (this.customPage && this.customPage.destroy) { this.customPage.destroy(); this.customPage = null; }
    if (mod.customPage) {
      document.documentElement.setAttribute('data-custom-page', '1');
      this.homeView.classList.add('is-hidden');
      this.gameView.classList.remove('is-hidden');
      this.gameTabs.classList.add('is-hidden');
      this.activeView = 'game';
      if (this.customHost) this.customHost.classList.remove('is-hidden');
      this.customPage = mod.mountPage(this.customHost, { onExit: () => { location.hash = '#/'; } });
      return;
    }
    document.documentElement.removeAttribute('data-custom-page');
    if (this.customHost) this.customHost.classList.add('is-hidden');
    if (!this.game || this.game.id !== mod.id) {
      this.game = mod;
      this.config = {};
      for (const f of mod.setup || []) this.config[f.key] = f.default;
      this.helpers = {};
      for (const h of mod.helpers || []) this.helpers[h.key] = h.default;
      this.hint = null;
      this.overlay = null;
    }
    this.homeView.classList.add('is-hidden');
    this.gameView.classList.remove('is-hidden');
    this.gameTabs.classList.remove('is-hidden');
    this.gameTitle.textContent = mod.name;
    this.gameTagline.textContent = mod.tagline;
    this._buildSidePanel();
    this._switchTab('play', true);
    this._mountView();
    this.newGame();
  }

  _mountView() {
    // 每种棋棋盘形态不同，重建 canvas 与 view
    const old = this.$('game-canvas');
    const fresh = old.cloneNode(false);
    fresh.id = 'game-canvas';
    old.parentNode.replaceChild(fresh, old);
    this.view = this.game.createView(fresh, {
      palette: this.game.palettes[this.theme],
      viewer: this.humanColor,
      onMove: (move) => this.humanMove(move),
    });
    for (const h of this.game.helpers || []) {
      if (h.apply) h.apply(this.view, this.helpers[h.key]);
    }
    this.view.resize();
  }

  _switchTab(tab, silent) {
    this.activeTab = tab;
    this.gameTabs.querySelectorAll('[data-tab]').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.tab === tab)
    );
    this.playPanel.classList.toggle('is-hidden', tab !== 'play');
    this.tutorialPanel.classList.toggle('is-hidden', tab !== 'tutorial');
    if (tab === 'tutorial') {
      if (!this.tutorial || this.tutorial.moduleId !== this.game.id) {
        this.tutorial = new TutorialController(this.tutorialHost, this.game, {
          onFinish: () => {
            this._switchTab('play');
            if (this.view) this.view.setDecor([]);
            this.newGame();
          },
        });
        this.tutorial.moduleId = this.game.id;
      }
      setTimeout(() => this.tutorial.resize(), 40);
    } else if (!silent) {
      setTimeout(() => this.view && this.view.resize(), 40);
    }
  }

  // ---------- 侧栏 ----------
  _buildSidePanel() {
    const mod = this.game;
    const setupHtml = (mod.setup || [])
      .map((f) => {
        if (f.type !== 'options') return '';
        const opts = f.options
          .map(
            (o) =>
              `<button type="button" data-setup="${f.key}" data-value="${o.value}" class="${this.config[f.key] === o.value ? 'is-active' : ''}">${o.label}</button>`
          )
          .join('');
        return `<div class="field"><span class="field-label">${f.label}</span><div class="segmented">${opts}</div></div>`;
      })
      .join('');

    const diffHtml = DIFFICULTIES.map(
      (d) => `<button type="button" data-diff="${d.value}" class="${this.difficulty === d.value ? 'is-active' : ''}">${d.label}</button>`
    ).join('');

    const actions = [];
    if (mod.supports.undo) actions.push(['undo', '悔棋']);
    if (mod.supports.pass) actions.push(['pass', '停一手']);
    if (mod.supports.hint) actions.push(['hint', '提示']);
    if (mod.supports.estimate) actions.push(['estimate', '形势判断']);
    if (mod.supports.resign) actions.push(['resign', '认输']);
    const actionHtml = actions
      .map(([k, label]) => `<button type="button" data-action="${k}" class="btn${k === 'resign' ? ' btn-danger' : ''}">${label}</button>`)
      .join('');
    const moduleButtons = (mod.buttons || [])
      .map((b) => `<button type="button" data-mbtn="${b.key}" class="btn${b.tone ? ' btn-' + b.tone : ''}">${b.label}</button>`)
      .join('');

    const helperHtml = (mod.helpers || [])
      .map(
        (h) =>
          `<label class="switch"><input type="checkbox" data-helper="${h.key}" ${this.helpers[h.key] ? 'checked' : ''} /><span>${h.label}</span></label>`
      )
      .join('');

    this.sidePanel.innerHTML = `
      <section class="panel">
        <h2 class="panel-title">对局设置</h2>
        ${setupHtml}
        <div class="field"><span class="field-label">AI 难度</span><div class="segmented">${diffHtml}</div></div>
        <button type="button" class="btn btn-primary btn-block" data-action="new">开始新对局</button>
      </section>
      <section class="panel">
        <h2 class="panel-title">对局信息</h2>
        <div class="status-row"><span class="status-dot" id="status-dot" aria-hidden="true"></span><span id="status-text">准备开始</span></div>
        <div class="stat-grid" id="stat-grid"></div>
      </section>
      <section class="panel">
        <h2 class="panel-title">操作</h2>
        <div class="action-grid">${actionHtml}${moduleButtons}</div>
      </section>
      ${helperHtml ? `<section class="panel"><h2 class="panel-title">辅助</h2>${helperHtml}</section>` : ''}
    `;

    this.sidePanel.querySelectorAll('[data-setup]').forEach((b) =>
      b.addEventListener('click', () => {
        const key = b.dataset.setup;
        const field = (mod.setup || []).find((f) => f.key === key);
        const opt = field.options.find((o) => String(o.value) === b.dataset.value);
        this.config[key] = opt.value;
        this.sidePanel.querySelectorAll(`[data-setup="${key}"]`).forEach((x) =>
          x.classList.toggle('is-active', String(x.dataset.value) === b.dataset.value)
        );
        this.newGame();
      })
    );
    this.sidePanel.querySelectorAll('[data-diff]').forEach((b) =>
      b.addEventListener('click', () => {
        this.difficulty = b.dataset.diff;
        this.sidePanel.querySelectorAll('[data-diff]').forEach((x) => x.classList.toggle('is-active', x === b));
        this._setStatus();
      })
    );
    this.sidePanel.querySelectorAll('[data-helper]').forEach((c) =>
      c.addEventListener('change', () => {
        this.helpers[c.dataset.helper] = c.checked;
        const h = (mod.helpers || []).find((x) => x.key === c.dataset.helper);
        if (h && h.apply && this.view) h.apply(this.view, c.checked);
      })
    );
    this.sidePanel.querySelectorAll('[data-action]').forEach((b) =>
      b.addEventListener('click', () => this._action(b.dataset.action))
    );
    this.sidePanel.querySelectorAll('[data-mbtn]').forEach((b) =>
      b.addEventListener('click', () => {
        const key = b.dataset.mbtn;
        if (this.game.buttonEnabled && !this.game.buttonEnabled(this.gameObj, key)) return;
        if (this.game.onAction) this.game.onAction(this.gameObj, key, this.view);
        this.render();
        if (this.gameObj.ended) this._onEnd();
        else this.maybeAiMove();
      })
    );

    this.statusDot = this.$('status-dot');
    this.statusText = this.$('status-text');
    this.statGrid = this.$('stat-grid');
  }

  _action(name) {
    if (name === 'new') this.newGame();
    else if (name === 'undo') this.undo();
    else if (name === 'pass') this.humanPass();
    else if (name === 'hint') this.showHint();
    else if (name === 'estimate') this.estimate();
    else if (name === 'resign') this.resign();
  }

  // ---------- 对局流程 ----------
  get humanColor() {
    return this.config.humanColor !== undefined ? this.config.humanColor : 0;
  }

  newGame() {
    this._clearAiTimer();
    this.thinking = false;
    this.hint = null;
    this.overlay = null;
    this.gameObj = this.game.createGame(this.config);
    this.resultBanner.classList.add('is-hidden');
    if (this.view) {
      if (this.view.setViewer) this.view.setViewer(this.humanColor);
      this.view.setDecor([]);
      if (this.view.setHint) this.view.setHint(null);
      if (this.view.setOverlay) this.view.setOverlay(null);
    }
    this.render();
    this.maybeAiMove();
  }

  render() {
    const g = this.gameObj;
    if (!this.view) return;
    this.view.render(g);
    this._setStatus();
    this._setStats();
    this._syncModuleButtons();
  }

  _syncModuleButtons() {
    if (!this.game.buttons) return;
    this.sidePanel.querySelectorAll('[data-mbtn]').forEach((b) => {
      const key = b.dataset.mbtn;
      const en = this.game.buttonEnabled ? this.game.buttonEnabled(this.gameObj, key) : true;
      b.disabled = !en;
    });
  }

  _setStats() {
    if (!this.statGrid) return;
    const stats = this.game.stats ? this.game.stats(this.gameObj) : [];
    this.statGrid.innerHTML = stats
      .map((s) => `<div class="stat"><span class="stat-label">${s.label}</span><strong>${s.value}</strong></div>`)
      .join('');
  }

  _setStatus() {
    if (!this.statusText) return;
    const ctx = { humanColor: this.humanColor, thinking: this.thinking };
    if (this.game.statusLine) this.statusText.textContent = this.game.statusLine(this.gameObj, ctx);
    else this.statusText.textContent = this.gameObj.ended ? '对局结束' : '进行中';
    if (this.statusDot) {
      const isHuman = this.gameObj.turn === this.humanColor;
      const dot = this.game.dotColor ? this.game.dotColor(this.gameObj, isHuman) : '#888';
      this.statusDot.style.background = dot;
      this.statusDot.style.border = '1px solid var(--border)';
    }
  }

  humanMove(move) {
    const g = this.gameObj;
    if (g.ended || this.thinking || g.turn !== this.humanColor) return;
    if (this.hint) this._clearHint();
    const r = g.play(move);
    if (!r || !r.ok) return;
    this.render();
    this.maybeAiMove();
  }

  maybeAiMove() {
    const g = this.gameObj;
    if (g.ended || g.turn === this.humanColor) return;
    this._clearAiTimer();
    this.thinking = true;
    this._setStatus();
    this.aiTimer = setTimeout(() => {
      if (g.ended || g.turn === this.humanColor) {
        this.thinking = false;
        return;
      }
      const mv = this.game.ai.move(g, this.difficulty);
      if (mv === 'pass') {
        if (g.pass) g.pass();
      } else if (mv != null) {
        const r = g.play(mv);
        if (!r || !r.ok) {
          if (g.pass) g.pass();
        }
      }
      this.thinking = false;
      this.render();
      if (g.ended) this._onEnd();
      else this.maybeAiMove();
    }, 300);
  }

  _clearAiTimer() {
    if (this.aiTimer) {
      clearTimeout(this.aiTimer);
      this.aiTimer = null;
    }
  }

  undo() {
    if (this.thinking) return;
    const g = this.gameObj;
    const humanMoves = g.moves.filter((m) => m.color === this.humanColor).length;
    if (humanMoves === 0) return;
    this._clearHint();
    if (this.view && this.view.setOverlay) this.view.setOverlay(null);
    this.resultBanner.classList.add('is-hidden');
    do {
      g.undo();
    } while (g.moves.length > 0 && g.turn !== this.humanColor);
    this.render();
  }

  humanPass() {
    const g = this.gameObj;
    if (g.ended || this.thinking || g.turn !== this.humanColor || !g.pass) return;
    this._clearHint();
    g.pass();
    this.render();
    if (g.ended) this._onEnd();
    else this.maybeAiMove();
  }

  resign() {
    const g = this.gameObj;
    if (g.ended) return;
    this._clearAiTimer();
    this.thinking = false;
    g.resign(this.humanColor);
    this.render();
    this._onEnd();
  }

  showHint() {
    const g = this.gameObj;
    if (g.ended || this.thinking || g.turn !== this.humanColor) return;
    const mv = this.game.ai.hint(g, this.humanColor);
    if (mv == null || mv === 'pass') return;
    this.hint = mv;
    if (this.view.setHint) this.view.setHint(mv);
  }

  _clearHint() {
    if (this.hint == null) return;
    this.hint = null;
    if (this.view && this.view.setHint) this.view.setHint(null);
  }

  estimate() {
    if (!this.game.estimate) return;
    const r = this.game.estimate(this.gameObj);
    this.overlay = r.overlay || null;
    if (this.view && this.view.setOverlay) this.view.setOverlay(this.overlay);
    if (this.statusText) this.statusText.textContent = r.text;
  }

  _onEnd() {
    this._clearAiTimer();
    this.thinking = false;
    const g = this.gameObj;
    if (this.game.endOverlay) {
      const o = this.game.endOverlay(g);
      if (o && this.view && this.view.setOverlay) this.view.setOverlay(o);
    }
    this.resultText.textContent = g.result ? g.result.text : '对局结束';
    this.resultBanner.classList.remove('is-hidden');
    this.render();
  }
}
