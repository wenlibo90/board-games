// 将棋新手教学

import { ShogiGame, BLACK, WHITE, P, L, N, S, G, B, R, K, piece, idx } from './engine.js';

export const lessons = [
  {
    id: 'board',
    tag: '第 1 课',
    title: '认识棋盘与棋子',
    intro: [
      '将棋在 9x9 的棋盘上进行，双方各有 20 枚棋子，<b>先手</b>（下方）先行。',
      '棋子包括：玉将、飛車、角行、金将、銀将、桂馬、香車、歩兵。',
      '吃掉对方的棋子后，可以把它当作自己的棋子重新<b>打入</b>到棋盘空点上，这是将棋最大的特色。',
    ],
    tip: '点击「下一课」继续。',
    setup: { initial: true, turn: BLACK },
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'pawn',
    tag: '第 2 课',
    title: '歩兵的走法',
    intro: [
      '歩兵每次只能向前走一格，不能后退。',
      '下面先手的歩兵位于 (5七)，请把它向前走一格。',
    ],
    tip: '先点歩兵，再点它正前方的格子。',
    setup: {
      turn: BLACK,
      placements: [[WHITE, K, 4, 0], [BLACK, K, 4, 8], [BLACK, P, 4, 6]],
    },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === idx(4, 6) && m.to === idx(4, 5) && !m.promote,
      success: '正确！歩兵向前走一格。',
      fail: '歩兵只能向前走一格，请把 (5七) 的歩兵走到 (5六)。',
    },
    decor: [{ idx: idx(4, 6), kind: 'ring' }, { idx: idx(4, 5), kind: 'dot' }],
  },
  {
    id: 'promote',
    tag: '第 3 课',
    title: '升变（成る）',
    intro: [
      '当棋子走到、走到过或离开<b>敌阵</b>（对方最靠近你的三行）时，可以<b>升变</b>为更强的棋子。',
      '歩、香、桂、銀、角、飛都可以升变；玉将与金将不能升变。',
      '下面歩兵已经进入敌阵，可以升变为「と金」。',
    ],
    tip: '请把歩兵向前走一格，并在弹出的选择中点击「成」。',
    setup: {
      turn: BLACK,
      placements: [[WHITE, K, 4, 0], [BLACK, K, 4, 8], [BLACK, P, 4, 2]],
    },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === idx(4, 2) && m.to === idx(4, 1) && !!m.promote,
      success: '很好！歩兵升变为「と金」，可以像金将一样行走。',
      fail: '请把歩兵向前走一格，并选择「成」进行升变。',
    },
    decor: [{ idx: idx(4, 2), kind: 'ring' }, { idx: idx(4, 1), kind: 'dot' }],
  },
  {
    id: 'drop',
    tag: '第 4 课',
    title: '持驹打入',
    intro: [
      '吃掉的棋子会成为自己的<b>持驹</b>，轮到自己的回合时，可以把它打入到棋盘上任意空点。',
      '打入的棋子一律以未升变的状态放置在空点上。',
      '下面先手持有一枚歩兵，请把它打入到带圆点的空点。',
    ],
    tip: '先点上方「先手持驹」中的歩兵，再点棋盘上带圆点的位置。',
    setup: {
      turn: BLACK,
      placements: [[WHITE, K, 4, 0], [BLACK, K, 4, 8]],
      hands: [null, { [P]: 1, [L]: 0, [N]: 0, [S]: 0, [G]: 0, [B]: 0, [R]: 0 }, { [P]: 0, [L]: 0, [N]: 0, [S]: 0, [G]: 0, [B]: 0, [R]: 0 }],
    },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.drop === P && m.to === idx(4, 4),
      success: '正确！把持驹打入棋盘，是进攻与防守的重要手段。',
      fail: '请先点「先手持驹」里的歩兵，再点棋盘中央带圆点的空点。',
    },
    decor: [{ idx: idx(4, 4), kind: 'dot' }],
  },
];

export const tutorial = {
  buildGame(lesson) {
    const g = new ShogiGame();
    if (lesson.setup && lesson.setup.initial) {
      g.turn = lesson.setup.turn || BLACK;
      return g;
    }
    g.board.fill(0);
    for (const [c, t, x, y] of lesson.setup.placements) g.board[idx(x, y)] = piece(c, t);
    if (lesson.setup.hands) g.hands = lesson.setup.hands.map((h) => (h ? { ...h } : h));
    g.turn = lesson.setup.turn || BLACK;
    g.lastMove = null;
    return g;
  },
};
