// 棋种注册表
// 首页与路由只依赖轻量元数据（games-meta.js）；具体棋种模块在打开时按需动态加载，
// 避免首次进入就加载全部棋种的引擎/AI/视图。

import { GAMES_META, LOADERS, loadGame, getGameMeta } from './games-meta.js';

export const GAMES = GAMES_META;
export { LOADERS, loadGame, getGameMeta };

export function getGame(id) {
  return getGameMeta(id);
}
