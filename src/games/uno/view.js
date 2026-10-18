// UNO 牌桌视图：4 席位、弃牌堆、活动颜色、玩家手牌

import { SEATS, COLOR_NAME } from './engine.js';
import { BoardStage } from '../../core/stage.js';
import { HandUI, drawUnoCard, drawBack, roundRect } from '../../core/cardgfx.js';

export const palettes = {
  light: {
    felt1: '#2f7d4f', felt2: '#256440', cardFace: '#fbf7ec', cardEdge: '#b9b0a0', cardBack: '#2f5aa8',
    sel: '#facc15', text: '#f2f6f2', muted: '#d6e6da', label: '#0d3b24',
  },
  dark: {
    felt1: '#1f4a33', felt2: '#173a28', cardFace: '#f0ece0', cardEdge: '#8a8574', cardBack: '#20386b',
    sel: '#facc15', text: '#e8f0e9', muted: '#a9c3b0', label: '#0b2a19',
  },
};

export function createView(canvas, opts = {}) {
  const palette = opts.palette || palettes.light;
  const state = { game: null, decor: [], hint: null, overlay: null, viewer: opts.viewer !== undefined ? opts.viewer : 0 };
  const hand = new HandUI();

  const stage = new BoardStage(canvas, {
    onPick: (pt) => {
      if (!stage.interactive || !state.game) return;
      const g = state.game;
      if (g.ended || g.turn !== state.viewer) return;
      const c = hand.hit(pt.x, pt.y);
      if (c) { hand.toggle(c); stage.render(); }
    },
  });

  function paint() {
    const ctx = stage.ctx, w = stage.width, h = stage.height;
    if (!state.game || w === 0) return;
    const g = state.game;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, palette.felt1); bg.addColorStop(1, palette.felt2);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

    const cw = Math.min(w, h) * 0.11, chh = cw * 1.5;

    // 其他席位（背面 + 数量）
    const others = [1, 2, 3].map((k) => (state.viewer + k) % SEATS);
    const pos = [
      { x: w * 0.1, y: h * 0.16, label: '左' },
      { x: w * 0.5, y: h * 0.06, label: '上' },
      { x: w * 0.9, y: h * 0.16, label: '右' },
    ];
    others.forEach((seat, i) => {
      const p = pos[i];
      const n = g.hands[seat].length;
      const backN = Math.min(4, n);
      for (let k = 0; k < backN; k++) drawBack(ctx, p.x - cw / 2 + k * cw * 0.28 - cw * 0.4, p.y, cw, chh, palette);
      ctx.fillStyle = palette.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `600 ${Math.max(11, chh * 0.16)}px system-ui, sans-serif`;
      ctx.fillText(`${seat + 1} 号 · ${n} 张`, p.x, p.y + chh + 14);
      if (g.turn === seat && !g.ended) { ctx.strokeStyle = palette.sel; ctx.lineWidth = 3; ctx.strokeRect(p.x - cw / 2 - 4, p.y - 4, cw + 8, chh + 8); }
    });

    // 中央：抽牌堆 + 弃牌堆 + 活动颜色
    const cx = w * 0.5, cy = h * 0.42;
    drawBack(ctx, cx - cw * 1.3, cy - chh / 2, cw, chh, palette);
    const top = g.discard[g.discard.length - 1];
    if (top) drawUnoCard(ctx, cx + cw * 0.3, cy - chh / 2, cw, chh, { ...top, color: g.color === 'W' ? top.color : g.color }, { palette });
    ctx.fillStyle = palette.text; ctx.textAlign = 'center'; ctx.font = `700 ${Math.max(12, chh * 0.2)}px system-ui, sans-serif`;
    ctx.fillText(`活动颜色：${COLOR_NAME[g.color]}`, cx, cy + chh * 0.85);

    // 玩家手牌
    const viewerHand = g.hands[state.viewer];
    const cardW = Math.min(w / 8, h * 0.16);
    const cardH = cardW * 1.5;
    const areaY = h - cardH - 16;
    hand.layout(viewerHand, w * 0.04, areaY, w * 0.92, cardW, cardH, w * 0.92);
    for (const r of hand.rects) {
      const sel = hand.isSelected(r.card);
      drawUnoCard(ctx, r.x, r.y - (sel ? cardH * 0.16 : 0), r.w, r.h, r.card, { palette, selected: sel });
    }
    ctx.fillStyle = palette.text; ctx.textAlign = 'left'; ctx.fillText(`你的手牌 · ${viewerHand.length} 张`, w * 0.04, areaY - 10);

    for (const d of state.decor) {
      if (d.seat == null) continue;
      ctx.fillStyle = d.color || palette.sel;
      ctx.font = `700 ${chh * 0.2}px "PingFang SC", sans-serif`;
      ctx.fillText(d.text || '', 20, 24 + (d.seat * 20));
    }
    if (state.hint && state.hint.id != null) {
      const r = hand.rects.find((x) => x.card.id === state.hint.id);
      if (r) { ctx.strokeStyle = palette.sel; ctx.lineWidth = 4; roundRect(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, r.h * 0.14); ctx.stroke(); }
    }
  }

  stage.bindDraw(() => paint());

  return {
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
