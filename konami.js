const konamiCode = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'];
let konamiIndex = 0;
document.addEventListener('keydown', (e) => {
  if (e.code === konamiCode[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      konamiIndex = 0;
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;color:#fbbf24;font-size:5rem;font-weight:900;font-family:sans-serif;animation:fadeOut 2s 3s forwards;';
      overlay.textContent = '卢本伟牛逼';
      document.body.appendChild(overlay);
      const style = document.createElement('style');
      style.textContent = '@keyframes fadeOut{from{opacity:1}to{opacity:0}}';
      document.head.appendChild(style);
      setTimeout(() => { overlay.remove(); style.remove(); }, 5000);
    }
  } else {
    konamiIndex = (e.code === konamiCode[0]) ? 1 : 0;
  }
});