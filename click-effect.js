document.addEventListener('click', (e) => {
  const emojis = ['✨', '🌸', '⭐', '💖', '❄️', '🎵', '🍃'];
  const span = document.createElement('span');
  span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  span.style.cssText = `
    position:fixed; left:${e.clientX}px; top:${e.clientY}px;
    font-size:1.5rem; pointer-events:none; z-index:99999;
    animation: floatUp 1s ease-out forwards;
    transform: translate(-50%, -50%);
  `;
  document.body.appendChild(span);
  span.addEventListener('animationend', () => span.remove());
});

const floatStyle = document.createElement('style');
floatStyle.textContent = `
  @keyframes floatUp {
    0% { opacity:1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity:0; transform: translate(-50%, -150%) scale(0.5); }
  }
`;
document.head.appendChild(floatStyle);