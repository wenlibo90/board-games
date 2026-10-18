// 掼蛋新手教学（简化版）

import { GuandanGame } from './engine.js';

export const lessons = [
  {
    id: 'basic',
    tag: '第 1 课',
    title: '认识掼蛋',
    intro: [
      '掼蛋使用两副扑克（共 108 张），四人两两队：你与对家（座位 0 与 2）为一队，上下家为另一队。',
      '每人 27 张牌，轮流按牌型出牌，先出完手牌的一方所在队伍获胜。',
      '本平台提供简化规则：保留两副牌与组队比牌，暂不含“逢人配”（级牌万能）与进贡。',
    ],
    tip: '点击「下一课」继续。',
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'types',
    tag: '第 2 课',
    title: '牌型与配合',
    intro: [
      '牌型与斗地主类似：单张、对子、三张、三带二、顺子、连对、飞机、炸弹与天王炸。',
      '比牌时须同牌型且更大；炸弹可压任意非炸弹牌型，天王炸最大。',
      '<b>配合是关键</b>：队友出的牌不要压，尽量帮助队友先走完。',
    ],
    tip: '选牌后点「出牌」；无法压制时点「不要」。点击「下一课」。',
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'tips',
    tag: '第 3 课',
    title: '小技巧',
    intro: [
      '保留一张大牌或炸弹用于抢回出牌权。',
      '顺着队友走牌：队友领出小牌时，尽量跟同花色的低牌，把机会留给队友。',
      '留意对手只剩少量牌时，果断用炸弹阻断。',
    ],
    tip: '点击「开始对弈」，和 AI 组队打一局掼蛋吧。',
    interactive: false,
    task: { type: 'next', finish: true },
    decor: [],
  },
];

export const tutorial = {
  buildGame() { return new GuandanGame(); },
};
