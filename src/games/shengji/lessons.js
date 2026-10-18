// 升级 / 拖拉机 新手教学（简化版）

import { ShengjiGame } from './engine.js';

export const lessons = [
  {
    id: 'basic',
    tag: '第 1 课',
    title: '认识升级',
    intro: [
      '升级（含拖拉机）是四人两队的墩牌游戏：你与对家（座位 0 与 2）为庄方，上下家为抓分方。',
      '开局先<b>亮主</b>：庄家选择一种花色作为主牌（也可选无主），主牌与级牌、大小王都是“将牌”，威力最大。',
      '每墩四人各出一张牌，最大者赢下本墩并领出下一墩。',
    ],
    tip: '本平台提供简化规则：单副牌、单张墩、单局计分（暂不含对子/拖拉机与连升级）。点击「下一课」。',
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'follow',
    tag: '第 2 课',
    title: '跟牌与主牌',
    intro: [
      '跟牌必须<b>同花色</b>：如果手里有与首出花色相同的牌，必须出该花色；没有才可以垫其他牌或出主牌。',
      '主牌（将牌）可以压过任何非主牌；大小王最大，其次是级牌与主花色。',
      '分牌：5 记 5 分、10 记 10 分、K 记 10 分。',
    ],
    tip: '抓分方要尽量多抓分牌，庄方要尽量阻止。点击「下一课」。',
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'score',
    tag: '第 3 课',
    title: '计分与胜负',
    intro: [
      '一局共 13 墩。抓分方累计抓到 <b>80 分</b> 及以上即获胜，否则庄方获胜。',
      '配合要点：队友赢墩时，尽量把分牌“喂”给队友；对手赢墩时，尽量出小牌或避免送分。',
      '留好主牌与王，关键墩再出，一举夺回出牌权。',
    ],
    tip: '点击「开始对弈」，和 AI 打一局升级吧。',
    interactive: false,
    task: { type: 'next', finish: true },
    decor: [],
  },
];

export const tutorial = {
  buildGame() { return new ShengjiGame(); },
};
