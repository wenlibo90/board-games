// 平台外壳：首页/路由、通用对局控制、教学挂载
// 每种棋通过 games/<id>/index.js 提供的模块清单接入，外壳不含任何棋种专属逻辑

import { GAMES, getGame } from './registry.js';
import { getTheme } from '../core/theme.js';
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
    this.$('btn-home').addEventListener('click', () => this._closeGame());
    // 首页类链接（href="#/"）：弹窗打开时先关闭弹窗
    document.querySelectorAll('a[href="#/"]').forEach((a) => {
      a.addEventListener('click', () => this._closeGame());
    });
    this.gameTabs.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
    });
    // 锚点滚动（如「棋库 / 教程」滚动到对应区块，"top" 回到页面顶部）
    document.querySelectorAll('[data-scroll]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (el.dataset.scroll === 'top') {
          e.preventDefault();
          this._closeGame();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        const target = document.querySelector(el.dataset.scroll);
        if (!target) return;
        e.preventDefault();
        this._closeGame();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    // 导航「AI陪练」：与点击悬浮机器人一致，弹出聊天框
    document.querySelectorAll('[data-buddy]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this._closeGame();
        if (this.buddy) this._toggleBuddy(true);
      });
    });
    // 占位链接：页面未上线前拦截跳转
    document.querySelectorAll('[data-placeholder]').forEach((el) => {
      el.addEventListener('click', (e) => e.preventDefault());
    });
    // 对局弹窗：关闭按钮 / 点击遮罩 / Esc
    this.$('game-modal-close').addEventListener('click', () => this._closeGame());
    this.gameView.addEventListener('click', (e) => {
      // iframe 嵌入模式下 gameView 是铺平容器，不作为遮罩关闭
      if (!document.documentElement.classList.contains('embed') && e.target === this.gameView) this._closeGame();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.gameView.classList.contains('is-hidden')) this._closeGame();
    });
    // iframe 内运行时请求关闭弹窗（如点击品牌按钮 / Esc）
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'close-runtime') this._closeGame();
      if (e.data && e.data.type === 'expand-source') {
        const p = document.querySelector('.panel-source');
        if (p) p.classList.toggle('is-full');
      }
    });
    // 控制条「查看引擎源码」：通知 iframe 内源码卡片全屏（与双击源码区一致）
    const srcLink = document.getElementById('runtime-source-link');
    if (srcLink) {
      srcLink.addEventListener('click', (e) => {
        e.preventDefault();
        const frame = this.$('game-frame');
        if (frame && frame.contentWindow) frame.contentWindow.postMessage({ type: 'expand-source' }, '*');
      });
    }
    this._bindBuddy();
  }

  // ---------- AI 陪练小机器人（首页悬浮助手，模拟对话） ----------
  _bindBuddy() {
    this.buddy = {
      fab: this.$('ai-buddy-fab'),
      panel: this.$('ai-buddy-panel'),
      close: this.$('ai-buddy-close'),
      msgs: this.$('ai-buddy-msgs'),
      chips: this.$('ai-buddy-chips'),
      form: this.$('ai-buddy-form'),
      text: this.$('ai-buddy-text'),
    };
    if (!this.buddy.fab) return;
    this.buddyWelcomed = false;
    this.buddy.fab.addEventListener('click', () => this._toggleBuddy());
    this.buddy.close.addEventListener('click', () => this._toggleBuddy(false));
    this.buddy.chips.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-q]');
      if (chip) this._buddyAsk(chip.dataset.q);
    });
    this.buddy.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = this.buddy.text.value.trim();
      if (!v) return;
      this.buddy.text.value = '';
      this._buddyAsk(v);
    });
  }

  _toggleBuddy(open) {
    const p = this.buddy.panel;
    const willOpen = typeof open === 'boolean' ? open : p.classList.contains('is-hidden');
    p.classList.toggle('is-hidden', !willOpen);
    if (willOpen) {
      // 首次打开推入欢迎语与快捷问题
      if (!this.buddyWelcomed) {
        this.buddyWelcomed = true;
        this._buddyBot('你好，我是 AI 陪练 Neon Bot，关于引擎、棋种玩法都可以问我。');
        this._renderBuddyChips();
      }
      this.buddy.msgs.scrollTop = this.buddy.msgs.scrollHeight;
      setTimeout(() => this.buddy.text.focus(), 120);
    }
  }

  _renderBuddyChips() {
    const qs = ['有哪些棋牌？', '怎么换皮肤？', '如何开发新玩法？', 'AI 难度怎么调？'];
    this.buddy.chips.innerHTML = qs.map((q) => `<button type="button" class="ai-chip" data-q="${q}">${q}</button>`).join('');
  }

  _buddyAsk(text) {
    this._bubble('user', text);
    this._buddyReply(text);
  }

  _bubble(role, text) {
    const div = document.createElement('div');
    div.className = `ai-bubble ai-bubble--${role}`;
    div.textContent = text;
    this.buddy.msgs.appendChild(div);
    this.buddy.msgs.scrollTop = this.buddy.msgs.scrollHeight;
    return div;
  }

  _buddyBot(text) {
    this._bubble('bot', text);
  }

  // 模拟回复：关键词匹配 + 打字延迟，无后端
  _buddyReply(text) {
    const typing = this._bubble('bot typing', '···');
    const answer = this._buddyAnswer(text);
    setTimeout(() => {
      typing.remove();
      this._buddyBot(answer);
    }, 550 + Math.min(700, answer.length * 12));
  }

  _buddyAnswer(text) {
    const t = text.toLowerCase();
    const has = (...ws) => ws.some((w) => t.includes(w));
    if (has('你好', 'hi', 'hello', '你是谁', '在吗')) {
      return '我是 Neon Arena 的 AI 陪练，负责介绍引擎平台、陪聊玩法思路。想试试哪个引擎？';
    }
    if (has('五子棋', 'gomoku')) {
      return '五子棋引擎支持 13/15/19 路棋盘、悔棋、提示与 AI 对战，点击首页卡片即可启动体验。';
    }
    if (has('象棋', 'xiangqi', '国际象棋', 'chess')) {
      return '象棋与国际象棋都有完整规则判定（将杀、困毙等），AI 提供入门/初级/中级三档，适合作为棋力陪练。';
    }
    if (has('围棋', 'go ')) {
      return '围棋引擎支持 9/13/19 路，含提子与数目判定。规则内核在 src/games/go/engine.js，欢迎阅读。';
    }
    if (has('uno', '乌诺', '斗地主', '升级', '掼蛋', '牌')) {
      return '乌诺、升级、掼蛋、斗地主都是同一套引擎契约接入的，玩法逻辑与显示层完全分离，可以随意改 UI。';
    }
    if (has('皮肤', '主题', '换皮', '定制')) {
      return '每个棋种的显示层独立在 view.js 与调色板里，改配色、贴图甚至 3D 化都不影响规则内核，主题随意定制。';
    }
    if (has('开发', '引擎', '内核', '新玩法', '源码')) {
      return '二次开发只需实现 createGame / ai.move / createView 三件套并在 registry.js 注册，文档见仓库 README。';
    }
    if (has('难度', 'ai', '陪练')) {
      return '侧栏可切换入门 / 初级 / 中级三档 AI，难度越高搜索越深。想挑战哪一款？';
    }
    if (has('教程', '怎么玩', '规则', '教学')) {
      return '每个引擎弹窗里都有玩法教程，或点顶部导航「教程」查看开发者文档。';
    }
    if (has('哪些', '有哪', '棋牌', '游戏', '列表')) {
      return '目前内置 14 款引擎：中国象棋、韩国将棋、将棋、五子棋、国际象棋、围棋、国际跳棋、六角跳棋、黑白棋、斗兽棋、乌诺、升级、掼蛋、斗地主。';
    }
    return '这个问题我还在学习中～可以问我棋种玩法、怎么换皮肤，或者如何基于内核开发新玩法。';
  }

  // ---------- 首页 ----------
  _renderHome() {
    this.homeGrid.innerHTML = GAMES.map(
      (g, i) => `
      <button class="game-card" type="button" data-game="${g.id}" style="--accent:${g.accent};--i:${i}">
        <span class="game-card-ghost" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <span class="game-card-art" aria-hidden="true">${g.art || ''}</span>
        <span class="game-card-body">
          <span class="game-card-name">${g.name}<em>${g.nameEn}</em></span>
          <span class="game-card-tagline">${g.tagline}</span>
          <span class="game-card-desc">${g.description}</span>
          <span class="game-card-go">启动引擎<span class="arr" aria-hidden="true">→</span></span>
        </span>
      </button>`
    ).join('');
    // 引擎路线图提示卡：占位于棋库末尾，不可点击
    this.homeGrid.insertAdjacentHTML(
      'beforeend',
      `<div class="game-card game-card--more" aria-hidden="true">
        <span class="game-card-more-tag">// NEXT</span>
        <span class="game-card-more-text">内核逐步完善中，将推出更多棋牌</span>
        <span class="game-card-more-dots"><i></i><i></i><i></i></span>
      </div>`
    );
    this.homeGrid.querySelectorAll('[data-game]').forEach((el) => {
      el.addEventListener('click', () => {
        // 当前页弹窗打开，不跳转、不改变路由
        const mod = GAMES.find((g) => g.id === el.dataset.game);
        if (mod) this._openGame(mod);
      });
    });
  }

  _route() {
    // iframe 嵌入模式：?embed=<id> 时铺满运行对应引擎（无首页）
    const embedId = new URLSearchParams(location.search).get('embed');
    if (embedId) {
      const mod = GAMES.find((g) => g.id === embedId);
      if (mod) {
        document.documentElement.classList.add('embed');
        this._openGame(mod);
      }
      return;
    }
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
    document.body.classList.add('home-active');
    document.body.classList.remove('buddy-hidden');
    document.documentElement.removeAttribute('data-game');
    document.documentElement.removeAttribute('data-custom-page');
    if (this.customPage && this.customPage.destroy) { this.customPage.destroy(); this.customPage = null; }
    if (this.customHost) this.customHost.classList.add('is-hidden');
    this.homeView.classList.remove('is-hidden');
    this.gameView.classList.add('is-hidden');
    this.gameTabs.classList.add('is-hidden');
    document.body.style.overflow = '';
    // 释放运行时 iframe
    const frame = this.$('game-frame');
    if (frame && frame.dataset.game) {
      delete frame.dataset.game;
      frame.src = 'about:blank';
    }
  }

  // 关闭对局弹窗：hash 指向具体游戏时清回 #/（会触发 _route → _showHome），否则直接回首页
  _closeGame() {
    // iframe 嵌入模式：通知父页关闭弹窗
    if (document.documentElement.classList.contains('embed')) {
      try { window.parent.postMessage({ type: 'close-runtime' }, '*'); } catch (e) { /* ignore */ }
      return;
    }
    if (this.gameView.classList.contains('is-hidden')) return;
    const id = (location.hash || '#/').replace(/^#\/?/, '').trim();
    if (id && id !== 'home') {
      location.hash = '#/';
    } else {
      this._showHome();
    }
  }

  _openGame(mod) {
    this._clearAiTimer();
    this.gameView.classList.remove('is-hidden');
    this.activeView = 'game';

    // 父页模式：首页保持原状（不隐藏、不动滚动位置），仅覆盖弹窗层
    if (!document.documentElement.classList.contains('embed')) {
      // 引擎运行期间收起 AI 陪练，避免遮挡弹窗
      document.body.classList.add('buddy-hidden');
      if (this.buddy && !this.buddy.panel.classList.contains('is-hidden')) this._toggleBuddy(false);
      const title = this.$('game-frame-title');
      if (title) title.textContent = `${mod.name} · ${mod.nameEn}`;
      const frame = this.$('game-frame');
      if (frame && frame.dataset.game !== mod.id) {
        frame.dataset.game = mod.id;
        frame.src = `./index.html?embed=${mod.id}`;
      }
      return;
    }

    // iframe 嵌入模式：铺平渲染对局
    document.body.classList.remove('home-active');
    this.homeView.classList.add('is-hidden');
    this.gameTabs.classList.add('is-hidden');
    document.documentElement.setAttribute('data-game', mod.id);
    if (this.customPage && this.customPage.destroy) { this.customPage.destroy(); this.customPage = null; }
    if (mod.customPage) {
      document.documentElement.setAttribute('data-custom-page', '1');
      if (this.customHost) this.customHost.classList.remove('is-hidden');
      this.customPage = mod.mountPage(this.customHost, { onExit: () => this._closeGame() });
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
    this.gameTitle.textContent = mod.name;
    this.gameTagline.textContent = mod.tagline;
    this._renderRuntimeInfo(mod);
    this._buildSidePanel();
    this._switchTab('play', true);
    this._mountView();
    this.newGame();
  }

  // 引擎运行台信息：能力徽章 + 模块路径（技术向引导）
  _renderRuntimeInfo(mod) {
    const s = mod.supports || {};
    const caps = ['RULES ENGINE', 'LOCAL AI', 'CANVAS 2D', 'ES MODULE'];
    if (s.undo) caps.push('UNDO');
    if (s.hint) caps.push('AI HINT');
    if (s.estimate) caps.push('ESTIMATE');
    if (s.pass) caps.push('PASS');
    if (mod.customPage) caps.push('CUSTOM PAGE');
    const badges = this.$('game-runtime-badges');
    if (badges) badges.innerHTML = caps.map((t) => `<span>${t}</span>`).join('');
    const path = this.$('runtime-path');
    if (path) path.textContent = `SRC/GAMES/${mod.id.toUpperCase()}/ · ENGINE + AI + VIEW · ES MODULE`;
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
      <section class="panel panel-compact">
        <div class="status-row"><span class="status-dot" id="status-dot" aria-hidden="true"></span><span id="status-text">准备开始</span></div>
        <div class="stat-grid" id="stat-grid"></div>
        ${setupHtml}
        <div class="field"><span class="field-label">AI 难度</span><div class="segmented">${diffHtml}</div></div>
        <div class="compact-actions">
          <button type="button" class="btn btn-primary" data-action="new">新对局</button>
          ${actionHtml}${moduleButtons}
        </div>
        ${helperHtml ? `<div class="compact-helpers">${helperHtml}</div>` : ''}
      </section>
      <section class="panel panel-engine">
        <h2 class="panel-title">引擎信息</h2>
        <div class="engine-meta">
          <div class="engine-meta-row"><span>MODULE</span><code>src/games/${mod.id}/</code></div>
          <div class="engine-meta-row"><span>API</span><code>createGame · ai.move · createView</code></div>
          <div class="engine-meta-row"><span>AI</span><code>本地算法 · 离线可玩</code></div>
        </div>
        <a class="engine-meta-link" href="javascript:void(0)" data-engine-dev>基于此内核开发 →</a>
      </section>
      <section class="panel panel-source" id="source-panel">
        <div class="source-head">
          <h2 class="panel-title">源码调试</h2>
          <div class="source-tabs" id="source-tabs"></div>
        </div>
        <div class="source-view" id="source-view">
          <pre class="source-lines" id="source-lines" aria-hidden="true">1</pre>
          <pre class="source-code"><code id="source-code">// 加载中…</code></pre>
        </div>
      </section>
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
    const devLink = this.sidePanel.querySelector('[data-engine-dev]');
    if (devLink) devLink.addEventListener('click', () => this._tip(devLink, '主题和皮肤可视化编辑平台还未正式启用'));

    this.statusDot = this.$('status-dot');
    this.statusText = this.$('status-text');
    this.statGrid = this.$('stat-grid');
    this._initSourcePanel(mod);
  }

  // ---------- 源码调试 ----------
  async _initSourcePanel(mod) {
    const panel = this.$('source-panel');
    if (!panel) return;
    const tabsEl = this.$('source-tabs');
    const viewEl = this.$('source-view');
    const linesEl = this.$('source-lines');
    const codeEl = this.$('source-code');
    // 同引擎会话缓存，避免重复 fetch
    if (!this._srcCache) this._srcCache = {};
    const sources = this._srcCache[mod.id] || (this._srcCache[mod.id] = await this._fetchSources(mod.id));
    const names = Object.keys(sources);
    if (!names.length) {
      codeEl.textContent = '// 无法加载源码：请通过 http 服务访问（如 python -m http.server 8000）';
      linesEl.textContent = '1';
      return;
    }
    const render = (name) => {
      tabsEl.querySelectorAll('button').forEach((b) => b.classList.toggle('is-active', b.dataset.src === name));
      const code = sources[name];
      linesEl.textContent = code.split('\n').map((_, i) => i + 1).join('\n');
      codeEl.innerHTML = this._highlightSource(code);
      viewEl.scrollTop = 0;
      viewEl.scrollLeft = 0;
    };
    tabsEl.innerHTML = names
      .map((f, i) => `<button type="button" data-src="${f}" class="${i === 0 ? 'is-active' : ''}">${f}</button>`)
      .join('');
    tabsEl.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => render(b.dataset.src)));
    render(names[0]);
    // 文件过多时：鼠标移到左右边缘即自动滚动列表（类似焦点图左右切换，越靠边越快）
    const EDGE = 36;
    let edgeDir = 0;
    let edgeRaf = null;
    const step = () => {
      if (edgeDir === 0) { edgeRaf = null; return; }
      const before = tabsEl.scrollLeft;
      tabsEl.scrollLeft += edgeDir;
      if (tabsEl.scrollLeft === before) { edgeDir = 0; edgeRaf = null; return; } // 已滚到头
      edgeRaf = requestAnimationFrame(step);
    };
    tabsEl.addEventListener('mousemove', (e) => {
      const r = tabsEl.getBoundingClientRect();
      const x = e.clientX - r.left;
      if (x < EDGE) {
        edgeDir = -(2 + 6 * (1 - x / EDGE));
      } else if (x > r.width - EDGE) {
        edgeDir = 2 + 6 * (1 - (r.width - x) / EDGE);
      } else {
        edgeDir = 0;
      }
      if (edgeDir !== 0 && !edgeRaf) edgeRaf = requestAnimationFrame(step);
    });
    tabsEl.addEventListener('mouseleave', () => { edgeDir = 0; });
    // 双击源码区放大/还原；Esc 仅在全屏时退出（capture 阶段拦截，避免顺带关闭弹窗）
    viewEl.addEventListener('dblclick', () => panel.classList.toggle('is-full'));
    if (this._srcEsc) document.removeEventListener('keydown', this._srcEsc, true);
    this._srcEsc = (e) => {
      if (e.key === 'Escape' && panel.classList.contains('is-full')) {
        e.stopPropagation();
        panel.classList.remove('is-full');
      }
    };
    document.addEventListener('keydown', this._srcEsc, true);
  }

  async _fetchSources(id) {
    const files = ['index.js', 'engine.js', 'ai.js', 'view.js', 'lessons.js'];
    const out = {};
    await Promise.all(
      files.map(async (f) => {
        try {
          const r = await fetch(`./src/games/${id}/${f}`);
          if (r.ok) out[f] = await r.text();
        } catch (e) { /* file:// 下 fetch 不可用，忽略 */ }
      })
    );
    return out;
  }

  // 轻量语法着色：注释 / 字符串 / 关键字 / 数字（无外部依赖）
  _highlightSource(code) {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const kw = 'const|let|var|function|return|if|else|for|while|do|break|continue|switch|case|default|class|new|import|export|from|as|async|await|typeof|instanceof|of|in|try|catch|finally|throw|extends|super|this|null|undefined|true|false|static|get|set|delete|void|yield';
    const re = new RegExp(
      "(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)" +
      "|('(?:\\\\.|[^'\\\\\\n])*'|\"(?:\\\\.|[^\"\\\\\\n])*\"|`(?:\\\\.|[^`\\\\])*`)" +
      "|\\b(" + kw + ")\\b" +
      "|\\b(0x[0-9a-fA-F]+|\\d+(?:\\.\\d+)?)\\b",
      'g'
    );
    let out = '';
    let last = 0;
    let m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      if (m[1]) out += `<span class="tk-c">${esc(m[1])}</span>`;
      else if (m[2]) out += `<span class="tk-s">${esc(m[2])}</span>`;
      else if (m[3]) out += `<span class="tk-k">${esc(m[3])}</span>`;
      else out += `<span class="tk-n">${esc(m[4])}</span>`;
      last = m.index + m[0].length;
    }
    return out + esc(code.slice(last));
  }

  // 链接旁气泡提示（2s 自动消失）
  _tip(el, msg) {
    let t = document.querySelector('.link-tip');
    if (!t) {
      t = document.createElement('div');
      t.className = 'link-tip';
      document.body.appendChild(t);
    }
    const r = el.getBoundingClientRect();
    t.textContent = msg;
    t.style.left = Math.round(r.left + r.width / 2) + 'px';
    t.style.top = Math.round(r.top - 8) + 'px';
    t.classList.add('show');
    clearTimeout(this._tipTimer);
    this._tipTimer = setTimeout(() => t.classList.remove('show'), 2000);
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
    this._playStoneSound();
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
        if (r && r.ok) this._playStoneSound();
        else if (g.pass) g.pass();
      }
      this.thinking = false;
      this.render();
      if (g.ended) this._onEnd();
      else this.maybeAiMove();
    }, 300);
  }

  // 落子音效：WebAudio 合成短促「嗒」声，无资源文件；首次落子（用户交互）后自动可用
  _playStoneSound() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!this._audioCtx) this._audioCtx = new Ctx();
      const ctx = this._audioCtx;
      if (ctx.state === 'suspended') ctx.resume();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    } catch {
      /* 无声环境忽略 */
    }
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
