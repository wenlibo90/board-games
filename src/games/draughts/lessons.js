// 国际跳棋新手教学

import { DraughtsGame, WHITE, BLACK, MAN, KING, piece, idx } from './engine.js';

export const lessons = [
  {
    id: 'board',
    tag: '第 1 课',
    title: '认识棋盘与棋子',
    intro: [
      '国际跳棋在 10x10 的棋盘上进行，只有<b>深色格</b>可以走棋。',
      '每方各有 20 枚棋子，白棋先行。',
      '棋子只能斜着向前走一格；到达对方底线时升为<b>王棋</b>，可以斜着前进或后退任意距离。',
    ],
    tip: '点击「下一课」继续。',
    setup: { initial: true, turn: WHITE },
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'move',
    tag: '第 2 课',
    title: '兵的走法',
    intro: [
      '兵每次斜向前走一格，不能后退。',
      '下面白兵位于 (D4)，可以斜向前走到 (C3) 或 (E3)。',
    ],
    tip: '请把白兵向前走一格到任意一个空点。',
    setup: {
      turn: WHITE,
      placements: [[WHITE, MAN, 3, 6], [BLACK, MAN, 6, 1]],
    },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === idx(3, 6) && (m.to === idx(2, 5) || m.to === idx(4, 5)),
      success: '正确！兵斜向前进一格。',
      fail: '兵只能斜着向前走一格。请把 (D4) 的白兵走到 (C3) 或 (E3)。',
    },
    decor: [{ idx: idx(3, 6), kind: 'ring' }, { idx: idx(2, 5), kind: 'dot' }, { idx: idx(4, 5), kind: 'dot' }],
  },
  {
    id: 'capture',
    tag: '第 3 课',
    title: '强制吃子',
    intro: [
      '跳棋的吃子方式是：<b>跳过</b>紧挨着自己的对方棋子，落在它后面紧邻的空格上，被跳过的棋子即被吃掉。',
      '当有吃子的机会时，<b>必须吃子</b>，不能选择其他走法。',
      '下面黑兵就在白兵斜前方，请跳过去把它吃掉。',
    ],
    tip: '先点白兵 (D4)，再点 (F2) 跳过黑兵。',
    setup: {
      turn: WHITE,
      placements: [[WHITE, MAN, 3, 6], [BLACK, MAN, 4, 5], [BLACK, MAN, 1, 2]],
    },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === idx(3, 6) && m.to === idx(5, 4) && m.captures && m.captures.length === 1,
      success: '正确！跳过黑兵并吃掉它，这是本步唯一合法的走法。',
      fail: '有吃子时必须吃子：请点白兵，再点它斜后方跳过黑兵的位置。',
    },
    decor: [{ idx: idx(3, 6), kind: 'ring' }, { idx: idx(4, 5), kind: 'ring', color: '#dc2626' }, { idx: idx(5, 4), kind: 'dot' }],
  },
  {
    id: 'king',
    tag: '第 4 课',
    title: '升王',
    intro: [
      '兵到达对方底线时，立刻升为<b>王棋</b>。',
      '王棋既能前进也能后退，并且可以沿斜线走任意距离、远距离吃子。',
      '下面白兵只差一步就能升王。',
    ],
    tip: '请把白兵走到最上面一行，让它升为王棋。',
    setup: {
      turn: WHITE,
      placements: [[WHITE, MAN, 4, 1], [BLACK, MAN, 1, 4]],
    },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === idx(4, 1) && (m.to === idx(3, 0) || m.to === idx(5, 0)),
      success: '漂亮！白兵到达底线，升为王棋。',
      fail: '请把 (E8) 的白兵走到最上面一行（C10 或 E10）完成升王。',
    },
    decor: [{ idx: idx(4, 1), kind: 'ring' }, { idx: idx(3, 0), kind: 'dot' }, { idx: idx(5, 0), kind: 'dot' }],
  },
];

export const tutorial = {
  buildGame(lesson) {
    const g = new DraughtsGame();
    if (lesson.setup && lesson.setup.initial) {
      g.turn = lesson.setup.turn || WHITE;
      return g;
    }
    g.board.fill(0);
    for (const [c, t, x, y] of lesson.setup.placements) g.board[idx(x, y)] = piece(c, t);
    g.turn = lesson.setup.turn || WHITE;
    g.lastMove = null;
    return g;
  },
};
