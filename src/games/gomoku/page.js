// 五子棋整页视图：木纹棋盘、落子动画、连珠发光、音效、礼花与结算弹窗。

import { MARKUP } from './markup.js';

const CSS_HREF = './assets/gomoku-page.css';
const JS_SRC = './assets/gomoku-page.js';
let cssLink = null;

export function mountPage(container, opts = {}) {
  if (!cssLink) {
    cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = CSS_HREF;
    cssLink.id = 'gomoku-page-css';
    document.head.appendChild(cssLink);
  }

  let html = MARKUP;
  if (!html.includes('id="size-15"')) {
    const sizeGroup =
      '<div class="config-group" id="size-wrapper">' +
      '<span class="config-label">棋盘路数</span>' +
      '<div class="select-buttons">' +
      '<button class="select-btn" id="size-13" onclick="setBoardSize(13)">13 路</button>' +
      '<button class="select-btn active" id="size-15" onclick="setBoardSize(15)">15 路</button>' +
      '<button class="select-btn" id="size-19" onclick="setBoardSize(19)">19 路</button>' +
      '</div></div>';
    html = html.replace('<div class="sound-toggle">', sizeGroup + '<div class="sound-toggle">');
  }
  container.innerHTML = html;
  container.insertAdjacentHTML(
    'afterbegin',
    '<button type="button" class="gz-back" id="gz-back" title="返回棋坊">&#8592; 返回棋坊</button>'
  );

  const back = container.querySelector('#gz-back');
  if (back) {
    back.addEventListener('click', () => { if (opts.onExit) opts.onExit(); });
  }

  if (window.__GZ_LOADED && typeof window.initializeBoardUI === 'function') {
    // 再次进入：重建棋盘 DOM 并重开一局
    window.initializeBoardUI();
    if (typeof window.resetGame === 'function') window.resetGame();
  } else {
    const s = document.createElement('script');
    s.src = JS_SRC;
    s.onload = () => { window.__GZ_LOADED = true; };
    document.body.appendChild(s);
  }

  return {
    destroy() {
      try { if (typeof window.stopFireworks === 'function') window.stopFireworks(); } catch (e) { /* noop */ }
      if (cssLink) { cssLink.remove(); cssLink = null; }
      container.innerHTML = '';
    },
  };
}
