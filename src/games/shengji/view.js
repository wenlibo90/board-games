// 升级 / 拖拉机 牌桌视图（简化）

import { seatName, teamOf, SUIT_NAME, LEVEL, POINTS } from './engine.js';
import { BoardStage } from '../../core/stage.js';
import { HandUI, drawStandardCard, drawBack } from '../../core/cardgfx.js';

export const palettes = {
  light: { felt1: '#25506e', felt2: '#1c3f57', cardFace: '#fbf7ec', cardEdge: '#b9b0a0', cardBack: '#3b4a8a', sel: '#facc15', text: '#eef4f8', muted: '#cfe0ea' },
  dark: { felt1: '#183449', felt2: '#122838', cardFace: '#f0ece0', cardEdge: '#8a8574', cardBack: '#26356b', sel: '#facc15', text: '#e2ecf2', muted: '#a9c4d4' },
};

export function createView(canvas, opts = {}) {
  const palette = opts.palette || palettes.light;
  const state = { game: null, decor: [], hint: null, overlay: null, viewer: opts.viewer !== undefined ? opts.viewer : 0 };
  const hand = new HandUI();

  const stage = new BoardStage(canvas, {
    onPick: (pt) => {
      if (!stage.interactive || !state.game) return;
      const g = state.game;
      if (g.ended || g.phase !== 'play' || g.turn !== state.viewer) return;
      const c = hand.hit(pt.x, pt.y);
      if (c) { hand.selected.clear(); hand.selected.add(c.id); stage.render(); }
    },
  });

  function paint() {
    const ctx = stage.ctx, w = stage.width, h = stage.height;
    if (!state.game || w === 0) return;
    const g = state.game;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, palette.felt1); bg.addColorStop(1, palette.felt2);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

    const cw = Math.min(w, h) * 0.075, chh = cw * 1.45;
    ctx.textBaseline = 'middle';

    // 对手
    const others = [
      { seat: (state.viewer + 1) % 4, x: w * 0.14, y: h * 0.14 },
      { seat: (state.viewer + 2) % 4, x: w * 0.5, y: h * 0.05 },
      { seat: (state.viewer + 3) % 4, x: w * 0.86, y: h * 0.14 },
    ];
    for (const o of others) {
      const n = g.hands[o.seat].length;
      const backN = Math.min(3, n);
      for (let k = 0; k < backN; k++) drawBack(ctx, o.x - cw / 2 + k * cw * 0.3 - cw * 0.35, o.y, cw, chh, palette);
      ctx.fillStyle = palette.text; ctx.textAlign = 'center';
      ctx.font = `600 ${Math.max(11, chh * 0.18)}px system-ui, sans-serif`;
      const tag = teamOf(o.seat) === teamOf(state.viewer) ? ' · 我方' : ' · 对方';
      ctx.fillText(`${seatName(o.seat)} · ${n} 张${tag}`, o.x, o.y + chh + 12);
      if (g.turn === o.seat && !g.ended) { ctx.strokeStyle = palette.sel; ctx.lineWidth = 3; ctx.strokeRect(o.x - cw / 2 - 4, o.y - 4, cw + 8, chh + 8); }
    }

    // 中央：本墩
    const cx = w / 2, cy = h * 0.4;
    if (g.trick.length === 0) {
      ctx.fillStyle = palette.muted; ctx.textAlign = 'center';
      ctx.fillText(g.phase === 'trump' ? '等待亮主…' : '本墩出牌区', cx, cy);
    } else {
      const n = g.trick.length;
      const sp = cw * 0.85;
      const startX = cx - (n - 1) * sp / 2;
      for (let i = 0; i < n; i++) {
        const t = g.trick[i];
        drawStandardCard(ctx, startX + i * sp - cw / 2, cy - chh / 2, cw, chh, t.card, { palette });
        ctx.fillStyle = palette.muted; ctx.textAlign = 'center';
        ctx.font = `600 ${chh * 0.16}px system-ui, sans-serif`;
        ctx.fillText(seatName(t.seat), startX + i * sp, cy + chh / 2 + 12);
      }
    }

    // 信息条
    ctx.fillStyle = palette.text; ctx.textAlign = 'center';
    ctx.font = `700 ${chh * 0.2}px system-ui, sans-serif`;
    const trumpTxt = g.phase === 'trump' ? '请亮主（选花色）' : `主牌：${g.trumpSuit ? SUIT_NAME[g.trumpSuit] : '无主'} · 级牌 ${LEVEL}`;
    ctx.fillText(trumpTxt, cx, h * 0.62);
    ctx.fillText(`庄方 ${g.points[0]} 分 · 抓分方 ${g.points[1]} / 80`, cx, h * 0.66);

    // 玩家手牌
    const viewerHand = g.hands[state.viewer];
    const cardW = Math.min(w / 14, h * 0.13);
    const cardH = cardW * 1.45;
    const areaY = h - cardH - 14;
    hand.layout(viewerHand, w * 0.03, areaY, w * 0.94, cardW, cardH, w * 0.94);
    for (const r of hand.rects) {
      const sel = hand.isSelected(r.card);
      drawStandardCard(ctx, r.x, r.y - (sel ? cardH * 0.18 : 0), r.w, r.h, r.card, { palette, selected: sel });
    }
    ctx.fillStyle = palette.text; ctx.textAlign = 'left';
    ctx.font = `600 ${cardH * 0.22}px system-ui, sans-serif`;
    ctx.fillText(`你的手牌 · ${viewerHand.length} 张`, w * 0.03, areaY - 8);

    if (state.hint && state.hint.card != null) {
      const r = hand.rects.find((x) => x.card.id === state.hint.card);
      if (r) { ctx.strokeStyle = palette.sel; ctx.lineWidth = 4; ctx.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4); }
    }
  }

  stage.bindDraw(() => paint());

  return {
    state,
    get interactive() { return stage.interactive; },
    set interactive(v) { stage.interactive = v; stage.render(); },
    setViewer(v) { state.viewer = v; hand.clear(); stage.render(); },
    setPalette(p) { Object.assign(palette, p); stage.render(); },
    setDecor(l) { state.decor = l || []; },
    setHint(m) { state.hint = m || null; },
    setOverlay() {},
    getSelection(cards) { return hand.getSelection(cards || (state.game ? state.game.hands[state.viewer] : [])); },
    clearSelection() { hand.clear(); },
    render(game) { if (game) { if (game !== state.game) hand.clear(); state.game = game; } stage.render(); },
    resize() { stage.resize(); },
  };
}
