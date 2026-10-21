// Arena 浏览器入口：单文件包
// 最短用法：<script src="arena.js"></script>   -> 直接渲染默认棋种
// 换棋种：  <script src="arena.js?game=gomoku"></script>
// 也可写 data-* 属性：<script src="arena.js" data-arena="xiangqi"></script>
// 只要核心 API、不要自动渲染：加 data-manual，然后调用 Arena.create()
import ArenaSDK from './index.js';
import { mount, autoMount } from './mount.js';

const Arena = Object.assign({}, ArenaSDK, { mount, autoMount });

if (typeof window !== 'undefined') {
  const scriptEl = document.currentScript;
  const attrs = scriptEl ? scriptEl.dataset : null;
  window.Arena = Arena;

  if (scriptEl && !(attrs && attrs.manual !== undefined)) {
    const params = new URL(scriptEl.src, location.href).searchParams;
    const pick = (...keys) => {
      for (const k of keys) {
        if (attrs && attrs[k]) return attrs[k];
        const v = params.get(k);
        if (v) return v;
      }
      return undefined;
    };
    const size = pick('size');

    const host = document.createElement('div');
    if (scriptEl.parentNode === document.head) document.body.appendChild(host);
    else scriptEl.after(host);

    mount(host, {
      game: pick('arena', 'game'),
      size: size ? Number(size) : undefined,
      side: pick('side'),
      difficulty: pick('difficulty'),
      theme: pick('theme'),
      aspect: pick('aspect'),
    }).catch((err) => console.error(err));
  }

  const ready = () => { autoMount(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
}

export default Arena;
export { mount, autoMount };
export * from './index.js';
