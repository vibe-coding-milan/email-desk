'use strict';
(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let choice = 'system';
  try { const saved = localStorage.getItem('email-desk-theme'); if (['system', 'light', 'dark'].includes(saved)) choice = saved; } catch { /* Theme still works when storage is disabled. */ }
  function apply() {
    document.documentElement.dataset.theme = choice === 'system' ? (media.matches ? 'dark' : 'light') : choice;
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === choice)));
  }
  apply();
  media.addEventListener('change', apply);
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => {
      choice = button.dataset.themeChoice;
      try { localStorage.setItem('email-desk-theme', choice); } catch { /* Keep the current session's choice. */ }
      apply();
    }));
  });
})();
