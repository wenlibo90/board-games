// Arena 浏览器入口：单文件包
// 零容器用法：<script src="arena.js" data-arena="xiangqi"></script>
//   -> 自动在脚本位置后创建容器并挂载默认皮肤
// 也可挂到已有容器：Arena.mount(el, { game }) 或页面里放 <div data-arena="..."></div>
import ArenaSDK from './index.js';
import { mount, autoMount } from './mount.js';

const Arena = Object.assign({}, ArenaSDK, { mount, autoMount });

if (typeof window !== 'undefined') {
  const scriptEl = document.currentScript;
  const attrs = scriptEl ? scriptEl.dataset : null;
  window.Arena = Arena;

  if (attrs && (attrs.arena || attrs.game)) {
    const host = document.createElement('div');
    if (scriptEl.parentNode === document.head) document.body.appendChild(host);
    else scriptEl.after(host);
    mount(host, {
      game: attrs.arena || attrs.game,
      size: attrs.size ? Number(attrs.size) : undefined,
      side: attrs.side,
      difficulty: attrs.difficulty,
      theme: attrs.theme,
      aspect: attrs.aspect,
    }).catch((err) => console.error(err));
  }

  const ready = () => { autoMount(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
}

export default Arena;
export { mount, autoMount };
export * from './index.js';
