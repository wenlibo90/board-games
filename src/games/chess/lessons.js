// 国际象棋新手教学课程与适配器

import { ChessGame, WHITE, BLACK, P, N, B, R, Q, K, piece, idx } from './engine.js';

export const lessons = [
  {
    id: 'board',
    tag: '第 1 课',
    title: '认识棋盘与棋子',
    intro: [
      '国际象棋棋盘是 8x8 的方格，横向 8 列（a～h），纵向 8 行（1～8）。',
      '双方各有 16 个棋子：王、后、车、象、马，以及 8 个兵。',
      '白方先行，之后双方轮流走棋。目标是将死对方的王。',
    ],
    tip: '点击「下一课」继续。',
    setup: { initial: true, turn: WHITE },
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'pawn',
    tag: '第 2 课',
    title: '兵的走法',
    intro: [
      '<b>兵</b>只能向前走，不能后退，每次走一格。',
      '兵在起始位置时，可以一次向前走两格。',
      '兵吃子很特别：它<b>斜着吃</b>前方的子。',
    ],
    tip: '请把白兵从 e2 向前走两格到 e4（先点兵，再点目标格）。',
    setup: {
      turn: WHITE,
      placements: [[WHITE, K, 4, 7], [BLACK, K, 4, 0], [WHITE, P, 4, 6]],
    },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === idx(4, 6) && (m.to === idx(4, 4) || m.to === idx(4, 5)),
      success: '正确！兵在起始位置可以向前走两格。',
      fail: '兵要向前（向对方方向）走。请把 e2 的兵走到 e4 或 e3。',
    },
    decor: [{ idx: idx(4, 6), kind: 'ring' }, { idx: idx(4, 4), kind: 'dot' }],
  },
  {
    id: 'knight',
    tag: '第 3 课',
    title: '马的走法',
    intro: [
      '<b>马</b>走「L」形：先走两格直线，再走一格垂直，共三格。',
      '马是唯一可以越过其他棋子的棋子。',
    ],
    tip: '请把 b1 的马跳到任意带圆点标记的格子。',
    setup: {
      turn: WHITE,
      placements: [[WHITE, K, 4, 7], [BLACK, K, 4, 0], [WHITE, N, 1, 7]],
    },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === idx(1, 7) && [idx(0, 5), idx(2, 5), idx(3, 6)].includes(m.to),
      success: '很好！马走 L 形，可以跳到不同的格子。',
      fail: '马走「L」形：两格直线加一格垂直。试试跳到带圆点的位置。',
    },
    decor: [
      { idx: idx(1, 7), kind: 'ring' },
      { idx: idx(0, 5), kind: 'dot' },
      { idx: idx(2, 5), kind: 'dot' },
      { idx: idx(3, 6), kind: 'dot' },
    ],
  },
  {
    id: 'castle',
    tag: '第 4 课',
    title: '王车易位',
    intro: [
      '<b>王车易位</b>是一步棋同时移动王和车，用来保护王。',
      '短易位：王向右走两格，车越过王放到王身边。',
      '易位的前提是：王和车都没动过，中间没有棋子，且王经过的格子不受攻击。',
    ],
    tip: '请完成短易位：先点 e1 的王，再点 g1 格。',
    setup: {
      turn: WHITE,
      castling: 1, // 白方保留短易位权
      placements: [[WHITE, K, 4, 7], [WHITE, R, 7, 7], [BLACK, K, 4, 0]],
    },
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m.from === idx(4, 7) && m.to === idx(6, 7),
      success: '漂亮！王向右移两格，车同时跳过来保护王，这就是短易位。',
      fail: '请把 e1 的王走到 g1（向右两格），完成短易位。',
    },
    decor: [{ idx: idx(4, 7), kind: 'ring' }, { idx: idx(6, 7), kind: 'dot' }],
  },
  {
    id: 'check',
    tag: '第 5 课',
    title: '将军与将死',
    intro: [
      '当一方的棋子下一步能吃掉对方的王时，叫<b>将军</b>。',
      '被将军时必须立刻应对：移动王、吃掉威胁棋子，或用棋子挡住。',
      '如果无论如何都无法解除将军，就是<b>将死</b>，被将死的一方输棋。',
      '下图白车正沿 e 线将军黑王。',
    ],
    tip: '点击「开始对弈」，实战中体会将军与应将。',
    setup: {
      turn: WHITE,
      placements: [[WHITE, K, 4, 7], [WHITE, R, 4, 4], [BLACK, K, 4, 0]],
    },
    interactive: false,
    task: { type: 'next', finish: true },
    decor: [{ idx: idx(4, 0), kind: 'ring', color: '#dc2626' }],
  },
];

export const tutorial = {
  buildGame(lesson) {
    const g = new ChessGame();
    if (lesson.setup && lesson.setup.initial) {
      g.turn = lesson.setup.turn || WHITE;
      return g;
    }
    g.board.fill(0);
    for (const [c, t, x, y] of lesson.setup.placements) {
      g.board[idx(x, y)] = piece(c, t);
    }
    g.turn = lesson.setup.turn || WHITE;
    g.castling = lesson.setup.castling != null ? lesson.setup.castling : 0;
    g.ep = -1;
    g.halfmove = 0;
    g.lastMove = null;
    return g;
  },
};
