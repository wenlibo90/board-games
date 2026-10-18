// UNO 模块清单

import * as engine from './engine.js';
import * as ai from './ai.js';
import { createView, palettes } from './view.js';
import { lessons, tutorial } from './lessons.js';
import { seatName, COLORS } from './engine.js';

const art = `
  <svg viewBox="0 0 96 96" width="72" height="72">
    <rect x="8" y="14" width="34" height="52" rx="8" fill="#e2422f" stroke="#7a1f16" stroke-width="2" transform="rotate(-12 25 40)"/>
    <rect x="40" y="20" width="34" height="52" rx="8" fill="#2f6fd0" stroke="#16376b" stroke-width="2" transform="rotate(6 57 46)"/>
    <ellipse cx="57" cy="48" rx="15" ry="9" fill="#fbf7ec" transform="rotate(6 57 46)"/>
    <text x="57" y="54" font-size="16" font-weight="800" text-anchor="middle" fill="#2f6fd0" transform="rotate(6 57 46)">7</text>
  </svg>`;

function bestColor(game, seat) {
  const cnt = { R: 0, Y: 0, G: 0, B: 0 };
  for (const c of game.hands[seat]) if (cnt[c.color] !== undefined) cnt[c.color]++;
  let best = 'R', bv = -1;
  for (const k of COLORS) if (cnt[k] > bv) { bv = cnt[k]; best = k; }
  return best;
}

export default {
  id: 'uno',
  name: 'UNO',
  nameEn: 'UNO',
  tagline: '同色同数，先出完获胜',
  description: '经典 UNO：4 人对局，含跳过、反转、+2、变色与 +4 等全部功能牌。',
  accent: '#e2422f',
  art,
  palettes,
  createView,
  lessons,
  tutorial,
  engine,
  ai: {
    move: (game, difficulty) => ai.chooseMove(game, difficulty),
    hint: (game, color) => ai.suggestMove(game, color),
  },
  setup: [],
  supports: { undo: true, hint: true, resign: true, pass: false, estimate: false },
  helpers: [],
  buttons: [
    { key: 'play', label: '出牌', tone: 'primary' },
    { key: 'draw', label: '抽牌' },
    { key: 'pass', label: '不要' },
    { key: 'cR', label: '红' },
    { key: 'cY', label: '黄' },
    { key: 'cG', label: '绿' },
    { key: 'cB', label: '蓝' },
  ],

  createGame() { return new engine.UnoGame(); },

  onAction(game, key, view) {
    if (game.ended || game.turn !== 0) return;
    if (key.length === 2 && key[0] === 'c') { game.humanWildColor = key[1]; return; }
    if (key === 'play') {
      const sel = view.getSelection(game.hands[0]);
      if (sel.length !== 1) return;
      const c = sel[0];
      const mv = { type: 'play', id: c.id };
      if (c.color === 'W') mv.color = game.humanWildColor || bestColor(game, 0);
      game.play(mv);
      view.clearSelection();
    } else if (key === 'draw') {
      game.play({ type: 'draw' });
      view.clearSelection();
    } else if (key === 'pass') {
      game.play({ type: 'pass' });
      view.clearSelection();
    }
  },

  buttonEnabled(game, key) {
    if (game.ended || game.turn !== 0) return false;
    const legal = game.legalPlays(0).length > 0;
    if (key === 'pass') return game.phase === 'afterDraw';
    if (key === 'draw') return game.phase === 'play' && !legal;
    if (key === 'play') return legal;
    if (key.length === 2 && key[0] === 'c') return legal;
    return true;
  },

  stats(game) {
    return [0, 1, 2, 3].map((s) => ({ label: seatName(s), value: game.hands[s].length }));
  },

  statusLine(game, ctx) {
    if (game.ended) return game.result ? game.result.text : '对局结束';
    if (ctx.thinking) return 'AI 思考中…';
    if (game.turn === ctx.humanColor) {
      if (game.phase === 'afterDraw') return `轮到你：可出刚抽到的牌，或点「不要」`;
      return game.legalPlays(0).length ? '轮到你出牌（选择手牌后点「出牌」）' : '轮到你：无可出牌，请点「抽牌」';
    }
    return `对手回合：${seatName(game.turn)}`;
  },

  dotColor(game) { return ['#e2422f', '#e8b62a', '#3faa4d', '#2f6fd0'][game.turn] || '#888'; },
};
