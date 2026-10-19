// 通用教学控制器：适配任意棋种模块的课程数据
//
// 模块需提供（见各 games/<id>/index.js）：
//   module.lessons       课程数组
//   module.engine        规则引擎命名空间（至少 createGame）
//   module.createView    (canvas, opts) => view
//   module.tutorial      可选钩子：{ buildGame(lesson), play(game, move) }
//
// 课程对象字段：
//   id, tag, title
//   intro      字符串数组，或 (game) => 字符串数组
//   tip        字符串
//   setup      传给 engine.createGame 的选项（若未提供 tutorial.buildGame）
//   interactive 是否允许在棋盘上操作
//   task       { type: 'next'|'free'|'move'|'tryIllegal', accept?, isIllegal?, target?, success, fail?, finish? }
//   decor      标记数组，或 (game) => 标记数组
//   overlay    (game) => 传给 view.setOverlay 的数据

export class TutorialController {
  constructor(host, module, opts = {}) {
    this.host = host;
    this.module = module;
    this.lessons = module.lessons || [];
    this.onFinish = opts.onFinish || (() => {});
    this.onResize = opts.onResize || (() => {});
    this.onExit = opts.onExit || (() => {});
    this.index = 0;
    this.solved = false;
    this.game = null;
    this._build();
    if (this.lessons.length) this.load(0);
  }

  _build() {
    this.host.innerHTML = `
      <div class="tutorial-grid">
        <div class="tutorial-board-panel">
          <canvas class="board-canvas" aria-label="教学棋盘"></canvas>
        </div>
        <aside class="tutorial-side">
          <div class="tutorial-side-top">
            <div class="lesson-progress"></div>
            <a href="javascript:void(0)" class="tutorial-back" data-act="exit">返回对弈</a>
          </div>
          <div class="lesson-head">
            <span class="lesson-tag"></span>
            <h3 class="lesson-title"></h3>
          </div>
          <div class="lesson-intro"></div>
          <div class="lesson-tip"></div>
          <div class="lesson-feedback" role="status" aria-live="polite"></div>
          <div class="lesson-actions">
            <button class="btn btn-ghost" data-act="prev" type="button">上一课</button>
            <button class="btn btn-primary" data-act="next" type="button">下一课</button>
          </div>
        </aside>
      </div>
    `;
    const q = (s) => this.host.querySelector(s);
    this.elProgress = q('.lesson-progress');
    this.elTag = q('.lesson-tag');
    this.elTitle = q('.lesson-title');
    this.elIntro = q('.lesson-intro');
    this.elTip = q('.lesson-tip');
    this.elFeedback = q('.lesson-feedback');
    this.btnPrev = q('[data-act="prev"]');
    this.btnNext = q('[data-act="next"]');
    this.canvas = q('canvas');

    this.btnPrev.addEventListener('click', () => this.prev());
    this.btnNext.addEventListener('click', () => this.next());
    const exitLink = q('[data-act="exit"]');
    if (exitLink) exitLink.addEventListener('click', () => this.onExit());

    this.view = this.module.createView(this.canvas, {
      onMove: (move) => this._handleMove(move),
    });
    this.view.interactive = false;
    this._renderProgress();
  }

  _renderProgress() {
    this.elProgress.innerHTML = this.lessons
      .map(
        (l, i) =>
          `<button class="dot${i === this.index ? ' is-active' : ''}${i < this.index ? ' is-done' : ''}" type="button" data-i="${i}" aria-label="${l.tag || '第 ' + (i + 1) + ' 课'}"></button>`
      )
      .join('');
    this.elProgress.querySelectorAll('.dot').forEach((d) => {
      d.addEventListener('click', () => this.load(Number(d.dataset.i)));
    });
  }

  _buildGame(lesson) {
    if (this.module.tutorial && this.module.tutorial.buildGame) {
      return this.module.tutorial.buildGame(lesson);
    }
    return this.module.engine.createGame(lesson.setup || {});
  }

  _play(game, move) {
    if (this.module.tutorial && this.module.tutorial.play) return this.module.tutorial.play(game, move);
    return game.play(move);
  }

  load(index) {
    this.index = Math.max(0, Math.min(this.lessons.length - 1, index));
    const lesson = this.lessons[this.index];
    this.lesson = lesson;
    this.solved = lesson.task.type === 'next' || lesson.task.type === 'free';

    this.game = this._buildGame(lesson);
    this.view.interactive = !!lesson.interactive;
    this._applyView();
    this._renderContent();

    this._renderProgress();
    this.btnPrev.disabled = this.index === 0;
    this.btnNext.textContent = lesson.task.finish ? '开始对弈' : '下一课';
    this.elFeedback.textContent = '';
    this.elFeedback.className = 'lesson-feedback';
    this.onResize();
  }

  _applyView() {
    const lesson = this.lesson;
    let decor = lesson.decor;
    if (typeof decor === 'function') decor = decor(this.game);
    if (this.view.setDecor) this.view.setDecor(decor || []);
    if (this.view.setHint) this.view.setHint(null);
    if (this.view.setOverlay) this.view.setOverlay(lesson.overlay ? lesson.overlay(this.game) : null);
    this.view.render(this.game);
  }

  _renderContent() {
    const lesson = this.lesson;
    this.elTag.textContent = lesson.tag || '';
    this.elTitle.textContent = lesson.title || '';
    const intro = typeof lesson.intro === 'function' ? lesson.intro(this.game) : lesson.intro || [];
    this.elIntro.innerHTML = intro.map((p) => `<p>${p}</p>`).join('');
    this.elTip.innerHTML = lesson.tip ? `<span class="tip-label">提示</span>${lesson.tip}` : '';
  }

  _handleMove(move) {
    const task = this.lesson.task;

    if (task.type === 'tryIllegal') {
      const illegal = task.isIllegal ? task.isIllegal(this.game, move) : false;
      if (illegal) {
        this._feedback(task.success, 'success');
        this.solved = true;
      } else {
        if (task.allowPlay !== false) {
          const r = this._play(this.game, move);
          if (r && r.ok) this._applyView();
        }
        this._feedback(task.fail || '这个点可以落子，再试试被标出的位置。', 'error');
      }
      return;
    }

    if (task.type === 'move') {
      if (this.solved) return;
      if (task.accept && task.accept(move)) {
        this._play(this.game, move);
        this._applyView();
        this._feedback(task.success, 'success');
        this.solved = true;
      } else {
        this._feedback(task.fail || '这一步还不对，再想一想。', 'error');
      }
      return;
    }

    // free / next：自由操作
    const r = this._play(this.game, move);
    if (r && r.ok) {
      this._applyView();
      if (typeof this.lesson.intro === 'function') this._renderContent();
    }
  }

  _feedback(text, kind) {
    this.elFeedback.textContent = text;
    this.elFeedback.className = `lesson-feedback is-${kind}`;
  }

  next() {
    if (this.lesson.task.finish) {
      this.onFinish();
      return;
    }
    if (!this.solved) {
      this._feedback('先完成本课的小任务再继续吧。', 'error');
      return;
    }
    this.load(this.index + 1);
  }

  prev() {
    if (this.index > 0) this.load(this.index - 1);
  }

  setPalette(p) {
    if (this.view.setPalette) this.view.setPalette(p);
  }

  resize() {
    this.view.resize();
  }

  reset() {
    this.load(0);
  }
}
