// 韩国象棋新手教学

import { JanggiGame, RED, BLUE, K, A, E, H, R, C, P, piece, idx } from './engine.js';

const S = 9;
const P_ = (x, y) => y * S + x;

export const lessons = [
  {
    id: 'board',
    tag: '第 1 课',
    title: '认识韩国象棋',
    intro: [
      '韩国象棋（Janggi）棋盘为 9x10，两端各有一个<b>九宫</b>，将士只能在九宫内活动。',
      '棋子有：将、士、象、馬、車、包（炮）、兵/卒。漢（红）方先行。',
      '与中国象棋最大的不同：<b>包（炮）必须隔着棋子才能移动或吃子，而且不能吃炮</b>。',
    ],
    tip: '点击「下一课」继续。',
    setup: { initial: true, turn: RED },
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'cannon',
    tag: '第 2 课',
    title: '包的走法',
    intro: [
      '包（炮）走直线，但<b>必须隔着一个棋子（包架）</b>才能移动。',
      '隔子之后，可以停在任何空点上；如果第一个遇到的对方棋子不是炮，还可以吃掉它。',
      '下面红包隔着红兵，可以吃掉远处的蓝卒。',
    ],
    tip: '先点红包，再点它斜上方隔着红兵的蓝卒。',
    setup: { turn: RED, placements: [[RED, K, 4, 9], [BLUE, K, 4, 0], [RED, C, 4, 7], [RED, P, 4, 5], [BLUE, P, 4, 3]] },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === P_(4, 7) && m.to === P_(4, 3),
      success: '正确！包隔着红兵跳过去，吃掉了蓝卒。',
      fail: '包必须隔子行动：请让红包越过红兵，吃掉上方的蓝卒。',
    },
    decor: [{ idx: P_(4, 7), kind: 'ring' }, { idx: P_(4, 5), kind: 'label', text: '架' }, { idx: P_(4, 3), kind: 'ring', color: '#dc2626' }],
  },
  {
    id: 'soldier',
    tag: '第 3 课',
    title: '兵的走法',
    intro: [
      '兵（卒）只能向前走或向左右走，不能后退。',
      '与中国象棋不同，韩国象棋的兵一开始就可以横走。',
    ],
    tip: '请把红兵向左或向右走一格。',
    setup: { turn: RED, placements: [[RED, K, 4, 9], [BLUE, K, 4, 0], [RED, P, 4, 5]] },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === P_(4, 5) && (m.to === P_(3, 5) || m.to === P_(5, 5)),
      success: '正确！兵可以横向移动。',
      fail: '请把红兵向左或向右移动一格。',
    },
    decor: [{ idx: P_(4, 5), kind: 'ring' }, { idx: P_(3, 5), kind: 'dot' }, { idx: P_(5, 5), kind: 'dot' }],
  },
  {
    id: 'elephant',
    tag: '第 4 课',
    title: '象的走法',
    intro: [
      '韩国象棋的象走<b>「用」字</b>：先直走一格，再斜走两格，共走三步。',
      '中间的格子被挡住时，象就不能这样走。',
    ],
    tip: '请把红象跳到任意一个带圆点的位置。',
    setup: { turn: RED, placements: [[RED, K, 4, 9], [BLUE, K, 4, 0], [RED, E, 4, 5]] },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === P_(4, 5) && [[7, 7], [7, 3], [1, 7], [1, 3], [6, 8], [2, 8], [6, 2], [2, 2]].some(([x, y]) => P_(x, y) === m.to),
      success: '正确！象走「用」字，一次移动三格。',
      fail: '象要走「用」字：直一格再斜两格。请跳到带圆点的位置。',
    },
    decor: [
      { idx: P_(4, 5), kind: 'ring' },
      { idx: P_(7, 7), kind: 'dot' }, { idx: P_(7, 3), kind: 'dot' },
      { idx: P_(1, 7), kind: 'dot' }, { idx: P_(1, 3), kind: 'dot' },
    ],
  },
];

export const tutorial = {
  buildGame(lesson) {
    const g = new JanggiGame();
    if (lesson.setup && lesson.setup.initial) { g.turn = lesson.setup.turn || RED; return g; }
    g.board.fill(0);
    for (const [c, t, x, y] of lesson.setup.placements) g.board[idx(x, y)] = piece(c, t);
    g.turn = lesson.setup.turn || RED;
    g.lastMove = null;
    return g;
  },
};
