// 默认皮肤挂载器（仅浏览器）
// 用每个棋种自带的 view 在任意容器里渲染「原始棋牌」，无需调用方写任何界面代码。
// 用户想自定义皮肤时改用自己的 index.html + Arena.create()，不用本模块。

import { loadGame } from '../platform/games-meta.js';

const STYLE_ID = 'arena-default-style';
const CSS = `
.arena-root { width: 100%; max-width: 640px; margin: 0 auto; box-sizing: border-box;
  font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; color: #e8eaed; }
.arena-board { position: relative; width: 100%; aspect-ratio: 1 / 1; border-radius: 12px;
  overflow: hidden; background: #1b1e24; box-shadow: 0 10px 28px rgba(0,0,0,.35); }
.arena-board canvas { display: block; width: 100%; height: 100%; touch-action: none; }
.arena-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px;
  margin-top: 10px; flex-wrap: wrap; }
.arena-status { font-size: 13px; color: #8b96ba; letter-spacing: 0.04em; }
.arena-actions { display: flex; gap: 16px; margin-left: auto; }
.arena-btn { font: inherit; font-size: 13px; padding: 0; border: 0; background: none; cursor: pointer;
  color: #8b96ba; letter-spacing: 0.04em; transition: color 0.2s ease; }
.arena-btn:hover { color: #e8eaed; }
.arena-err { padding: 16px; border: 1px solid #5a2222; border-radius: 10px; background: #2a1414;
  color: #ffb4b4; font-size: 13px; }
`;

function ensureStyle() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

const ASPECT = {
  xiangqi: '9 / 10', janggi: '9 / 10', shogi: '9 / 10', jungle: '7 / 9',
};

function resolveSide(mod, side) {
  const spec = (mod.setup || []).find((s) => s.key === 'humanColor');
  const fallback = spec ? spec.default : 1;
  if (side === undefined || side === null || side === '') return fallback;
  if (typeof side === 'number') return side;
  const eng = mod.engine || {};
  const named = { red: eng.RED, black: eng.BLACK, white: eng.WHITE, blue: eng.BLUE };
  const key = String(side).toLowerCase();
  if (named[key] !== undefined) return named[key];
  const num = Number(side);
  return Number.isNaN(num) ? fallback : num;
}

/**
 * 在容器元素内挂载一局游戏（默认皮肤）。
 * @param {HTMLElement|string} target 容器元素或选择器
 * @param {{game?:string, size?:number, side?:any, difficulty?:string, theme?:string, aspect?:string}} [options]
 * @returns {Promise<{el:HTMLElement, board:HTMLElement, api:object}>}
 */
export async function mount(target, options = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) throw new Error('[arena] 找不到挂载容器');

  const id = options.game || el.dataset.arena || 'xiangqi';
  ensureStyle();

  const root = document.createElement('div');
  root.className = 'arena-root';
  const board = document.createElement('div');
  board.className = 'arena-board';
  board.style.aspectRatio = options.aspect || el.dataset.aspect || ASPECT[id] || '1 / 1';
  const canvas = document.createElement('canvas');
  board.appendChild(canvas);
  const bar = document.createElement('div');
  bar.className = 'arena-bar';
  const status = document.createElement('span');
  status.className = 'arena-status';
  status.textContent = '加载中…';
  const actions = document.createElement('span');
  actions.className = 'arena-actions';
  actions.innerHTML = '<button class="arena-btn" data-arena-act="restart">重开</button>' +
    '<button class="arena-btn" data-arena-act="ai">AI 走一步</button>';
  bar.append(status, actions);
  root.append(board, bar);
  el.append(root);

  const mod = await loadGame(id);
  if (!mod) {
    status.textContent = '';
    root.innerHTML = `<div class="arena-err">未知棋种：${id}</div>`;
    throw new Error(`[arena] 未知棋种: ${id}`);
  }

  const theme = options.theme || el.dataset.theme || 'light';
  const difficulty = options.difficulty || el.dataset.difficulty || 'hard';
  const size = options.size || (el.dataset.size ? Number(el.dataset.size) : undefined);
  const humanColor = resolveSide(mod, options.side !== undefined ? options.side : el.dataset.side);

  let gameObj = null;
  let view = null;
  let aiTimer = 0;

  function build() {
    const config = { humanColor };
    if (size) { config.size = size; config.boardSize = size; }
    gameObj = mod.createGame(config);
    view = mod.createView(canvas, {
      palette: mod.palettes ? mod.palettes[theme] : undefined,
      viewer: humanColor,
      onMove: (move) => humanMove(move),
    });
    view.render(gameObj);
    setTimeout(() => view && view.resize(), 30);
    paint();
  }

  function paint() {
    if (typeof mod.statusLine === 'function') {
      status.textContent = mod.statusLine(gameObj, { humanColor, thinking: false });
    } else {
      status.textContent = gameObj.ended ? '对局结束' : '进行中';
    }
  }

  function humanMove(move) {
    if (!gameObj || gameObj.ended || gameObj.turn !== humanColor) return;
    const r = gameObj.play(move);
    if (!r || !r.ok) return;
    view.render(gameObj);
    paint();
    scheduleAI();
  }

  function scheduleAI() {
    clearTimeout(aiTimer);
    if (!gameObj || gameObj.ended || gameObj.turn === humanColor) { paint(); return; }
    aiTimer = setTimeout(() => {
      if (!gameObj || gameObj.ended) return;
      const mv = mod.ai && mod.ai.move ? mod.ai.move(gameObj, difficulty) : null;
      if (mv === undefined || mv === null) { paint(); return; }
      gameObj.play(mv);
      view.render(gameObj);
      paint();
      scheduleAI();
    }, options.aiDelay || 320);
  }

  actions.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-arena-act]');
    if (!btn) return;
    const act = btn.dataset.arenaAct;
    if (act === 'restart') { clearTimeout(aiTimer); build(); scheduleAI(); }
    else if (act === 'ai') { scheduleAI(); }
  });

  build();
  scheduleAI();

  const api = {
    id,
    get state() { return gameObj; },
    legalMoves: (...a) => (gameObj.legalMoves ? gameObj.legalMoves(...a) : gameObj.legalPlays ? gameObj.legalPlays(...a) : []),
    play: (m) => gameObj.play(m),
    reset: () => { clearTimeout(aiTimer); build(); scheduleAI(); },
    render: () => { view.render(gameObj); paint(); },
    destroy: () => { clearTimeout(aiTimer); root.remove(); },
  };
  return { el: root, board, api };
}

/** 扫描页面内所有 [data-arena] 容器并自动挂载。 */
export function autoMount(scope = document) {
  const nodes = scope.querySelectorAll('[data-arena]');
  return Promise.all([...nodes].map((node) => mount(node).catch((err) => {
    console.error(err);
    return null;
  })));
}

export default { mount, autoMount };
