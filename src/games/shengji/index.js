// 升级 / 拖拉机（简化版）模块清单

import * as engine from './engine.js';
import * as ai from './ai.js';
import { createView, palettes } from './view.js';
import { lessons, tutorial } from './lessons.js';
import { seatName, teamOf } from './engine.js';

const art = `
  <svg viewBox="0 0 96 96" width="72" height="72">
    <rect x="6" y="6" width="84" height="84" rx="12" fill="#25506e" stroke="#16324a" stroke-width="2"/>
    <rect x="18" y="22" width="26" height="40" rx="5" fill="#fbf7ec" stroke="#b9b0a0" stroke-width="2"/>
    <text x="31" y="48" font-size="15" text-anchor="middle" fill="#1b1b1b" font-family="serif">♠A</text>
    <rect x="42" y="26" width="26" height="40" rx="5" fill="#fbf7ec" stroke="#b9b0a0" stroke-width="2"/>
    <text x="55" y="52" font-size="15" text-anchor="middle" fill="#c0392b" font-family="serif">♥5</text>
    <circle cx="70" cy="66" r="10" fill="#facc15"/>
    <text x="70" y="71" font-size="12" text-anchor="middle" fill="#7a5a00" font-family="serif">10</text>
  </svg>`;

export default {
  id: 'shengji',
  name: '升级 / 拖拉机',
  nameEn: 'Sheng Ji',
  tagline: '亮主抢分，墩牌升级',
  description: '四人两队升级/拖拉机（简化版）：亮主、跟花色、主牌压制与 80 分计分。',
  accent: '#25506e',
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
    { key: 'tS', label: '亮♠' }, { key: 'tH', label: '亮♥' }, { key: 'tD', label: '亮♦' }, { key: 'tC', label: '亮♣' }, { key: 'tN', label: '无主' },
  ],

  createGame() { return new engine.ShengjiGame(); },

  onAction(game, key, view) {
    if (game.ended || game.turn !== 0) return;
    if (game.phase === 'trump') {
      if (key && key[0] === 't') game.play({ type: 'trump', suit: key[1] === 'N' ? 'NT' : key[1] });
      return;
    }
    if (game.phase === 'play' && key === 'play') {
      const sel = view.getSelection(game.hands[0]);
      if (sel.length !== 1) return;
      const r = game.play({ type: 'play', card: sel[0].id });
      if (r.ok) view.clearSelection();
    }
  },

  buttonEnabled(game, key) {
    if (game.ended || game.turn !== 0) return false;
    if (game.phase === 'trump') return key[0] === 't';
    if (game.phase === 'play') return key === 'play';
    return false;
  },

  stats(game) {
    return [0, 1, 2, 3].map((s) => ({
      label: `${seatName(s)}${teamOf(s) === 0 ? '(庄方)' : '(抓分)'}`,
      value: game.hands[s].length,
    }));
  },

  statusLine(game, ctx) {
    if (game.ended) return game.result ? game.result.text : '对局结束';
    if (ctx.thinking) return 'AI 思考中…';
    if (game.phase === 'trump') return game.turn === 0 ? '轮到你亮主（选择主牌花色）' : '等待亮主…';
    if (game.turn === 0) return `轮到你出牌（庄 ${game.points[0]} : 抓 ${game.points[1]}）`;
    return `${seatName(game.turn)} 出牌中…（庄 ${game.points[0]} : 抓 ${game.points[1]}）`;
  },

  dotColor(game) { return teamOf(game.turn) === 0 ? '#25506e' : '#b3261e'; },
};
