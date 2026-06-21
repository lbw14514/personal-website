(function() {
  const backgrounds = [
    'url("bg1.jpg")',
    'url("bg2.jpg")',
    'url("bg3.jpg")',
    'url("bg4.jpg")'
  ];
  const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  document.documentElement.style.setProperty('--bg-image', randomBg);
})();