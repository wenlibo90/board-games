// 斗地主牌型解析与比较
// rank 面值：3..14(A)、2=2、16=小王、17=大王；order 用于比较：2→15，其余同面值

export function order(rank) { return rank === 2 ? 15 : rank; }

export function sortDesc(cards) { return cards.slice().sort((a, b) => order(b.rank) - order(a.rank) || a.id - b.id); }

function countsMap(cards) {
  const m = new Map();
  for (const c of cards) m.set(c.rank, (m.get(c.rank) || 0) + 1);
  return m;
}
function consecutive(ranks) {
  const o = ranks.map(order).sort((a, b) => a - b);
  for (let i = 1; i < o.length; i++) if (o[i] !== o[i - 1] + 1) return false;
  return true;
}

export function parseCombo(cards) {
  const n = cards.length;
  if (n === 0) return null;
  const cm = countsMap(cards);
  const groups = [...cm.entries()].map(([rank, cnt]) => ({ rank, cnt }));
  const maxOrder = Math.max(...groups.map((g) => order(g.rank)));

  if (n >= 2 && cm.has(16) && cm.has(17) && [...cards].every((c) => c.rank >= 16)) return { type: 'rocket', main: 17, len: 1, size: n };
  if (n >= 4 && cm.size === 1) return { type: 'bomb', main: maxOrder, len: 1, size: n };
  if (cm.size === 1) {
    const o = order(cards[0].rank);
    if (n === 1) return { type: 'single', main: o, len: 1, size: 1 };
    if (n === 2) return { type: 'pair', main: o, len: 1, size: 2 };
    if (n === 3) return { type: 'trio', main: o, len: 1, size: 3 };
  }
  if (n === 4 && cm.size === 2) {
    const t = groups.find((g) => g.cnt === 3);
    if (t) return { type: 'trio1', main: order(t.rank), len: 1, size: 4 };
  }
  if (n === 5 && cm.size === 2) {
    const t = groups.find((g) => g.cnt === 3);
    const p = groups.find((g) => g.cnt === 2);
    if (t && p) return { type: 'trio2', main: order(t.rank), len: 1, size: 5 };
  }
  const distinct = groups.map((g) => g.rank).sort((a, b) => order(a) - order(b));
  const minOrder = Math.min(...groups.map((g) => order(g.rank)));
  if (n >= 5 && cm.size === n && consecutive(distinct) && maxOrder <= 14 && minOrder >= 3) {
    return { type: 'straight', main: maxOrder, len: n, size: n };
  }
  if (n >= 6 && n % 2 === 0 && groups.every((g) => g.cnt === 2) && consecutive(distinct) && maxOrder <= 14) {
    return { type: 'pairs', main: maxOrder, len: groups.length, size: n };
  }
  if (n >= 6 && n % 3 === 0 && groups.every((g) => g.cnt === 3) && consecutive(distinct) && maxOrder <= 14) {
    return { type: 'plane', main: maxOrder, len: groups.length, size: n };
  }
  const trios = groups.filter((g) => g.cnt === 3).map((g) => g.rank).sort((a, b) => order(a) - order(b));
  if (trios.length >= 2 && consecutive(trios)) {
    const tLen = trios.length;
    const consume = new Map(); for (const r of trios) consume.set(r, 3);
    const rest = [];
    for (const c of cards) { if (consume.get(c.rank) > 0) consume.set(c.rank, consume.get(c.rank) - 1); else rest.push(c); }
    const main = Math.max(...trios.map(order));
    if (rest.length === tLen) return { type: 'plane1', main, len: tLen, size: n };
    if (rest.length === tLen * 2) {
      const rc = new Map(); for (const c of rest) rc.set(c.rank, (rc.get(c.rank) || 0) + 1);
      if ([...rc.values()].every((v) => v === 2)) return { type: 'plane2', main, len: tLen, size: n };
    }
  }
  const four = groups.find((g) => g.cnt === 4);
  if (four) {
    const rest = cards.filter((c) => c.rank !== four.rank);
    const rc = new Map(); for (const c of rest) rc.set(c.rank, (rc.get(c.rank) || 0) + 1);
    if (n === 6 && [...rc.values()].every((v) => v === 1)) return { type: 'four2', main: order(four.rank), len: 1, size: 6 };
    if (n === 8 && rc.size === 2 && [...rc.values()].every((v) => v === 2)) return { type: 'four2p', main: order(four.rank), len: 1, size: 8 };
  }
  return null;
}

export function beats(a, b) {
  if (!a) return false;
  if (!b) return true;
  if (a.type === 'rocket') return true;
  if (b.type === 'rocket') return false;
  if (a.type === 'bomb' && b.type !== 'bomb') return true;
  if (b.type === 'bomb' && a.type !== 'bomb') return false;
  if (a.type !== b.type) return false;
  if (a.len !== b.len) return false;
  return a.main > b.main;
}

// 依据分组生成“取 count 张最小同点”辅助
function rankGroups(hand) {
  const m = new Map();
  for (const c of hand) { if (!m.has(c.rank)) m.set(c.rank, []); m.get(c.rank).push(c); }
  return [...m.entries()].map(([rank, cards]) => ({ rank, cards, o: order(rank) })).sort((a, b) => a.o - b.o);
}

function pickWings(hand, used, sizePer, count) {
  const g = rankGroups(hand).filter((x) => !used.has(x.rank) && x.cards.length >= sizePer);
  const out = [];
  for (const x of g) {
    if (out.length >= count) break;
    // 不拆炸弹/王炸
    if (x.cards.length === 4) continue;
    out.push(x.cards.slice(0, sizePer));
  }
  const flat = out.flat();
  return flat.length === count * sizePer ? flat : null;
}

// 在 hand 中寻找能压过 last 的最小牌组；找不到返回 null
export function findBeat(hand, last) {
  const groups = rankGroups(hand);
  const bombs = groups.filter((g) => g.cards.length === 4).map((g) => g.cards.slice(0, 4));
  const rocket = (hand.find((c) => c.rank === 16) && hand.find((c) => c.rank === 17)) ? [hand.find((c) => c.rank === 16), hand.find((c) => c.rank === 17)] : null;

  const tryType = (type) => {
    if (type === 'single') { const g = groups.find((x) => x.o > last.main && x.cards.length >= 1 && x.cards.length < 4); return g ? [g.cards[0]] : null; }
    if (type === 'pair') { const g = groups.find((x) => x.o > last.main && x.cards.length >= 2 && x.cards.length < 4); return g ? g.cards.slice(0, 2) : null; }
    if (type === 'trio') { const g = groups.find((x) => x.o > last.main && x.cards.length >= 3); return g ? g.cards.slice(0, 3) : null; }
    if (type === 'trio1' || type === 'trio2') {
      for (const g of groups) {
        if (g.o <= last.main || g.cards.length < 3) continue;
        const used = new Set([g.rank]);
        const wings = pickWings(hand, used, type === 'trio1' ? 1 : 2, 1);
        if (wings) return g.cards.slice(0, 3).concat(wings);
      }
      return null;
    }
    if (type === 'straight' || type === 'pairs' || type === 'plane') {
      const per = type === 'straight' ? 1 : type === 'pairs' ? 2 : 3;
      const len = last.len;
      const pool = groups.filter((x) => x.cards.length >= per && x.o <= 14);
      for (let i = 0; i + len <= pool.length; i++) {
        const seg = pool.slice(i, i + len);
        if (order(seg[seg.length - 1].rank) > last.main && consecutive(seg.map((s) => s.rank))) {
          return seg.flatMap((s) => s.cards.slice(0, per));
        }
      }
      return null;
    }
    if (type === 'plane1' || type === 'plane2') {
      const tLen = last.len;
      const pool = groups.filter((x) => x.cards.length >= 3 && x.o <= 14);
      for (let i = 0; i + tLen <= pool.length; i++) {
        const seg = pool.slice(i, i + tLen);
        if (order(seg[seg.length - 1].rank) > last.main && consecutive(seg.map((s) => s.rank))) {
          const used = new Set(seg.map((s) => s.rank));
          const wings = pickWings(hand, used, type === 'plane1' ? 1 : 2, tLen);
          if (wings) return seg.flatMap((s) => s.cards.slice(0, 3)).concat(wings);
        }
      }
      return null;
    }
    return null;
  };

  if (last.type !== 'bomb' && last.type !== 'rocket') {
    const same = tryType(last.type);
    if (same && beats(parseCombo(same), last)) return same;
  }
  // 炸弹
  for (const b of bombs) { const combo = parseCombo(b); if (beats(combo, last)) return b; }
  if (rocket && beats(parseCombo(rocket), last)) return rocket;
  return null;
}

// 首出：选择一个较小的组合（尽量出单张/对子/顺子）
export function leadPlay(hand) {
  const groups = rankGroups(hand);
  // 顺子优先（长度>=5 单顺）
  const singles = groups.filter((g) => g.cards.length === 1 && g.o <= 14);
  if (singles.length >= 5) {
    for (let i = 0; i + 5 <= singles.length; i++) {
      const seg = singles.slice(i, i + 5);
      if (consecutive(seg.map((s) => s.rank))) return seg.map((s) => s.cards[0]);
    }
  }
  // 最小单张
  return [groups[0].cards[0]];
}
