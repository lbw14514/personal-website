(() => {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:10000;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const FLAKE_COUNT = 30;
  const flakes = [];
  let snowImage = null;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function isDarkMode() {
    return document.documentElement.classList.contains('force-dark') ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function createSnowflakeImage(size, dark) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = size;
    offCanvas.height = size;
    const offCtx = offCanvas.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 1;

    if (dark) {
      offCtx.fillStyle = '#e0e8f0';
      offCtx.strokeStyle = '#c8d6e5';
    } else {
      offCtx.fillStyle = '#7f9cb5';
      offCtx.strokeStyle = '#6a8ba3';
    }
    offCtx.lineWidth = 1;

    function drawBranch(x, y, len, angle, depth) {
      if (depth <= 0 || len < 1) return;
      offCtx.beginPath();
      offCtx.moveTo(x, y);
      const endX = x + len * Math.cos(angle);
      const endY = y + len * Math.sin(angle);
      offCtx.lineTo(endX, endY);
      offCtx.stroke();
      const subLen = len * 0.45;
      const spread = 0.6;
      drawBranch(endX, endY, subLen, angle + spread, depth - 1);
      drawBranch(endX, endY, subLen, angle - spread, depth - 1);
    }

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      drawBranch(cx, cy, r * 0.8, angle, 3);
    }

    offCtx.beginPath();
    offCtx.arc(cx, cy, r * 0.2, 0, Math.PI * 2);
    offCtx.fill();

    return offCanvas;
  }

  function updateSnowImage() {
    snowImage = createSnowflakeImage(36, isDarkMode());
  }

  updateSnowImage();

  const observer = new MutationObserver(() => {
    updateSnowImage();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkMediaQuery.addEventListener('change', () => {
    updateSnowImage();
  });

  class Snowflake {
    constructor() {
      this.reset(true);
    }
    reset(randomY) {
      this.x = Math.random() * canvas.width;
      this.y = randomY ? Math.random() * canvas.height : -30 - Math.random() * 120;
      this.size = 10 + Math.random() * 16;
      this.opacity = 0.5 + Math.random() * 0.4;
      this.speed = 0.3 + Math.random() * 0.8;
      this.wind = (Math.random() - 0.5) * 0.3;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.001 + Math.random() * 0.005;
      this.wobbleAmp = 0.1 + Math.random() * 0.3;
      this.rotation = Math.random() * Math.PI;
      this.rotSpeed = (Math.random() - 0.5) * 0.015;
    }
    update() {
      this.y += this.speed;
      this.wobble += this.wobbleSpeed;
      this.x += Math.sin(this.wobble) * this.wobbleAmp + this.wind;
      this.rotation += this.rotSpeed;
      if (this.y > canvas.height + 30) {
        this.reset(false);
        this.y = -30;
      }
      if (this.x < -40) this.x = canvas.width + 35;
      if (this.x > canvas.width + 40) this.x = -35;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      const scale = this.size / 36;
      ctx.drawImage(snowImage, -18 * scale, -18 * scale, 36 * scale, 36 * scale);
      ctx.restore();
    }
  }

  for (let i = 0; i < FLAKE_COUNT; i++) {
    flakes.push(new Snowflake());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    flakes.forEach(f => {
      f.update();
      f.draw();
    });
    requestAnimationFrame(animate);
  }
  animate();
})();