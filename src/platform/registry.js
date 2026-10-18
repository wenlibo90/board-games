// 棋种注册表：新增棋种只需在此引入并加入 GAMES

import go from '../games/go/index.js';
import xiangqi from '../games/xiangqi/index.js';
import janggi from '../games/janggi/index.js';
import chess from '../games/chess/index.js';
import shogi from '../games/shogi/index.js';
import jungle from '../games/jungle/index.js';
import draughts from '../games/draughts/index.js';
import reversi from '../games/reversi/index.js';
import gomoku from '../games/gomoku/index.js';
import chinesecheckers from '../games/chinesecheckers/index.js';
import uno from '../games/uno/index.js';
import shengji from '../games/shengji/index.js';
import guandan from '../games/guandan/index.js';
import doudizhu from '../games/doudizhu/index.js';

export const GAMES = [
  xiangqi, janggi, shogi, chess, go,
  draughts, chinesecheckers, gomoku, reversi, jungle,
  uno, shengji, guandan, doudizhu,
];

export function getGame(id) {
  return GAMES.find((g) => g.id === id) || null;
}
