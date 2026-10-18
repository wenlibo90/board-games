// 六角跳棋新手教学

import { CheckersGame, BOARD, EMPTY, RED, BLUE } from './engine.js';

const C0 = 60;
const N0 = BOARD.neighbors[C0][0];
const DX = BOARD.coords[N0].x - BOARD.coords[C0].x;
const DY = BOARD.coords[N0].y - BOARD.coords[C0].y;
const LAND = BOARD.dirNeighbor[N0][`${DX.toFixed(3)},${DY.toFixed(3)}`];

export const lessons = [
  {
    id: 'board',
    tag: '第 1 课',
    title: '认识六角跳棋',
    intro: [
      '六角跳棋在六角星棋盘上进行，每方有 10 颗棋子，摆在自己一角的三角区内。',
      '目标是把全部棋子移动到<b>正对面的三角区</b>，先完成的一方获胜。',
      '棋子可以走到相邻的空位，也可以<b>连续跳过</b>相邻的棋子（无论敌我）落到后面的空位。',
    ],
    tip: '点击「下一课」继续。',
    setup: { initial: true, turn: RED },
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'hop',
    tag: '第 2 课',
    title: '连续跳跃',
    intro: [
      '当相邻位置有棋子时，可以跳过它落到后面的空位。',
      '一次跳跃之后如果还有可跳的棋子，就能<b>连续跳跃</b>，一次走很远。',
      '下面红棋前方有一颗蓝棋，请跳过它。',
    ],
    tip: '先点红棋，再点它越过蓝棋后的落点。',
    setup: { turn: RED, cells: { [C0]: RED, [N0]: BLUE } },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === C0 && m.to === LAND,
      success: '正确！跳过蓝棋，落到它后面的空位。',
      fail: '请点红棋，再点它越过蓝棋后方的空位。',
    },
    decor: [{ idx: C0, kind: 'ring' }, { idx: N0, kind: 'label', text: '跳' }, { idx: LAND, kind: 'dot' }],
  },
];

export const tutorial = {
  buildGame(lesson) {
    const g = new CheckersGame();
    if (lesson.setup && lesson.setup.initial) { g.turn = lesson.setup.turn || RED; return g; }
    g.cells = new Int8Array(BOARD.count);
    for (const [k, v] of Object.entries(lesson.setup.cells || {})) g.cells[Number(k)] = v;
    g.turn = lesson.setup.turn || RED;
    g.lastMove = null;
    return g;
  },
};
