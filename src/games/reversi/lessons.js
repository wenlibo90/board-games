// 黑白棋（奥赛罗）新手教学

import { ReversiGame, BLACK, WHITE, idx, isLegal } from './engine.js';

const START = [
  [WHITE, 3, 3], [WHITE, 4, 4], [BLACK, 4, 3], [BLACK, 3, 4],
];

export const lessons = [
  {
    id: 'board',
    tag: '第 1 课',
    title: '认识黑白棋',
    intro: [
      '黑白棋在 8x8 的棋盘上进行，开局时棋盘中央已有两白两黑四颗棋子。',
      '黑棋先行。落子时，必须让新棋子与自己的棋子<b>夹住</b>对方的一串棋子，被夹住的棋子会翻转成自己的颜色。',
      '棋盘下满或双方都无法落子时，棋子多的一方获胜。',
    ],
    tip: '点击「下一课」继续。',
    setup: { turn: BLACK, initial: true },
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'flip',
    tag: '第 2 课',
    title: '夹子翻转',
    intro: [
      '落子的关键是「夹子」：新棋子要沿着某个方向，把自己的棋子与对方一串棋子连成一线。',
      '图中青色标记处都是黑棋可以落子并翻转白棋的位置（D3、C4、F5、E6）。',
    ],
    tip: '请在任意一个标记处落子，观察白棋被翻转成黑棋。',
    setup: { turn: BLACK, initial: true },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => [idx(3, 2), idx(2, 3), idx(5, 4), idx(4, 5)].includes(m),
      success: '正确！落子后，被夹住的白棋都翻转成了黑棋。',
      fail: '请落在一个能夹住白棋的位置（带青色标记处）。',
    },
    decor: [
      { idx: idx(3, 2), kind: 'dot' }, { idx: idx(2, 3), kind: 'dot' },
      { idx: idx(5, 4), kind: 'dot' }, { idx: idx(4, 5), kind: 'dot' },
    ],
  },
  {
    id: 'corner',
    tag: '第 3 课',
    title: '占角与行动力',
    intro: [
      '四个角是棋盘上最稳固的位置：一旦占角，角上的棋子就<b>永远不会被翻转</b>。',
      '同时要避免把棋子下在角旁边的方格，否则容易让对手占到角。',
      '除了棋子数量，还要关注「行动力」，也就是每步可选择的落点越多越好。',
    ],
    tip: '点击「开始对弈」，在实战中体会占角与行动力的价值。',
    setup: { turn: BLACK, initial: true },
    interactive: false,
    task: { type: 'next', finish: true },
    decor: [
      { idx: idx(0, 0), kind: 'ring' }, { idx: idx(7, 0), kind: 'ring' },
      { idx: idx(0, 7), kind: 'ring' }, { idx: idx(7, 7), kind: 'ring' },
    ],
  },
];

export const tutorial = {
  buildGame(lesson) {
    const g = new ReversiGame();
    if (lesson.setup && lesson.setup.initial) {
      g.turn = lesson.setup.turn || BLACK;
      return g;
    }
    return g;
  },
};
