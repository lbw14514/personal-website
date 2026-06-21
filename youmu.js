(function () {
  if (window.innerWidth <= 768) return;
  const size = 256;
  const container = document.createElement("div");
  container.id = "youmu-container";
  container.style.cssText = `
    position:fixed; bottom:20px; left:20px;
    width:${size}px; height:${size}px; z-index:9998;
    transition:transform 0.2s ease;
    cursor:pointer;
  `;
  const img = document.createElement("img");
  img.src = "youmu.gif";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  container.appendChild(img);
  document.body.appendChild(container);

  container.addEventListener("mouseenter", () => {
    container.style.transform = "scale(1.12)";
  });
  container.addEventListener("mouseleave", () => {
    container.style.transform = "scale(1)";
  });

  const dialogues = [
    "幽幽子大人又饿了……我去做饭了",
    "半灵今天有点不舒服，要抱抱",
    "听说人间之里开了新的团子店！",
    "楼观剑该保养了……",
    "今天也是和平的一天呢～",
    "你看起来需要一些弹幕训练",
    "别碰我的半灵！",
    "幻想乡的樱花真美啊",
    "再偷懒的话幽幽子大人会生气的",
    "有什么能帮你的吗？"
  ];

  function showBubble(x, y) {
    const bubble = document.createElement("div");
    const text = dialogues[Math.floor(Math.random() * dialogues.length)];
    bubble.textContent = text;
    bubble.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y - 40}px;
      background: rgba(255,255,255,0.9);
      border: 1px solid #be185d;
      border-radius: 12px;
      padding: 6px 14px;
      font-size: 13px;
      color: #1f2937;
      max-width: 200px;
      z-index: 99999;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: fadeUp 2.5s ease forwards;
    `;
    document.body.appendChild(bubble);
    setTimeout(() => {
      bubble.remove();
    }, 2500);
  }

  container.addEventListener("click", (e) => {
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const topY = rect.top;
    showBubble(centerX, topY);
  });

  if (!document.getElementById('fadeUpStyle')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'fadeUpStyle';
    styleSheet.textContent = `
      @keyframes fadeUp {
        0% { opacity: 1; transform: translateY(0); }
        70% { opacity: 1; transform: translateY(-10px); }
        100% { opacity: 0; transform: translateY(-20px); }
      }
    `;
    document.head.appendChild(styleSheet);
  }
})();