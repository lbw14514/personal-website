(function () {
  if (window.innerWidth <= 768) return;
  const size = 128;
  const container = document.createElement("div");
  container.id = "reimu-container";
  container.style.cssText = `
    position:fixed; bottom:100px; right:80px;
    width:${size}px; height:${size}px; z-index:9997;
    transition:transform 0.2s ease;
    cursor:pointer;
  `;
  const img = document.createElement("img");
  img.src = "gif4.gif";
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
   "喂喂，看到巫女路过不给点赛钱吗？小心我退治杂鱼哦~",
    "神社又要修了……你眼神那么善良，肯定会帮忙的吧？",
    "今天好闲啊，谁请我喝杯茶？没钱买茶叶了",
    "我说你啊，最近厄运缠身，交点钱我帮你，退治失败我就跑路（肯定会退钱吧）",
    "杂鱼，能不能别光看，投点啥？下次异变我第一个保护你",
    "我可是在维护幻想乡的和平啊，交点保护费很正常吧",
    "今天的神签大吉——骗你的，但给钱的话我可以改口",
    "你难道不想和博丽的巫女成为朋友吗？朋友之间，赛钱是礼貌哦",
    "再盯着看可是要收费的，禁止免费参观！",
    "香火钱箱又空了，你忍心让神社关门大吉吗？"
  ];

  function showBubble(x, y) {
    const bubble = document.createElement("div");
    const text = dialogues[Math.floor(Math.random() * dialogues.length)];
    bubble.textContent = text;
    bubble.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y - 40}px;
      background: rgba(255,255,255,0.92);
      border: 1px solid #be185d;
      border-radius: 12px;
      padding: 6px 14px;
      font-size: 13px;
      color: #1f2937;
      max-width: 220px;
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