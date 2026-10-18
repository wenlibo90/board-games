// 围棋新手教学课程与适配器

import { GoGame, BLACK, WHITE, EMPTY, isLegal, collectGroup, computeScore } from './engine.js';

const N = 9;
const P = (x, y) => y * N + x;

function twoEyeStones() {
  const stones = [];
  for (let x = 2; x <= 6; x++) {
    for (let y = 2; y <= 6; y++) {
      if (x === 2 || x === 6 || y === 2 || y === 6) stones.push({ c: 'b', x, y });
    }
  }
  for (const y of [3, 4, 5]) stones.push({ c: 'b', x: 4, y });
  return stones;
}

function scoringStones() {
  const stones = [];
  for (let y = 0; y < N; y++) {
    stones.push({ c: 'b', x: 2, y });
    stones.push({ c: 'w', x: 6, y });
  }
  return stones;
}

export const lessons = [
  {
    id: 'board',
    tag: '第 1 课',
    title: '认识棋盘与棋子',
    intro: [
      '围棋在纵横交错的棋盘上进行，棋盘上的每一个交叉点都可以落子。',
      '图中用圆圈标出的位置叫<b>星位</b>，是棋盘上的重要参考点。9 路棋盘共有 5 个星位。',
      '对局双方一方执黑、一方执白。黑棋先行，白棋随后，双方轮流落子。',
    ],
    tip: '点击「下一课」继续。',
    size: N,
    stones: [],
    turn: BLACK,
    interactive: false,
    task: { type: 'next' },
    decor: [
      { idx: P(2, 2), kind: 'star' }, { idx: P(6, 2), kind: 'star' },
      { idx: P(2, 6), kind: 'star' }, { idx: P(6, 6), kind: 'star' }, { idx: P(4, 4), kind: 'star' },
    ],
  },
  {
    id: 'liberty',
    tag: '第 2 课',
    title: '气',
    intro: [
      '棋子上下左右紧邻的空点，叫做它的<b>气</b>。',
      '棋盘中央的黑子有四个气（图中青色圆点）。',
      '越靠近边角，棋子的气越少。边上只有三个气，角上只有两个气。',
    ],
    tip: '试着在棋盘上点一个位置落子，观察新棋子的气。',
    size: N,
    stones: [{ c: 'b', x: 4, y: 4 }],
    turn: BLACK,
    interactive: true,
    task: { type: 'free' },
    decor: (g) => {
      const target = g.lastMove >= 0 ? g.lastMove : P(4, 4);
      if (g.board[target] === EMPTY) return [];
      const grp = collectGroup(g.board, N, target);
      const out = [{ idx: target, kind: 'ring' }];
      for (const l of grp.liberties) out.push({ idx: l, kind: 'liberty' });
      return out;
    },
  },
  {
    id: 'capture',
    tag: '第 3 课',
    title: '提子',
    intro: [
      '当一块棋的气被对方全部堵住，它就<b>被提</b>，需要从棋盘上拿走。',
      '下面的白子只剩下 (E5) 一个气，黑棋下在这个位置就能提子。',
    ],
    tip: '请把黑子下在白子最后一口气上，把它提掉。',
    size: N,
    stones: [{ c: 'w', x: 4, y: 4 }, { c: 'b', x: 3, y: 4 }, { c: 'b', x: 5, y: 4 }, { c: 'b', x: 4, y: 3 }],
    turn: BLACK,
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m === P(4, 5),
      success: '漂亮！白子没有气了，被提离棋盘。这就是提子。',
      fail: '再试一次：把黑子下在白子唯一的空邻点上。',
    },
    decor: [{ idx: P(4, 4), kind: 'ring', color: '#dc2626' }, { idx: P(4, 5), kind: 'liberty' }],
  },
  {
    id: 'atari',
    tag: '第 4 课',
    title: '打吃与逃跑',
    intro: [
      '只剩一口气的棋叫<b>打吃</b>，此时它非常危险。',
      '下面的黑子被白棋三面包围，只剩一口气。轮到你落子。',
    ],
    tip: '请帮黑棋逃跑：下在它唯一的空邻点上，让这块棋重新获得更多气。',
    size: N,
    stones: [{ c: 'b', x: 4, y: 4 }, { c: 'w', x: 3, y: 4 }, { c: 'w', x: 5, y: 4 }, { c: 'w', x: 4, y: 3 }],
    turn: BLACK,
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m === P(4, 5),
      success: '正确！逃跑之后黑棋的气变多了，就安全多了。',
      fail: '这一步没能增加黑棋的气。试着下在被围黑子的空邻点上。',
    },
    decor: [{ idx: P(4, 4), kind: 'ring', color: '#dc2626' }],
  },
  {
    id: 'suicide',
    tag: '第 5 课',
    title: '禁着点',
    intro: [
      '有些交叉点落子之后自己一口气都没有，这样的点叫<b>禁着点</b>，规则不允许落子。',
      '角上的 (A9) 已经被两个白子堵住，黑棋如果落在这里就会立刻无气。',
    ],
    tip: '试着点击角上标圈的位置，看看会发生什么。',
    size: N,
    stones: [{ c: 'w', x: 1, y: 0 }, { c: 'w', x: 0, y: 1 }],
    turn: BLACK,
    interactive: true,
    task: {
      type: 'tryIllegal',
      isIllegal: (g, m) => !isLegal(g.board, g.size, m, g.turn, g.koPoint),
      success: '没错，这个点不能落子，它是禁着点。黑棋落下去会立刻没有气。',
      fail: '这个点是合法的，可以落子。再试试棋盘上被圆圈标出的位置。',
    },
    decor: [{ idx: P(0, 0), kind: 'ring', color: '#dc2626' }],
  },
  {
    id: 'ko',
    tag: '第 6 课',
    title: '打劫',
    intro: [
      '有时双方可以在同一个位置反复提子而不分胜负，于是规则规定：<b>被提的一方不能马上回提</b>，要先在别处下一手。',
      '下面是一个典型局面，黑棋可以先提掉标圈的白子。',
    ],
    tip: '请下在 (E5) 提掉白子，然后看看棋盘上出现的「打劫」标记。',
    size: N,
    stones: [
      { c: 'w', x: 4, y: 4 }, { c: 'w', x: 3, y: 5 }, { c: 'w', x: 5, y: 5 }, { c: 'w', x: 4, y: 6 },
      { c: 'b', x: 3, y: 4 }, { c: 'b', x: 5, y: 4 }, { c: 'b', x: 4, y: 3 },
    ],
    turn: BLACK,
    interactive: true,
    task: {
      type: 'move',
      accept: (m) => m === P(4, 5),
      success: '提子成功！注意 (E4) 出现了红色方框，现在白棋不能立刻回提这里，这就是打劫规则。',
      fail: '白子只剩一口气，请下在 (E5) 把它提掉。',
    },
    decor: [{ idx: P(4, 4), kind: 'ring', color: '#c2410c' }],
  },
  {
    id: 'eyes',
    tag: '第 7 课',
    title: '做眼与活棋',
    intro: [
      '由一块棋完全围住的空点叫<b>眼</b>。',
      '如果一块棋做出了<b>两个真眼</b>，对方就无法提掉它，这块棋就活了。',
      '下图的黑棋有两个独立的眼（两个青色区域），已经是一块活棋。',
    ],
    tip: '记住：做眼是让棋块存活的关键。点击「下一课」继续。',
    size: N,
    stones: twoEyeStones(),
    turn: BLACK,
    interactive: false,
    task: { type: 'next' },
    decor: [
      { idx: P(3, 3), kind: 'eye' }, { idx: P(3, 4), kind: 'eye' }, { idx: P(3, 5), kind: 'eye' },
      { idx: P(5, 3), kind: 'eye' }, { idx: P(5, 4), kind: 'eye' }, { idx: P(5, 5), kind: 'eye' },
    ],
  },
  {
    id: 'score',
    tag: '第 8 课',
    title: '数子与胜负',
    intro: (g) => {
      const s = computeScore(g.board, N, 6.5);
      return [
        '一局棋结束后，用<b>数子法</b>计算胜负：己方棋子数加上围住的空点数，多的一方获胜。',
        '白棋后行，会得到 6.5 子的补偿，叫<b>贴目</b>。',
        `当前示例：黑棋 ${s.black} 子，白棋 ${s.white} 子（含贴目）。`,
      ];
    },
    tip: '现在你已经了解基本规则，点击「开始对弈」和 AI 下一盘吧。',
    size: N,
    stones: scoringStones(),
    turn: BLACK,
    interactive: false,
    task: { type: 'next', finish: true },
    decor: [],
    overlay: (g) => {
      const s = computeScore(g.board, N, g.komi);
      return { territory: { black: s.blackTerritory, white: s.whiteTerritory } };
    },
  },
];

export const tutorial = {
  buildGame(lesson) {
    const g = new GoGame(lesson.size || N, 6.5);
    for (const st of lesson.stones || []) {
      g.board[P(st.x, st.y)] = st.c === 'b' ? BLACK : WHITE;
    }
    g.turn = lesson.turn || BLACK;
    g.lastMove = -1;
    return g;
  },
};
