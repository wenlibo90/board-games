// UNO 新手教学

import { UnoGame } from './engine.js';

export const lessons = [
  {
    id: 'basic',
    tag: '第 1 课',
    title: '认识 UNO',
    intro: [
      'UNO 是一款 4 人纸牌游戏，每人 7 张手牌，最先出完手牌的人获胜。',
      '出牌规则：打出的牌必须与桌面<b>颜色相同</b>，或<b>数字/图案相同</b>。',
      '轮到你时，先点选一张手牌，再点右侧「出牌」按钮；若没有可出的牌，点「抽牌」。',
    ],
    tip: '点击「下一课」继续。',
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'action',
    tag: '第 2 课',
    title: '功能牌',
    intro: [
      '<b>跳过（⊘）</b>：下家失去一次出牌机会。',
      '<b>反转（⇄）</b>：出牌顺序反向。',
      '<b>+2</b>：下家抽两张并跳过。',
      '<b>变色（W）</b>：可随时打出，并指定接下来的颜色（选中变色牌后点选红/黄/绿/蓝按钮）。',
      '<b>+4</b>：下家抽四张并跳过，同时指定颜色。',
    ],
    tip: '点击「下一课」继续。',
    interactive: false,
    task: { type: 'next' },
    decor: [],
  },
  {
    id: 'tips',
    tag: '第 3 课',
    title: '小技巧',
    intro: [
      '尽量保留与当前活动颜色一致的手牌，减少被迫抽牌的次数。',
      '忍一忍万能牌：当手中缺少对应颜色时，变色牌能救急。',
      '当对手只剩一两张牌时，优先用跳过、+2、+4 卡住他们。',
    ],
    tip: '点击「开始对弈」，和 AI 打一局 UNO 吧。',
    interactive: false,
    task: { type: 'next', finish: true },
    decor: [],
  },
];

export const tutorial = {
  buildGame() { return new UnoGame(); },
};
