(function () {
  const desktopContainer = document.getElementById('clock-desktop-content');
  const mobileContainer = document.getElementById('clock-mobile-content');
  if (!desktopContainer && !mobileContainer) return;

  let regionName = '';
  let currentTime = null;
  let timer = null;

  async function getRegionFromIP(ip) {
    const geoApis = [
      `https://ipapi.co/${ip}/json/`,
      `http://ip-api.com/json/${ip}?lang=zh-CN&fields=city,regionName,country`,
      `https://ipinfo.io/${ip}/json`
    ];
    for (const url of geoApis) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          const city = data.city || '';
          const region = data.region || data.regionName || '';
          const country = data.country || data.country_name || '';
          const parts = [country, region, city].filter(Boolean);
          if (parts.length > 0) return parts.join(' ');
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  async function getIP() {
    const ipApis = [
      'https://api4.ipify.org?format=json',
      'https://ipv4.icanhazip.com',
      'https://ipv4.amazonaws.com/checkip',
      'https://api.ipify.org?format=json'
    ];
    for (const url of ipApis) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const text = await res.text();
          let ip = '';
          try {
            const json = JSON.parse(text);
            ip = json.ip || '';
          } catch {
            ip = text.trim();
          }
          if (ip) return ip;
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  async function fetchRegionAndTime() {
    try {
      const res = await fetch('https://worldtimeapi.org/api/ip', { signal: AbortSignal.timeout(4000) });
      const data = await res.json();
      if (data && data.timezone && data.datetime) {
        let region = data.timezone.split('/').pop().replace(/_/g, ' ');
        const ip = await getIP();
        if (ip) {
          const detailedRegion = await getRegionFromIP(ip);
          if (detailedRegion) region = detailedRegion;
        }
        startClock(region, data.datetime);
        return;
      }
    } catch (e) {}

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '本地';
    const region = tz.split('/').pop().replace(/_/g, ' ');
    startClock(region, new Date());
  }

  function startClock(region, initialDateTime) {
    regionName = region;
    currentTime = initialDateTime ? new Date(initialDateTime) : new Date();

    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      currentTime.setSeconds(currentTime.getSeconds() + 1);
      updateDisplay();
    }, 1000);
    updateDisplay();
  }

  function updateDisplay() {
    const hours = currentTime.getHours();
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const seconds = String(currentTime.getSeconds()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}:${seconds}`;

    const displayRegion = regionName ? regionName + ' 标准时间' : '标准时间';

    if (desktopContainer) {
      desktopContainer.innerHTML = `${displayRegion}<br><span style="font-size:1.4rem;font-weight:bold;">${timeStr}</span>`;
    }

    if (mobileContainer) {
      let tip = '';
      if (hours >= 0 && hours < 6) tip = '🌙 夜深了，该睡觉啦～';
      else if (hours < 12) tip = '☀️ 早上好，新的一天！';
      else if (hours < 18) tip = '🌤️ 下午好，别忘了休息哦～';
      else tip = '🌆 晚上好，放松一下～';

      mobileContainer.innerHTML = `
        ${displayRegion}<br>
        <span style="font-size:1.3rem;font-weight:bold;">${timeStr}</span><br>
        <span style="font-size:0.8rem;color:var(--text-secondary);">${tip}</span>
      `;
    }
  }

  window.addEventListener('load', fetchRegionAndTime);
})();