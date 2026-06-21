(function () {
  const container = document.getElementById('gif-area');
  if (!container) return;

  const gifs = ['gif1.gif', 'gif2.gif', 'gif3.gif'];

  gifs.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = `GIF ${i + 1}`;
    img.style.cssText = 'width:120px; height:120px; margin:0 10px; border-radius:12px; object-fit:contain; background:rgba(255,255,255,0.2);';
    container.appendChild(img);
  });
})();