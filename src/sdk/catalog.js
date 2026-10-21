// 核心 SDK 棋种清单
// 只按需加载 engine + ai（纯逻辑，无 DOM 依赖），不引入 view / lessons / tutorial。
// 注意：动态 import 必须使用静态字符串路径，打包器才能正确拆包。

export const CATALOG = [
  {
    id: 'xiangqi', name: '中国象棋', nameEn: 'Xiangqi', accent: '#b3261e',
    tagline: '楚河汉界，隔子将军',
    load: () => Promise.all([import('../games/xiangqi/engine.js'), import('../games/xiangqi/ai.js')]),
    instantiate: (engine) => new engine.XiangqiGame(),
  },
  {
    id: 'janggi', name: '韩国象棋', nameEn: 'Janggi', accent: '#1d4ed8',
    tagline: '隔子包炮，用字行象',
    load: () => Promise.all([import('../games/janggi/engine.js'), import('../games/janggi/ai.js')]),
    instantiate: (engine) => new engine.JanggiGame(),
  },
  {
    id: 'shogi', name: '日本将棋', nameEn: 'Shogi', accent: '#7a5a2e',
    tagline: '升变打入，日本将棋',
    load: () => Promise.all([import('../games/shogi/engine.js'), import('../games/shogi/ai.js')]),
    instantiate: (engine) => new engine.ShogiGame(),
  },
  {
    id: 'gomoku', name: '五子棋', nameEn: 'Gomoku', accent: '#d29034',
    tagline: '连成五子，攻守兼备',
    load: () => Promise.all([import('../games/gomoku/engine.js'), import('../games/gomoku/ai.js')]),
    instantiate: (engine, cfg) => new engine.GomokuGame(cfg.size || cfg.boardSize || 15),
  },
  {
    id: 'chess', name: '国际象棋', nameEn: 'Chess', accent: '#334155',
    tagline: '王后车象马兵，将杀定胜负',
    load: () => Promise.all([import('../games/chess/engine.js'), import('../games/chess/ai.js')]),
    instantiate: (engine) => new engine.ChessGame(),
  },
  {
    id: 'go', name: '围棋', nameEn: 'Go', accent: '#0f766e',
    tagline: '落子围地，吃子争先',
    load: () => Promise.all([import('../games/go/engine.js'), import('../games/go/ai.js')]),
    instantiate: (engine, cfg) => new engine.GoGame(cfg.size || 9, cfg.komi === undefined ? 6.5 : cfg.komi),
  },
  {
    id: 'draughts', name: '国际跳棋', nameEn: 'Draughts', accent: '#8a6a3f',
    tagline: '强制吃子，连吃升王',
    load: () => Promise.all([import('../games/draughts/engine.js'), import('../games/draughts/ai.js')]),
    instantiate: (engine) => new engine.DraughtsGame(),
  },
  {
    id: 'chinesecheckers', name: '六角跳棋', nameEn: 'Hex Checkers', accent: '#e2483d',
    tagline: '连跳腾挪，抢占对岸',
    load: () => Promise.all([import('../games/chinesecheckers/engine.js'), import('../games/chinesecheckers/ai.js')]),
    instantiate: (engine) => new engine.CheckersGame(),
  },
  {
    id: 'reversi', name: '黑白棋', nameEn: 'Reversi', accent: '#2f7d4f',
    tagline: '夹子翻转，占角为王',
    load: () => Promise.all([import('../games/reversi/engine.js'), import('../games/reversi/ai.js')]),
    instantiate: (engine) => new engine.ReversiGame(),
  },
  {
    id: 'jungle', name: '斗兽棋', nameEn: 'Jungle', accent: '#c98a3a',
    tagline: '兽穴之争，鼠象相克',
    load: () => Promise.all([import('../games/jungle/engine.js'), import('../games/jungle/ai.js')]),
    instantiate: (engine) => new engine.JungleGame(),
  },
  {
    id: 'uno', name: 'UNO', nameEn: 'UNO', accent: '#e2422f',
    tagline: '同色同数，先出完获胜',
    load: () => Promise.all([import('../games/uno/engine.js'), import('../games/uno/ai.js')]),
    instantiate: (engine) => new engine.UnoGame(),
    // legalPlays 返回牌对象，play 需要 {type:'play', id}，这里统一为可执行令牌
    moves: (g, seat = g.turn) => {
      if (g.phase === 'afterDraw') {
        const l = g.legalPlays(seat);
        return l.length ? l.map((c) => ({ type: 'play', id: c.id })) : [{ type: 'pass' }];
      }
      return [...g.legalPlays(seat).map((c) => ({ type: 'play', id: c.id })), { type: 'draw' }];
    },
  },
  {
    id: 'shengji', name: '升级 / 拖拉机', nameEn: 'Sheng Ji', accent: '#25506e',
    tagline: '亮主抢分，墩牌升级',
    load: () => Promise.all([import('../games/shengji/engine.js'), import('../games/shengji/ai.js')]),
    instantiate: (engine) => new engine.ShengjiGame(),
    moves: (g, seat = g.turn) => {
      if (g.phase === 'trump') return ['S', 'H', 'D', 'C', 'NT'].map((suit) => ({ type: 'trump', suit }));
      const cards = g.trick.length ? g.legalFollower(seat) : g.hands[seat];
      return cards.map((c) => ({ type: 'play', card: c.id }));
    },
  },
  {
    id: 'guandan', name: '掼蛋', nameEn: 'Guandan', accent: '#8a5a2b',
    tagline: '双副组队，配合出牌',
    load: () => Promise.all([import('../games/guandan/engine.js'), import('../games/guandan/ai.js')]),
    instantiate: (engine) => new engine.GuandanGame(),
  },
  {
    id: 'doudizhu', name: '斗地主', nameEn: 'Dou Dizhu', accent: '#b3261e',
    tagline: '叫分夺地主，先出完获胜',
    load: () => Promise.all([import('../games/doudizhu/engine.js'), import('../games/doudizhu/ai.js')]),
    instantiate: (engine) => new engine.DouDizhuGame(),
    // 叫分阶段可枚举；出牌阶段需要组合搜索，暂由 playAI() 或调用方组合 move 驱动
    moves: (g) => (g.phase === 'bid' ? [0, 1, 2, 3].map((value) => ({ type: 'bid', value })) : []),
  },
];
