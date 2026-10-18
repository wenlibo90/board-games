// 中国象棋新手教学课程与适配器

import { XiangqiGame, RED, BLACK, K, A, E, H, R, C, P, piece, idx, PIECE_LABEL } from './engine.js';

const R_K = idx(4, 9);
const R_K2 = idx(4, 0);

function draw(placements) {
  return placements;
}

export const lessons = [
  {
    id: 'board',
    tag: '第 1 课',
    title: '认识棋盘与棋子',
    intro: [
      '中国象棋棋盘由 9 条竖线、10 条横线交叉而成，棋子走在交叉点上。',
      '棋盘中间的空白叫<b>楚河汉界</b>，两端各有一个带斜线的区域叫<b>九宫</b>，是将帅活动的地方。',
      '红方与黑方各有 16 个棋子：车、马、相（象）、仕（士）、帅（将）、炮、兵（卒）。红方先行。',
    ],
    tip: '点击「下一课」继续。',
    setup: { initial: true, turn: RED },
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'rook',
    tag: '第 2 课',
    title: '车的走法',
    intro: [
      '<b>车</b>走直线：可以横走或竖走，格数不限，直到被棋子挡住。',
      '如果挡路的是对方棋子，就可以把它吃掉。',
    ],
    tip: '请用车吃掉上方的黑卒：先点车，再点目标格。',
    setup: {
      turn: RED,
      placements: [
        [RED, K, 4, 9], [BLACK, K, 4, 0],
        [RED, R, 4, 5], [BLACK, P, 4, 1],
      ],
    },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === idx(4, 5) && m.to === idx(4, 1),
      success: '正确！车沿竖线直冲而上，吃掉了黑卒，这就是车的威力。',
      fail: '车只能走直线。请让车沿同一条直线直接吃到黑卒。',
    },
    decor: [
      { idx: idx(4, 5), kind: 'ring' },
      { idx: idx(4, 1), kind: 'ring', color: '#dc2626' },
    ],
  },
  {
    id: 'horse',
    tag: '第 3 课',
    title: '马的走法',
    intro: [
      '<b>马</b>走「日」字：先直一步，再斜一步。',
      '如果直行方向紧挨着有棋子，马就被「蹩马腿」，这个方向跳不了。',
    ],
    tip: '请把马跳到上方任意一个标记处。',
    setup: {
      turn: RED,
      placements: [
        [RED, K, 4, 9], [BLACK, K, 4, 0],
        [RED, H, 4, 5],
      ],
    },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === idx(4, 5) && (m.to === idx(3, 3) || m.to === idx(5, 3)),
      success: '很好！马走日字，向前上方跳两格。',
      fail: '马走「日」字：向前一格再斜一格。试试跳到带圆圈的格子。',
    },
    decor: [
      { idx: idx(4, 5), kind: 'ring' },
      { idx: idx(3, 3), kind: 'dot', color: '#0d9488' },
      { idx: idx(5, 3), kind: 'dot', color: '#0d9488' },
    ],
  },
  {
    id: 'cannon',
    tag: '第 4 课',
    title: '炮的吃子',
    intro: [
      '<b>炮</b>走直线，与车类似，但吃子方式不同。',
      '炮吃子时必须<b>隔着恰好一个棋子</b>（叫炮架）跳到对面，吃掉那个棋子。',
    ],
    tip: '请用炮隔子吃掉正上方的黑车。',
    setup: {
      turn: RED,
      placements: [
        [RED, K, 4, 9], [BLACK, K, 4, 0],
        [RED, C, 4, 7], [BLACK, P, 4, 4], [BLACK, R, 4, 2],
      ],
    },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === idx(4, 7) && m.to === idx(4, 2),
      success: '漂亮！炮隔着黑卒当炮架，吃掉了对面的黑车。',
      fail: '炮吃子要隔着恰好一个棋子。请让炮越过中间的黑卒吃掉黑车。',
    },
    decor: [
      { idx: idx(4, 7), kind: 'ring' },
      { idx: idx(4, 4), kind: 'label', text: '炮架', color: '#c2410c' },
      { idx: idx(4, 2), kind: 'ring', color: '#dc2626' },
    ],
  },
  {
    id: 'check',
    tag: '第 5 课',
    title: '将军与将死',
    intro: [
      '当一方的棋子下一步就能吃掉对方将帅时，叫<b>将军</b>。',
      '被将军的一方必须立刻应对：移开将帅、吃掉进攻棋子，或用别的棋子挡住。',
      '如果无论怎么走都无法解除将军，就是<b>将死</b>，被将死的一方输棋。',
      '下图红车正在将军黑将。',
    ],
    tip: '点击「开始对弈」，实战中体会将军与应将。',
    setup: {
      turn: RED,
      placements: [
        [BLACK, K, 4, 0], [RED, K, 4, 9],
        [RED, R, 4, 3],
      ],
    },
    interactive: false,
    task: { type: 'next', finish: true },
    decor: [{ idx: idx(4, 0), kind: 'ring', color: '#dc2626' }],
  },
];

export const tutorial = {
  buildGame(lesson) {
    const g = new XiangqiGame();
    if (lesson.setup && lesson.setup.initial) {
      g.turn = lesson.setup.turn || RED;
      return g;
    }
    g.board.fill(0);
    for (const [c, t, x, y] of lesson.setup.placements) {
      g.board[idx(x, y)] = piece(c, t);
    }
    g.turn = lesson.setup.turn || RED;
    g.lastMove = null;
    return g;
  },
};
