// 棋种元数据（轻量，不含引擎）+ 按需加载器
// 首页与路由只依赖本文件的元数据；具体棋种模块在打开时按需动态加载，避免一次性加载全部引擎。

export const GAMES_META = [
  {
    "id": "xiangqi",
    "name": "中国象棋",
    "nameEn": "Xiangqi",
    "tagline": "楚河汉界，隔子将军",
    "description": "车马炮兵同场对垒，规则完整，含蹩马腿、隔子炮、飞将等经典规则。",
    "accent": "#b3261e",
    "art": "\n  <svg viewBox=\"0 0 96 96\" width=\"72\" height=\"72\">\n    <rect x=\"6\" y=\"6\" width=\"84\" height=\"84\" rx=\"12\" fill=\"#e9cf9b\" stroke=\"#c49a58\" stroke-width=\"2\"/>\n    <line x1=\"6\" y1=\"30\" x2=\"90\" y2=\"30\" stroke=\"#a9782f\" stroke-width=\"1.5\"/>\n    <line x1=\"6\" y1=\"66\" x2=\"90\" y2=\"66\" stroke=\"#a9782f\" stroke-width=\"1.5\"/>\n    <line x1=\"30\" y1=\"6\" x2=\"30\" y2=\"90\" stroke=\"#a9782f\" stroke-width=\"1.5\"/>\n    <line x1=\"66\" y1=\"6\" x2=\"66\" y2=\"90\" stroke=\"#a9782f\" stroke-width=\"1.5\"/>\n    <circle cx=\"48\" cy=\"48\" r=\"17\" fill=\"#fbf2df\" stroke=\"#b3261e\" stroke-width=\"3\"/>\n    <text x=\"48\" y=\"55\" font-size=\"20\" font-weight=\"700\" text-anchor=\"middle\" fill=\"#b3261e\" font-family=\"KaiTi, serif\">车</text>\n  </svg>"
  },
  {
    "id": "janggi",
    "name": "韩国象棋",
    "nameEn": "Janggi",
    "tagline": "隔子包炮，用字行象",
    "description": "韩国象棋（Janggi）规则，含隔子炮、不能吃炮、用字象、士将斜行与飞将。",
    "accent": "#1d4ed8",
    "art": "\n  <svg viewBox=\"0 0 96 96\" width=\"72\" height=\"72\">\n    <rect x=\"6\" y=\"6\" width=\"84\" height=\"84\" rx=\"12\" fill=\"#edd7a6\" stroke=\"#c49a58\" stroke-width=\"2\"/>\n    <g stroke=\"#a9782f\" stroke-width=\"1.2\">\n      <line x1=\"18\" y1=\"18\" x2=\"78\" y2=\"18\"/><line x1=\"18\" y1=\"39\" x2=\"78\" y2=\"39\"/>\n      <line x1=\"18\" y1=\"60\" x2=\"78\" y2=\"60\"/><line x1=\"18\" y1=\"78\" x2=\"78\" y2=\"78\"/>\n      <line x1=\"18\" y1=\"18\" x2=\"18\" y2=\"78\"/><line x1=\"48\" y1=\"18\" x2=\"48\" y2=\"78\"/><line x1=\"78\" y1=\"18\" x2=\"78\" y2=\"78\"/>\n    </g>\n    <circle cx=\"48\" cy=\"48\" r=\"15\" fill=\"#fbf2df\" stroke=\"#1d4ed8\" stroke-width=\"3\"/>\n    <text x=\"48\" y=\"55\" font-size=\"19\" font-weight=\"700\" text-anchor=\"middle\" fill=\"#1d4ed8\" font-family=\"KaiTi, serif\">包</text>\n  </svg>"
  },
  {
    "id": "shogi",
    "name": "日本将棋",
    "nameEn": "Shogi",
    "tagline": "升变打入，日本将棋",
    "description": "规则完整的日本将棋，含升变、持驹打入、二步与打步诘限制。",
    "accent": "#7a5a2e",
    "art": "\n  <svg viewBox=\"0 0 96 96\" width=\"72\" height=\"72\">\n    <rect x=\"6\" y=\"6\" width=\"84\" height=\"84\" rx=\"12\" fill=\"#f0dcae\" stroke=\"#c49a58\" stroke-width=\"2\"/>\n    <path d=\"M30 78 L30 34 L48 22 L66 34 L66 78 Z\" fill=\"#fbf1da\" stroke=\"#9c7a42\" stroke-width=\"2\"/>\n    <text x=\"48\" y=\"64\" font-size=\"34\" font-weight=\"700\" text-anchor=\"middle\" fill=\"#2a2118\" font-family=\"Yu Mincho, Songti SC, serif\">王</text>\n  </svg>"
  },
  {
    "id": "gomoku",
    "name": "五子棋",
    "nameEn": "Gomoku",
    "tagline": "连成五子，攻守兼备",
    "description": "自由规则五子棋，AI 具备基础进攻与防守判断，适合练习连子与堵截。",
    "accent": "#d29034",
    "art": "\n  <svg viewBox=\"0 0 96 96\" width=\"72\" height=\"72\">\n    <rect x=\"6\" y=\"6\" width=\"84\" height=\"84\" rx=\"12\" fill=\"#e8c184\" stroke=\"#b98a45\" stroke-width=\"2\"/>\n    <g stroke=\"#8a6a38\" stroke-width=\"1.2\">\n      <line x1=\"20\" y1=\"20\" x2=\"76\" y2=\"20\"/><line x1=\"20\" y1=\"34\" x2=\"76\" y2=\"34\"/>\n      <line x1=\"20\" y1=\"48\" x2=\"76\" y2=\"48\"/><line x1=\"20\" y1=\"62\" x2=\"76\" y2=\"62\"/>\n      <line x1=\"20\" y1=\"76\" x2=\"76\" y2=\"76\"/>\n    </g>\n    <g fill=\"#111\"><circle cx=\"20\" cy=\"48\" r=\"7\"/><circle cx=\"34\" cy=\"48\" r=\"7\"/><circle cx=\"48\" cy=\"48\" r=\"7\"/><circle cx=\"62\" cy=\"48\" r=\"7\"/><circle cx=\"76\" cy=\"48\" r=\"7\"/></g>\n  </svg>"
  },
  {
    "id": "chess",
    "name": "国际象棋",
    "nameEn": "Chess",
    "tagline": "王后车象马兵，将杀定胜负",
    "description": "规则完整的国际象棋，含王车易位、吃过路兵、兵升变与将杀判定。",
    "accent": "#334155",
    "art": "\n  <svg viewBox=\"0 0 96 96\" width=\"72\" height=\"72\">\n    <defs>\n      <clipPath id=\"chess-board-clip\"><rect x=\"15\" y=\"15\" width=\"66\" height=\"66\" rx=\"8\"/></clipPath>\n    </defs>\n    <rect x=\"6\" y=\"6\" width=\"84\" height=\"84\" rx=\"12\" fill=\"#eddfc5\" stroke=\"#b58863\" stroke-width=\"2\"/>\n    <g clip-path=\"url(#chess-board-clip)\">\n      <rect x=\"15\" y=\"15\" width=\"66\" height=\"66\" fill=\"#eddfc5\"/>\n      <g fill=\"#b58863\">\n        <rect x=\"15\" y=\"15\" width=\"16.5\" height=\"16.5\"/><rect x=\"48\" y=\"15\" width=\"16.5\" height=\"16.5\"/>\n        <rect x=\"31.5\" y=\"31.5\" width=\"16.5\" height=\"16.5\"/><rect x=\"64.5\" y=\"31.5\" width=\"16.5\" height=\"16.5\"/>\n        <rect x=\"15\" y=\"48\" width=\"16.5\" height=\"16.5\"/><rect x=\"48\" y=\"48\" width=\"16.5\" height=\"16.5\"/>\n        <rect x=\"31.5\" y=\"64.5\" width=\"16.5\" height=\"16.5\"/><rect x=\"64.5\" y=\"64.5\" width=\"16.5\" height=\"16.5\"/>\n      </g>\n    </g>\n    <rect x=\"15\" y=\"15\" width=\"66\" height=\"66\" rx=\"8\" fill=\"none\" stroke=\"#b58863\" stroke-width=\"1.5\"/>\n    <text x=\"48\" y=\"63\" font-size=\"40\" text-anchor=\"middle\" fill=\"#1b1b1b\" font-family=\"serif\">♞</text>\n  </svg>"
  },
  {
    "id": "go",
    "name": "围棋",
    "nameEn": "Go",
    "tagline": "落子围地，吃子争先",
    "description": "在交叉点落子，围出更多地盘。内置提子、打劫、数子等完整规则。",
    "accent": "#0f766e",
    "art": "\n  <svg viewBox=\"0 0 96 96\" width=\"72\" height=\"72\">\n    <rect x=\"6\" y=\"6\" width=\"84\" height=\"84\" rx=\"12\" fill=\"#e8c184\" stroke=\"#b98a45\" stroke-width=\"2\"/>\n    <g stroke=\"#8a6a38\" stroke-width=\"1.4\">\n      <line x1=\"22\" y1=\"22\" x2=\"74\" y2=\"22\"/><line x1=\"22\" y1=\"37\" x2=\"74\" y2=\"37\"/>\n      <line x1=\"22\" y1=\"52\" x2=\"74\" y2=\"52\"/><line x1=\"22\" y1=\"67\" x2=\"74\" y2=\"67\"/>\n      <line x1=\"22\" y1=\"22\" x2=\"22\" y2=\"67\"/><line x1=\"37\" y1=\"22\" x2=\"37\" y2=\"67\"/>\n      <line x1=\"52\" y1=\"22\" x2=\"52\" y2=\"67\"/><line x1=\"67\" y1=\"22\" x2=\"67\" y2=\"67\"/>\n      <line x1=\"74\" y1=\"22\" x2=\"74\" y2=\"67\"/>\n    </g>\n    <circle cx=\"40\" cy=\"44\" r=\"11\" fill=\"#111\"/>\n    <circle cx=\"58\" cy=\"56\" r=\"11\" fill=\"#f7f3e9\" stroke=\"#cbbfa5\"/>\n  </svg>"
  },
  {
    "id": "draughts",
    "name": "国际跳棋",
    "nameEn": "Draughts",
    "tagline": "强制吃子，连吃升王",
    "description": "10x10 国际跳棋（波兰跳棋）规则，含强制吃子、多子连吃与飞王。",
    "accent": "#8a6a3f",
    "art": "\n  <svg viewBox=\"0 0 96 96\" width=\"72\" height=\"72\">\n    <rect x=\"6\" y=\"6\" width=\"84\" height=\"84\" rx=\"12\" fill=\"#8a6a3f\" stroke=\"#4a3418\" stroke-width=\"2\"/>\n    <g fill=\"#e8d3a6\">\n      <rect x=\"6\" y=\"6\" width=\"21\" height=\"21\"/><rect x=\"48\" y=\"6\" width=\"21\" height=\"21\"/>\n      <rect x=\"27\" y=\"27\" width=\"21\" height=\"21\"/><rect x=\"69\" y=\"27\" width=\"21\" height=\"21\"/>\n      <rect x=\"6\" y=\"48\" width=\"21\" height=\"21\"/><rect x=\"48\" y=\"48\" width=\"21\" height=\"21\"/>\n      <rect x=\"27\" y=\"69\" width=\"21\" height=\"21\"/><rect x=\"69\" y=\"69\" width=\"21\" height=\"21\"/>\n    </g>\n    <circle cx=\"37\" cy=\"48\" r=\"11\" fill=\"#111\"/>\n    <circle cx=\"58\" cy=\"27\" r=\"11\" fill=\"#111\"/>\n    <circle cx=\"37\" cy=\"69\" r=\"11\" fill=\"#f7f3e9\"/>\n    <circle cx=\"58\" cy=\"48\" r=\"11\" fill=\"#f7f3e9\"/>\n  </svg>"
  },
  {
    "id": "chinesecheckers",
    "name": "六角跳棋",
    "nameEn": "Hex Checkers",
    "tagline": "连跳腾挪，抢占对岸",
    "description": "六角星棋盘双人跳棋，含相邻步与连续跳跃，把全部棋子送抵对岸三角区。",
    "accent": "#e2483d",
    "art": "\n  <svg viewBox=\"0 0 96 96\" width=\"72\" height=\"72\">\n    <rect x=\"6\" y=\"6\" width=\"84\" height=\"84\" rx=\"12\" fill=\"#f2ead8\" stroke=\"#cbb98f\" stroke-width=\"2\"/>\n    <polygon points=\"48,10 62,34 38,34\" fill=\"rgba(226,72,61,0.25)\"/>\n    <polygon points=\"48,86 34,62 62,62\" fill=\"rgba(79,127,240,0.25)\"/>\n    <g fill=\"#b9a680\">\n      <circle cx=\"48\" cy=\"14\" r=\"3\"/><circle cx=\"43\" cy=\"24\" r=\"3\"/><circle cx=\"53\" cy=\"24\" r=\"3\"/>\n      <circle cx=\"48\" cy=\"44\" r=\"3\"/><circle cx=\"40\" cy=\"44\" r=\"3\"/><circle cx=\"56\" cy=\"44\" r=\"3\"/>\n      <circle cx=\"48\" cy=\"82\" r=\"3\"/><circle cx=\"43\" cy=\"72\" r=\"3\"/><circle cx=\"53\" cy=\"72\" r=\"3\"/>\n    </g>\n    <circle cx=\"48\" cy=\"34\" r=\"5\" fill=\"#e2483d\"/><circle cx=\"38\" cy=\"34\" r=\"5\" fill=\"#e2483d\"/>\n    <circle cx=\"48\" cy=\"62\" r=\"5\" fill=\"#4f7ff0\"/><circle cx=\"58\" cy=\"62\" r=\"5\" fill=\"#4f7ff0\"/>\n  </svg>"
  },
  {
    "id": "reversi",
    "name": "黑白棋",
    "nameEn": "Reversi",
    "tagline": "夹子翻转，占角为王",
    "description": "奥赛罗规则，含夹子翻转、行动力与占角策略，落子强制合法。",
    "accent": "#2f7d4f",
    "art": "\n  <svg viewBox=\"0 0 96 96\" width=\"72\" height=\"72\">\n    <rect x=\"6\" y=\"6\" width=\"84\" height=\"84\" rx=\"12\" fill=\"#3f8459\" stroke=\"#2a5c3c\" stroke-width=\"2\"/>\n    <g stroke=\"#264f34\" stroke-width=\"1.2\">\n      <line x1=\"6\" y1=\"34\" x2=\"90\" y2=\"34\"/><line x1=\"6\" y1=\"62\" x2=\"90\" y2=\"62\"/>\n      <line x1=\"34\" y1=\"6\" x2=\"34\" y2=\"90\"/><line x1=\"62\" y1=\"6\" x2=\"62\" y2=\"90\"/>\n    </g>\n    <circle cx=\"34\" cy=\"34\" r=\"11\" fill=\"#f7f3e9\" stroke=\"#cbbfa5\"/>\n    <circle cx=\"62\" cy=\"34\" r=\"11\" fill=\"#111\"/>\n    <circle cx=\"34\" cy=\"62\" r=\"11\" fill=\"#111\"/>\n    <circle cx=\"62\" cy=\"62\" r=\"11\" fill=\"#f7f3e9\" stroke=\"#cbbfa5\"/>\n  </svg>"
  },
  {
    "id": "jungle",
    "name": "斗兽棋",
    "nameEn": "Jungle",
    "tagline": "兽穴之争，鼠象相克",
    "description": "丛林斗兽棋，含等级吃子、鼠象相克、下水规则、虎狮跳河与兽穴取胜。",
    "accent": "#c98a3a",
    "art": "\n  <svg viewBox=\"0 0 96 96\" width=\"72\" height=\"72\">\n    <rect x=\"6\" y=\"6\" width=\"84\" height=\"84\" rx=\"12\" fill=\"#e6d3a3\" stroke=\"#c49a58\" stroke-width=\"2\"/>\n    <rect x=\"14\" y=\"40\" width=\"68\" height=\"24\" fill=\"#8fc4e0\"/>\n    <circle cx=\"30\" cy=\"22\" r=\"11\" fill=\"#fbf1da\" stroke=\"#b3261e\" stroke-width=\"3\"/>\n    <text x=\"30\" y=\"27\" font-size=\"14\" font-weight=\"700\" text-anchor=\"middle\" fill=\"#b3261e\" font-family=\"KaiTi, serif\">狮</text>\n    <circle cx=\"66\" cy=\"22\" r=\"11\" fill=\"#fbf1da\" stroke=\"#1d4ed8\" stroke-width=\"3\"/>\n    <text x=\"66\" y=\"27\" font-size=\"14\" font-weight=\"700\" text-anchor=\"middle\" fill=\"#1d4ed8\" font-family=\"KaiTi, serif\">象</text>\n  </svg>"
  },
  {
    "id": "uno",
    "name": "UNO",
    "nameEn": "UNO",
    "tagline": "同色同数，先出完获胜",
    "description": "经典 UNO：4 人对局，含跳过、反转、+2、变色与 +4 等全部功能牌。",
    "accent": "#e2422f",
    "art": "\n  <svg viewBox=\"0 0 96 96\" width=\"72\" height=\"72\">\n    <rect x=\"8\" y=\"14\" width=\"34\" height=\"52\" rx=\"8\" fill=\"#e2422f\" stroke=\"#7a1f16\" stroke-width=\"2\" transform=\"rotate(-12 25 40)\"/>\n    <rect x=\"40\" y=\"20\" width=\"34\" height=\"52\" rx=\"8\" fill=\"#2f6fd0\" stroke=\"#16376b\" stroke-width=\"2\" transform=\"rotate(6 57 46)\"/>\n    <ellipse cx=\"57\" cy=\"48\" rx=\"15\" ry=\"9\" fill=\"#fbf7ec\" transform=\"rotate(6 57 46)\"/>\n    <text x=\"57\" y=\"54\" font-size=\"16\" font-weight=\"800\" text-anchor=\"middle\" fill=\"#2f6fd0\" transform=\"rotate(6 57 46)\">7</text>\n  </svg>"
  },
  {
    "id": "shengji",
    "name": "升级 / 拖拉机",
    "nameEn": "Sheng Ji",
    "tagline": "亮主抢分，墩牌升级",
    "description": "四人两队升级/拖拉机（简化版）：亮主、跟花色、主牌压制与 80 分计分。",
    "accent": "#25506e",
    "art": "\n  <svg viewBox=\"0 0 96 96\" width=\"72\" height=\"72\">\n    <rect x=\"6\" y=\"6\" width=\"84\" height=\"84\" rx=\"12\" fill=\"#25506e\" stroke=\"#16324a\" stroke-width=\"2\"/>\n    <rect x=\"18\" y=\"22\" width=\"26\" height=\"40\" rx=\"5\" fill=\"#fbf7ec\" stroke=\"#b9b0a0\" stroke-width=\"2\"/>\n    <text x=\"31\" y=\"48\" font-size=\"15\" text-anchor=\"middle\" fill=\"#1b1b1b\" font-family=\"serif\">♠A</text>\n    <rect x=\"42\" y=\"26\" width=\"26\" height=\"40\" rx=\"5\" fill=\"#fbf7ec\" stroke=\"#b9b0a0\" stroke-width=\"2\"/>\n    <text x=\"55\" y=\"52\" font-size=\"15\" text-anchor=\"middle\" fill=\"#c0392b\" font-family=\"serif\">♥5</text>\n    <circle cx=\"70\" cy=\"66\" r=\"10\" fill=\"#facc15\"/>\n    <text x=\"70\" y=\"71\" font-size=\"12\" text-anchor=\"middle\" fill=\"#7a5a00\" font-family=\"serif\">10</text>\n  </svg>"
  },
  {
    "id": "guandan",
    "name": "掼蛋",
    "nameEn": "Guandan",
    "tagline": "双副组队，配合出牌",
    "description": "四人两队掼蛋（简化版）：两副牌比牌、队友配合、炸弹与天王炸。",
    "accent": "#8a5a2b",
    "art": "\n  <svg viewBox=\"0 0 96 96\" width=\"72\" height=\"72\">\n    <rect x=\"10\" y=\"12\" width=\"30\" height=\"46\" rx=\"6\" fill=\"#fbf7ec\" stroke=\"#b9b0a0\" stroke-width=\"2\"/>\n    <text x=\"25\" y=\"42\" font-size=\"16\" text-anchor=\"middle\" fill=\"#1b1b1b\" font-family=\"serif\">♣10</text>\n    <rect x=\"36\" y=\"16\" width=\"30\" height=\"46\" rx=\"6\" fill=\"#fbf7ec\" stroke=\"#b9b0a0\" stroke-width=\"2\"/>\n    <text x=\"51\" y=\"46\" font-size=\"16\" text-anchor=\"middle\" fill=\"#c0392b\" font-family=\"serif\">♦K</text>\n    <rect x=\"24\" y=\"34\" width=\"30\" height=\"46\" rx=\"6\" fill=\"#fbf7ec\" stroke=\"#b9b0a0\" stroke-width=\"2\"/>\n    <text x=\"39\" y=\"64\" font-size=\"16\" text-anchor=\"middle\" fill=\"#1b1b1b\" font-family=\"serif\">♠5</text>\n  </svg>"
  },
  {
    "id": "doudizhu",
    "name": "斗地主",
    "nameEn": "Dou Dizhu",
    "tagline": "叫分夺地主，先出完获胜",
    "description": "3 人斗地主：叫分抢地主、全套牌型（顺子/连对/飞机/炸弹/王炸）与队友配合。",
    "accent": "#b3261e",
    "art": "\n  <svg viewBox=\"0 0 96 96\" width=\"72\" height=\"72\">\n    <rect x=\"20\" y=\"14\" width=\"30\" height=\"48\" rx=\"6\" fill=\"#fbf7ec\" stroke=\"#b9b0a0\" stroke-width=\"2\"/>\n    <text x=\"35\" y=\"42\" font-size=\"17\" text-anchor=\"middle\" fill=\"#1b1b1b\" font-family=\"serif\">♠A</text>\n    <rect x=\"46\" y=\"14\" width=\"30\" height=\"48\" rx=\"6\" fill=\"#fbf7ec\" stroke=\"#b9b0a0\" stroke-width=\"2\"/>\n    <text x=\"61\" y=\"42\" font-size=\"17\" text-anchor=\"middle\" fill=\"#c0392b\" font-family=\"serif\">♥K</text>\n    <rect x=\"33\" y=\"30\" width=\"30\" height=\"48\" rx=\"6\" fill=\"#fbf7ec\" stroke=\"#8a8271\" stroke-width=\"2.4\"/>\n    <text x=\"48\" y=\"60\" font-size=\"17\" text-anchor=\"middle\" fill=\"#c0392b\" font-family=\"serif\">♦Q</text>\n  </svg>"
  }
];

export const LOADERS = {
  "xiangqi": () => import('../games/xiangqi/index.js'),
  "janggi": () => import('../games/janggi/index.js'),
  "shogi": () => import('../games/shogi/index.js'),
  "gomoku": () => import('../games/gomoku/index.js'),
  "chess": () => import('../games/chess/index.js'),
  "go": () => import('../games/go/index.js'),
  "draughts": () => import('../games/draughts/index.js'),
  "chinesecheckers": () => import('../games/chinesecheckers/index.js'),
  "reversi": () => import('../games/reversi/index.js'),
  "jungle": () => import('../games/jungle/index.js'),
  "uno": () => import('../games/uno/index.js'),
  "shengji": () => import('../games/shengji/index.js'),
  "guandan": () => import('../games/guandan/index.js'),
  "doudizhu": () => import('../games/doudizhu/index.js'),
};

const _cache = new Map();

export function getGameMeta(id) {
  return GAMES_META.find((g) => g.id === id) || null;
}

export async function loadGame(id) {
  if (_cache.has(id)) return _cache.get(id);
  const loader = LOADERS[id];
  if (!loader) return null;
  const mod = (await loader()).default;
  _cache.set(id, mod);
  return mod;
}
