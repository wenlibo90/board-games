// 斗兽棋新手教学

import { JungleGame, RED, BLUE, RAT, CAT, DOG, WOLF, LEOPARD, TIGER, LION, ELEPHANT, piece, idx } from './engine.js';

export const lessons = [
  {
    id: 'board',
    tag: '第 1 课',
    title: '认识棋盘与棋子',
    intro: [
      '斗兽棋棋盘中间是<b>河流</b>，两端各有一个<b>兽穴</b>，兽穴周围是<b>陷阱</b>。',
      '每方各有 8 只兽：象、狮、虎、豹、狼、狗、猫、鼠，等级从高到低。',
      '红方先行。把棋子走进对方的兽穴即获胜。',
    ],
    tip: '点击「下一课」继续。',
    setup: { initial: true, turn: RED },
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'capture',
    tag: '第 2 课',
    title: '吃子规则',
    intro: [
      '等级高的兽可以吃掉等级低的兽，等级相同也可以吃。',
      '下面红豹（5 级）紧挨着蓝狼（4 级），可以把它吃掉。',
    ],
    tip: '先点红豹，再点蓝狼所在的位置。',
    setup: { turn: RED, placements: [[RED, LEOPARD, 6, 4], [BLUE, WOLF, 6, 3]] },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === idx(6, 4) && m.to === idx(6, 3),
      success: '正确！豹的等级高于狼，可以吃子。',
      fail: '请点红豹，再点它上方的蓝狼，把它吃掉。',
    },
    decor: [{ idx: idx(6, 4), kind: 'ring' }, { idx: idx(6, 3), kind: 'ring', color: '#dc2626' }],
  },
  {
    id: 'water',
    tag: '第 3 课',
    title: '鼠与河流',
    intro: [
      '只有<b>鼠</b>能进入河流。鼠在河里时，陆地上的兽不能吃它。',
      '鼠还有一个特权：它可以吃掉最强大的<b>象</b>。',
    ],
    tip: '请把红鼠走进旁边的河里。',
    setup: { turn: RED, placements: [[RED, RAT, 2, 2], [BLUE, ELEPHANT, 0, 0]] },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === idx(2, 2) && m.to === idx(2, 3),
      success: '正确！鼠可以自由进入河流，在水里很安全。',
      fail: '只有鼠能进河：请把红鼠向下走进河道。',
    },
    decor: [{ idx: idx(2, 2), kind: 'ring' }, { idx: idx(2, 3), kind: 'dot' }],
  },
  {
    id: 'den',
    tag: '第 4 课',
    title: '攻入兽穴',
    intro: [
      '把任意一枚棋子走进对方的<b>兽穴</b>，就立刻获胜。',
      '注意：棋子不能进入自己的兽穴。',
      '下面红狮只差一步就能冲进蓝方兽穴。',
    ],
    tip: '请把红狮走进上方蓝方兽穴，赢下这一局。',
    setup: { turn: RED, placements: [[RED, LION, 3, 1], [BLUE, DOG, 1, 1]] },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === idx(3, 1) && m.to === idx(3, 0),
      success: '漂亮！狮子闯入蓝方兽穴，红方获胜。',
      fail: '请把红狮向上走进蓝方兽穴（最上方中央）。',
    },
    decor: [{ idx: idx(3, 1), kind: 'ring' }, { idx: idx(3, 0), kind: 'dot', color: '#dc2626' }],
  },
];

export const tutorial = {
  buildGame(lesson) {
    const g = new JungleGame();
    if (lesson.setup && lesson.setup.initial) {
      g.turn = lesson.setup.turn || RED;
      return g;
    }
    g.board.fill(0);
    for (const [c, r, x, y] of lesson.setup.placements) g.board[idx(x, y)] = piece(c, r);
    g.turn = lesson.setup.turn || RED;
    g.lastMove = null;
    return g;
  },
};
