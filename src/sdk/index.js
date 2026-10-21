// Arena 棋牌核心 SDK
//
// 用法（浏览器 / Node 通用，核心层无 DOM 依赖）：
//   import ArenaSDK from './src/sdk/index.js';
//   const game = await ArenaSDK.create('xiangqi');
//   const moves = game.legalMoves();
//   game.play(moves[0]);
//   game.playAI({ difficulty: 'hard' });
//
// 皮肤界面由调用方自行实现：读取 game.state 渲染，用 legalMoves() 得到可落子项，
// play(move) 落子，aiMove()/playAI() 触发 AI。

import { CATALOG } from './catalog.js';

export const VERSION = '0.2.0';
export const DEFAULT_DIFFICULTY = 'hard';

const REGISTRY = new Map(CATALOG.map((g) => [g.id, g]));
const CORE_CACHE = new Map();

const META_KEYS = ['id', 'name', 'nameEn', 'tagline', 'accent', 'supports'];

/** 列出全部内置棋种元信息（不含引擎实现）。 */
export function list() {
  return [...REGISTRY.values()].map((g) => {
    const out = {};
    for (const k of META_KEYS) if (g[k] !== undefined) out[k] = g[k];
    return out;
  });
}

/** 是否存在该棋种。 */
export function has(id) {
  return REGISTRY.has(id);
}

/** 取单个棋种元信息；不存在返回 null。 */
export function meta(id) {
  const g = REGISTRY.get(id);
  if (!g) return null;
  const out = {};
  for (const k of META_KEYS) if (g[k] !== undefined) out[k] = g[k];
  return out;
}

/**
 * 注册自定义棋种，扩展内置清单。
 * @param {{id:string, name?:string, engine:object, ai:object, instantiate?:(engine:object,cfg:object)=>object}} game
 */
export function register(game) {
  if (!game || !game.id) throw new Error('[arena] register 需要提供 id');
  if (!game.engine) throw new Error('[arena] register 需要提供 engine 模块');
  const entry = {
    ...game,
    load: async () => [game.engine, game.ai || { chooseMove: () => null, suggestMove: () => null }],
    instantiate: game.instantiate || ((engine) => new engine.DefaultGame()),
  };
  REGISTRY.set(game.id, entry);
  CORE_CACHE.delete(game.id);
  return meta(game.id);
}

/** 加载某棋种的核心模块（engine + ai），带缓存。 */
export async function loadCore(id) {
  const g = REGISTRY.get(id);
  if (!g) throw new Error(`[arena] 未知棋种: ${id}`);
  if (!CORE_CACHE.has(id)) CORE_CACHE.set(id, g.load());
  const [engine, ai] = await CORE_CACHE.get(id);
  return { engine, ai, manifest: g };
}

/** 一次对局会话：统一的引擎门面。 */
export class Session {
  constructor(id, game, engine, ai, manifest) {
    this.id = id;
    this.game = game;
    this.engine = engine;
    this.ai = ai;
    this.manifest = manifest;
  }

  /** 原始引擎实例（含棋种私有字段，如 board / hands）。 */
  get state() {
    return this.game;
  }

  /** 当前轮到的方（棋类为颜色，卡牌为座位号）。 */
  get turn() {
    return this.game.turn;
  }

  get ended() {
    return !!this.game.ended;
  }

  get result() {
    return this.game.result || null;
  }

  /** 重开一局。 */
  reset() {
    this.game.reset();
    return this;
  }

  /** 合法着法列表；棋类返回 move 对象/索引，卡牌返回 {type:...} 描述，直接传给 play()。 */
  legalMoves(...args) {
    if (typeof this.manifest.moves === 'function') return this.manifest.moves(this.game, ...args);
    if (typeof this.game.legalMoves === 'function') return this.game.legalMoves(...args);
    if (typeof this.game.legalPlays === 'function') return this.game.legalPlays(...args);
    return [];
  }

  /** 落子 / 出牌。move 取自 legalMoves() 返回值。 */
  play(move) {
    return this.game.play(move);
  }

  /** 撤销一步。 */
  undo() {
    return typeof this.game.undo === 'function' ? this.game.undo() : false;
  }

  /** 认输（棋类支持）。 */
  resign(color) {
    return typeof this.game.resign === 'function' ? this.game.resign(color) : { ok: false, reason: 'unsupported' };
  }

  /** 计算当前局面下 AI 的着法（不落子）。 */
  aiMove({ difficulty = DEFAULT_DIFFICULTY } = {}) {
    return this.ai.chooseMove(this.game, difficulty);
  }

  /** 计算并立即执行 AI 着法。 */
  playAI({ difficulty = DEFAULT_DIFFICULTY } = {}) {
    const move = this.aiMove({ difficulty });
    if (move === undefined || move === null) return { ok: false, move: null };
    const res = this.play(move);
    return { ok: !!(res && res.ok), move, result: res };
  }

  /** 提示（当前方的最佳着法）。 */
  hint(color) {
    return this.ai.suggestMove(this.game, color === undefined ? this.game.turn : color);
  }

  /** 导出可 JSON 序列化的局面快照，用于存档 / 回放。 */
  save() {
    return typeof this.game.snapshot === 'function' ? this.game.snapshot() : null;
  }

  /** 从快照恢复局面。 */
  load(state) {
    if (state && typeof this.game.restore === 'function') this.game.restore(state);
    return this;
  }

  toJSON() {
    return { id: this.id, state: this.save() };
  }
}

/**
 * 创建一局游戏。
 * @param {string} id 棋种 id
 * @param {object} [config] 棋种配置（如 { size: 19 } / { boardSize: 15 }）
 * @returns {Promise<Session>}
 */
export async function create(id, config = {}) {
  const { engine, ai, manifest } = await loadCore(id);
  const game = manifest.instantiate(engine, config);
  return new Session(id, game, engine, ai, manifest);
}

export default {
  VERSION,
  DEFAULT_DIFFICULTY,
  list,
  has,
  meta,
  register,
  loadCore,
  create,
  Session,
};
