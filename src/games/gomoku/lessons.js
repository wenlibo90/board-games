// 五子棋新手教学

import { GomokuGame, BLACK, WHITE } from './engine.js';

const S = 15;
const P = (x, y) => y * S + x;

export const lessons = [
  {
    id: 'board',
    tag: '第 1 课',
    title: '认识五子棋',
    intro: [
      '五子棋在棋盘的交叉点上落子，黑棋先行。',
      '双方轮流落子，谁先让自己的棋子<b>在同一直线上连成五子</b>（横、竖、斜均可），谁就获胜。',
      '五子棋规则简单，但先手进攻与后手防守同样重要。',
    ],
    tip: '点击「下一课」继续。',
    setup: { size: S, turn: BLACK, placements: [] },
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'five',
    tag: '第 2 课',
    title: '连成五子',
    intro: [
      '下面黑棋已经连成四子，只差一格就能获胜。',
      '请在合适的位置落子，让黑棋连成五子。',
    ],
    tip: '点击这排黑棋两端任意一个空点。',
    setup: {
      size: S, turn: BLACK,
      placements: [[BLACK, 3, 7], [BLACK, 4, 7], [BLACK, 5, 7], [BLACK, 6, 7], [WHITE, 3, 3]],
    },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m === P(2, 7) || m === P(7, 7),
      success: '正确！连成五子就是胜利。',
      fail: '请把黑子下在这排棋的端点，凑成连续五子。',
    },
    decor: [{ idx: P(2, 7), kind: 'ring' }, { idx: P(7, 7), kind: 'ring' }],
  },
  {
    id: 'block',
    tag: '第 3 课',
    title: '阻挡对手',
    intro: [
      '当对手已经有四子相连时，必须立刻阻挡，否则下一手就被连成五子。',
      '下面白棋四子相连，右端已被黑棋堵住。轮到你（黑）落子。',
    ],
    tip: '请堵住白棋唯一还空着的一端。',
    setup: {
      size: S, turn: BLACK,
      placements: [[WHITE, 3, 7], [WHITE, 4, 7], [WHITE, 5, 7], [WHITE, 6, 7], [BLACK, 7, 7]],
    },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m === P(2, 7),
      success: '很好！挡住左端，白棋就无法连成五子了。',
      fail: '白棋左端还没有被堵住，请把黑子下在那里。',
    },
    decor: [{ idx: P(2, 7), kind: 'ring', color: '#dc2626' }],
  },
];

export const tutorial = {
  buildGame(lesson) {
    const g = new GomokuGame(lesson.setup.size || S);
    for (const [c, x, y] of lesson.setup.placements || []) g.board[(y * g.size) + x] = c;
    g.turn = lesson.setup.turn || BLACK;
    g.lastMove = -1;
    return g;
  },
};
