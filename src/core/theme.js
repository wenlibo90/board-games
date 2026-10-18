// 主题管理（明/暗），供整个应用共享

const KEY = 'boardgames-theme';

export function getTheme() {
  const stored = localStorage.getItem(KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function setTheme(theme) {
  localStorage.setItem(KEY, theme);
  document.documentElement.setAttribute('data-theme', theme);
}

export function applyTheme(theme) {
  setTheme(theme);
  return theme;
}

export function toggleTheme(current) {
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}
