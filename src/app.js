// 应用入口

import { Shell } from './platform/shell.js';

window.addEventListener('DOMContentLoaded', () => {
  window.__shell = new Shell();
});
