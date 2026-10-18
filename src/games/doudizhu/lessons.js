// 斗地主新手教学

import { DouDizhuGame } from './engine.js';

export const lessons = [
  {
    id: 'basic',
    tag: '第 1 课',
    title: '认识斗地主',
    intro: [
      '斗地主 3 人一局：一人当地主，另外两人为农民。地主拿到 20 张牌，农民各 17 张。',
      '发牌后进入<b>叫分</b>：从 1 分到 3 分依次加价，出价最高者成为地主并拿走 3 张底牌。',
      '地主或农民任一方先出完手牌，该方即获胜。轮到你时先选牌，再点「出牌」。',
    ],
    tip: '点击「下一课」继续。',
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'types',
    tag: '第 2 课',
    title: '常用牌型',
    intro: [
      '<b>单张 / 对子 / 三张</b>：同点数的一、二、三张。',
      '<b>三带一 / 三带二</b>：三张 + 一张单牌 / 一对。',
      '<b>顺子</b>：五张以上连续单牌（不含 2 和王）。',
      '<b>连对</b>：三对以上连续对子；<b>飞机</b>：两组以上连续三张。',
      '<b>炸弹</b>：四张同点；<b>王炸</b>：双王，最大。',
    ],
    tip: '比牌时须同牌型、同张数且点数更大；炸弹可压任意非炸弹牌型，王炸最大。点击「下一课」。',
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'tips',
    tag: '第 3 课',
    title: '出牌技巧',
    intro: [
      '身为农民，要配合队友：队友出的牌不要压，尽量帮他走牌。',
      '记大牌：留意 2、王、炸弹是否已经出现，判断自己能否收尾。',
      '炸弹要留到关键时刻：对手即将出完时再用，或用于抢夺出牌权。',
    ],
    tip: '点击「开始对弈」，和 AI 打一局斗地主吧。',
    interactive: false,
    task: { type: 'next', finish: true },
    decor: [],
  },
];

export const tutorial = {
  buildGame() { return new DouDizhuGame(); },
};
