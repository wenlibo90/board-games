// Arena 棋牌核心 SDK 类型声明
export type Difficulty = 'easy' | 'normal' | 'medium' | 'hard' | string;

/** 棋类 move 为 { from, to } 或索引，卡牌为 { type, ... }；统一视为不透明令牌，取自 legalMoves() 并回传 play()。 */
export type Move = unknown;

export interface GameMeta {
  id: string;
  name: string;
  nameEn: string;
  tagline: string;
  accent: string;
  supports?: Record<string, boolean>;
}

export interface RegisterOptions {
  id: string;
  name?: string;
  nameEn?: string;
  engine: Record<string, any>;
  ai?: {
    chooseMove?: (game: any, difficulty?: Difficulty) => Move;
    suggestMove?: (game: any, color?: any) => Move;
    [key: string]: any;
  };
  instantiate?: (engine: Record<string, any>, config: Record<string, any>) => any;
}

export declare const VERSION: string;
export declare const DEFAULT_DIFFICULTY: string;

export declare function list(): GameMeta[];
export declare function has(id: string): boolean;
export declare function meta(id: string): GameMeta | null;
export declare function register(game: RegisterOptions): GameMeta | null;
export declare function loadCore(id: string): Promise<{ engine: any; ai: any; manifest: any }>;

export declare class Session {
  readonly id: string;
  readonly game: any;
  readonly engine: any;
  readonly ai: any;
  readonly manifest: any;
  readonly state: any;
  readonly turn: any;
  readonly ended: boolean;
  readonly result: any;
  reset(): this;
  legalMoves(...args: any[]): Move[];
  play(move: Move): { ok: boolean; [key: string]: any };
  undo(): boolean;
  resign(color?: any): { ok: boolean; [key: string]: any };
  aiMove(opts?: { difficulty?: Difficulty }): Move;
  playAI(opts?: { difficulty?: Difficulty }): { ok: boolean; move: Move; result?: any };
  hint(color?: any): Move;
  save(): any;
  load(state: any): this;
  toJSON(): { id: string; state: any };
}

export declare function create(id: string, config?: Record<string, any>): Promise<Session>;

declare const ArenaSDK: {
  VERSION: typeof VERSION;
  DEFAULT_DIFFICULTY: typeof DEFAULT_DIFFICULTY;
  list: typeof list;
  has: typeof has;
  meta: typeof meta;
  register: typeof register;
  loadCore: typeof loadCore;
  create: typeof create;
  Session: typeof Session;
};

export default ArenaSDK;
