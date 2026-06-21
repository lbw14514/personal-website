(() => {
  const TOGGLE_KEY = 'dark-mode-preference';
  const btn = document.createElement('button');
  btn.textContent = '🌙';
  btn.style.cssText = 'position:fixed;bottom:76px;right:20px;width:48px;height:48px;border-radius:50%;background:rgba(214,51,126,0.35);backdrop-filter:blur(12px);border:2px solid rgba(214,51,126,0.55);box-shadow:0 0 24px rgba(214,51,126,0.35);color:#be185d;font-size:24px;line-height:48px;text-align:center;cursor:pointer;z-index:9999;transition:all 0.3s;';

  function setDark(enabled) {
    document.documentElement.classList.toggle('force-dark', enabled);
    btn.textContent = enabled ? '☀️' : '🌙';
    localStorage.setItem(TOGGLE_KEY, enabled);
  }

  const stored = localStorage.getItem(TOGGLE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = stored !== null ? stored === 'true' : prefersDark;
  setDark(isDark);

  btn.addEventListener('click', () => {
    const current = document.documentElement.classList.contains('force-dark');
    setDark(!current);
  });

  window.addEventListener('load', () => document.body.appendChild(btn));
})();