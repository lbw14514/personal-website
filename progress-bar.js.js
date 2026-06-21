(() => {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:0;left:0;width:0;height:3px;background:linear-gradient(90deg,#ec4899,#d946ef);z-index:99999;transition:width 0.3s ease;';
  document.body.appendChild(bar);

  let width = 0;
  const simulate = () => {
    if (width < 80) {
      width += Math.random() * 10;
      bar.style.width = width + '%';
      setTimeout(simulate, 200);
    }
  };
  simulate();

  window.addEventListener('load', () => {
    bar.style.width = '100%';
    setTimeout(() => {
      bar.style.opacity = '0';
      setTimeout(() => bar.remove(), 300);
    }, 100);
  });
})();