// 牌面绘制与手牌布局工具

import { RANK_LABEL, SUIT_SYM, isRedSuit } from './cards.js';

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawBack(ctx, x, y, w, h, palette) {
  roundRect(ctx, x, y, w, h, h * 0.14);
  ctx.fillStyle = palette.cardBack || '#2f5aa8';
  ctx.fill();
  ctx.strokeStyle = palette.cardEdge || '#1e3d73';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x + w * 0.12, y + h * 0.1, w * 0.76, h * 0.8, h * 0.1);
  ctx.stroke();
}

export function drawStandardCard(ctx, x, y, w, h, c, o = {}) {
  const palette = o.palette || {};
  roundRect(ctx, x, y, w, h, h * 0.14);
  ctx.fillStyle = palette.cardFace || '#fbf7ec';
  ctx.fill();
  ctx.strokeStyle = o.selected ? (palette.sel || '#0d9488') : (palette.cardEdge || '#b9b0a0');
  ctx.lineWidth = o.selected ? 3 : 1.5;
  ctx.stroke();
  if (o.dim) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; roundRect(ctx, x, y, w, h, h * 0.14); ctx.fill(); }

  const red = c.joker ? (c.joker === 2 ? '#c0392b' : '#2b2b2b') : (isRedSuit(c.suit) ? '#c0392b' : '#1b1b1b');
  ctx.fillStyle = red;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const top = c.joker ? (c.joker === 2 ? '大' : '小') : RANK_LABEL[c.rank];
  ctx.font = `700 ${h * 0.24}px system-ui, "PingFang SC", sans-serif`;
  ctx.fillText(top, x + w * 0.1, y + h * 0.06);
  if (c.joker) {
    ctx.fillText('王', x + w * 0.1, y + h * 0.32);
  } else {
    ctx.font = `${h * 0.26}px serif`;
    ctx.fillStyle = red;
    ctx.fillText(SUIT_SYM[c.suit], x + w * 0.1, y + h * 0.32);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${h * 0.46}px serif`;
  ctx.fillStyle = red;
  ctx.fillText(c.joker ? '王' : SUIT_SYM[c.suit], x + w / 2, y + h * 0.62);
}

const UNO_COLORS = { R: '#e2422f', Y: '#e8b62a', G: '#3faa4d', B: '#2f6fd0', W: '#242424' };
const UNO_LABEL = { skip: '⊘', rev: '⇄', draw2: '+2', wild: 'W', wild4: '+4' };
export const UNO_COLOR_NAME = { R: '红', Y: '黄', G: '绿', B: '蓝', W: '无色' };

export function drawUnoCard(ctx, x, y, w, h, c, o = {}) {
  const palette = o.palette || {};
  const base = UNO_COLORS[c.color] || '#444';
  roundRect(ctx, x, y, w, h, h * 0.16);
  ctx.fillStyle = base;
  ctx.fill();
  if (c.color === 'W') {
    // 四色扇形
    const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) * 0.42;
    const cols = ['#e2422f', '#e8b62a', '#3faa4d', '#2f6fd0'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = cols[i];
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, (i * Math.PI) / 2 - Math.PI / 4, ((i + 1) * Math.PI) / 2 - Math.PI / 4);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.save();
  ctx.beginPath();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(-0.5);
  const ew = w * 0.66, eh = h * 0.42;
  roundRect(ctx, -ew / 2, -eh / 2, ew, eh, eh * 0.4);
  ctx.fillStyle = '#fbf7ec';
  ctx.fill();
  ctx.restore();
  const label = /\d|draw/.test(String(c.value)) ? (typeof c.value === 'string' && c.value.startsWith('draw') ? '' : String(c.value)) : (UNO_LABEL[c.value] || '');
  ctx.fillStyle = base === '#242424' ? '#e8b62a' : base;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${h * 0.34}px system-ui, sans-serif`;
  ctx.fillText(label || UNO_LABEL[c.value] || '', x + w / 2, y + h / 2 + 1);

  if (o.selected) {
    roundRect(ctx, x, y, w, h, h * 0.16);
    ctx.strokeStyle = palette.sel || '#0d9488';
    ctx.lineWidth = 3.5;
    ctx.stroke();
  }
}

// 手牌布局与选择
export class HandUI {
  constructor() { this.rects = []; this.selected = new Set(); }

  layout(cards, areaX, areaY, areaW, cardW, cardH, maxSpan) {
    const n = cards.length;
    let step = cardW * 0.62;
    if (n > 1) {
      const total = (n - 1) * step + cardW;
      if (total > maxSpan) step = (maxSpan - cardW) / (n - 1);
    }
    const total = n > 1 ? (n - 1) * step + cardW : cardW;
    const startX = areaX + (areaW - total) / 2;
    this.rects = cards.map((c, i) => ({ card: c, x: startX + i * step, y: areaY, w: cardW, h: cardH }));
    return this.rects;
  }

  hit(px, py) {
    for (let i = this.rects.length - 1; i >= 0; i--) {
      const r = this.rects[i];
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return r.card;
    }
    return null;
  }

  toggle(card) {
    if (this.selected.has(card.id)) this.selected.delete(card.id);
    else this.selected.add(card.id);
  }

  isSelected(card) { return this.selected.has(card.id); }
  getSelection(cards) { return cards.filter((c) => this.selected.has(c.id)); }
  clear() { this.selected.clear(); }
}
