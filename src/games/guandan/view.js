// 掼蛋牌桌视图：四家手牌、出牌区

import { seatName, teamOf } from './engine.js';
import { BoardStage } from '../../core/stage.js';
import { HandUI, drawStandardCard, drawBack } from '../../core/cardgfx.js';

export const palettes = {
  light: { felt1: '#7a4a2b', felt2: '#63391f', cardFace: '#fbf7ec', cardEdge: '#b9b0a0', cardBack: '#2f5aa8', sel: '#facc15', text: '#f6f0e6', muted: '#e0d2bc' },
  dark: { felt1: '#4a2f1b', felt2: '#3a2514', cardFace: '#f0ece0', cardEdge: '#8a8574', cardBack: '#20386b', sel: '#facc15', text: '#ece2d2', muted: '#c3b299' },
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

    const cw = Math.min(w, h) * 0.07, chh = cw * 1.45;
    ctx.textBaseline = 'middle';
    const others = [
      { seat: (state.viewer + 1) % 4, x: w * 0.14, y: h * 0.14 },
      { seat: (state.viewer + 2) % 4, x: w * 0.5, y: h * 0.06 },
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

    const lp = g.lastPlay;
    if (lp && lp.cards) {
      const cs = lp.cards;
      const sp = Math.min(cw * 0.7, (w * 0.6) / cs.length);
      const total = cs.length > 1 ? (cs.length - 1) * sp + cw : cw;
      const sx = (w - total) / 2;
      for (let i = 0; i < cs.length; i++) drawStandardCard(ctx, sx + i * sp, h * 0.36, cw, chh, cs[i], { palette });
      ctx.fillStyle = palette.muted; ctx.textAlign = 'center';
      ctx.fillText(`${seatName(lp.seat)} 出牌`, w / 2, h * 0.36 - 12);
    } else {
      ctx.fillStyle = palette.muted; ctx.textAlign = 'center';
      ctx.fillText('自由出牌', w / 2, h * 0.44);
    }

    const viewerHand = g.hands[state.viewer];
    const cardW = Math.min(w / 16, h * 0.14);
    const cardH = cardW * 1.45;
    const areaY = h - cardH - 14;
    hand.layout(viewerHand, w * 0.03, areaY, w * 0.94, cardW, cardH, w * 0.94);
    for (const r of hand.rects) {
      const sel = hand.isSelected(r.card);
      drawStandardCard(ctx, r.x, r.y - (sel ? cardH * 0.16 : 0), r.w, r.h, r.card, { palette, selected: sel });
    }
    ctx.fillStyle = palette.text; ctx.textAlign = 'left';
    ctx.font = `600 ${cardH * 0.2}px system-ui, sans-serif`;
    ctx.fillText(`你的手牌 · ${viewerHand.length} 张`, w * 0.03, areaY - 8);

    if (state.hint && state.hint.cards) {
      const ids = new Set(state.hint.cards);
      for (const r of hand.rects) if (ids.has(r.card.id)) { ctx.strokeStyle = palette.sel; ctx.lineWidth = 4; ctx.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4); }
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
