const cards = document.querySelectorAll('.card');
const closeAllCards = () => {
  cards.forEach(card => {
    card.classList.remove('active');
    const title = card.querySelector('.card-title');
    if (title) {
      title.setAttribute('aria-expanded', 'false');
    }
  });
};

cards.forEach(card => {
  const title = card.querySelector('.card-title');
  const content = card.querySelector('.card-content');
  if (!title || !content) return;

  title.setAttribute('role', 'button');
  title.setAttribute('tabindex', '0');
  title.setAttribute('aria-expanded', 'false');

  const openCard = () => {
    const isActive = card.classList.contains('active');
    closeAllCards();
    if (!isActive) {
      card.classList.add('active');
      title.setAttribute('aria-expanded', 'true');
    }
  };

  title.addEventListener('click', openCard);
  title.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openCard();
    }
  });
});

const trailCount = 24;
const trailDots = [];
let trailIndex = 0;
const fadeStep = 0.03;
const gravity = 0.08;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

for (let i = 0; i < trailCount; i++) {
  const dot = document.createElement('div');
  dot.className = 'trail-dot';
  document.body.appendChild(dot);
  trailDots.push({ el: dot, x: mouseX, y: mouseY, vx: 0, vy: 0, alpha: 0 });
}

document.addEventListener('pointermove', event => {
  mouseX = event.clientX;
  mouseY = event.clientY;
  const dot = trailDots[trailIndex];
  dot.x = mouseX;
  dot.y = mouseY;
  dot.vx = (Math.random() - 0.5) * 0.4;
  dot.vy = 0.6 + Math.random() * 0.5;
  dot.alpha = 1;
  dot.size = 4 + Math.random() * 4;
  dot.el.style.width = `${dot.size}px`;
  dot.el.style.height = `${dot.size}px`;
  trailIndex = (trailIndex + 1) % trailCount;
});

const animateTrail = () => {
  trailDots.forEach(dot => {
    dot.vy += gravity * 0.3;
    dot.vx += (Math.random() - 0.5) * 0.01;
    dot.x += dot.vx;
    dot.y += dot.vy;
    dot.alpha = Math.max(0, dot.alpha - fadeStep);
    if (dot.alpha <= 0) {
      dot.el.style.opacity = 0;
      return;
    }
    dot.el.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0)`;
    dot.el.style.opacity = dot.alpha * 0.75;
  });
  requestAnimationFrame(animateTrail);
};

animateTrail();

(function visitorCount() {
  const countEl = document.getElementById('visitor-count');
  let count = localStorage.getItem('visitorCount');
  count = count ? parseInt(count) + 1 : 1;
  localStorage.setItem('visitorCount', count);

  let comment = '';
  if (count < 10)       comment = '✨幻想乡还很安静，你是早期的探索者呢';
  else if (count < 50)  comment = '🍵渐渐热闹起来了呀';
  else if (count < 100) comment = '🎆妖怪之山传来祭典的喧嚣，访客络绎不绝！';
  else if (count < 500) comment = '🌸博丽神社成为旅游景点，连巫女都开始加班了…';
  else                  comment = '牛逼啊！我出息了！';

  countEl.innerHTML = `🌸 幻想乡今日访客：第 ${count} 位<br><small>${comment}</small>`;
})();

const bgm = document.getElementById('bgm');
const toggleBtn = document.getElementById('musicToggle');
let tipShown = false;

function updateButtonState() {
  if (bgm.paused) {
    toggleBtn.textContent = '♪';
    toggleBtn.classList.remove('playing');
  } else {
    toggleBtn.textContent = '⏸';
    toggleBtn.classList.add('playing');
  }
}

function showMusicTip() {
  if (tipShown) return;
  tipShown = true;
  const tip = document.createElement('div');
  tip.className = 'music-tip';
  tip.innerHTML = '🎵 点击右下角按钮可关闭音乐';
  document.body.appendChild(tip);
  setTimeout(() => {
    tip.style.transition = 'opacity 0.6s ease';
    tip.style.opacity = '0';
    setTimeout(() => tip.remove(), 600);
  }, 5000);
}

toggleBtn.addEventListener('click', () => {
  if (bgm.paused) {
    bgm.play().then(() => {
      updateButtonState();
      showMusicTip();
    });
  } else {
    bgm.pause();
    updateButtonState();
  }
});

function attemptAutoplay() {
  bgm.play().then(() => {
    updateButtonState();
    showMusicTip();
  }).catch(() => {
    toggleBtn.textContent = '♪';
    const startAudioOnInteraction = () => {
      bgm.play().then(() => {
        updateButtonState();
        showMusicTip();
      });
      document.removeEventListener('click', startAudioOnInteraction);
      document.removeEventListener('keydown', startAudioOnInteraction);
    };
    document.addEventListener('click', startAudioOnInteraction, { once: true });
    document.addEventListener('keydown', startAudioOnInteraction, { once: true });
  });
}

window.addEventListener('load', attemptAutoplay);
bgm.addEventListener('play', updateButtonState);
bgm.addEventListener('pause', updateButtonState);