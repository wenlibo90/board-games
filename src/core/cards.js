// 扑克牌基础：牌堆构建与洗牌
// 面值 rank：2..10、11=J、12=Q、13=K、14=A；16=小王、17=大王（joker:1/2）

export const SUITS = ['S', 'H', 'D', 'C'];
export const SUIT_SYM = { S: '♠', H: '♥', D: '♦', C: '♣' };
export const RANK_LABEL = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A', 16: '小', 17: '大',
};
export const FACE_RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

let _cid = 1;
export function makeDeck({ jokers = false, copies = 1 } = {}) {
  const out = [];
  for (let c = 0; c < copies; c++) {
    for (const s of SUITS) for (const r of FACE_RANKS) out.push({ id: _cid++, suit: s, rank: r, joker: 0 });
    if (jokers) {
      out.push({ id: _cid++, suit: null, rank: 16, joker: 1 });
      out.push({ id: _cid++, suit: null, rank: 17, joker: 2 });
    }
  }
  return out;
}

export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

export function isRedSuit(s) { return s === 'H' || s === 'D'; }

export function cardLabel(c) {
  if (c.joker) return c.joker === 2 ? '大王' : '小王';
  return SUIT_SYM[c.suit] + RANK_LABEL[c.rank];
}
