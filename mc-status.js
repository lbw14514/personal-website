(() => {
  const statusContainer = document.getElementById('mc-status-container');
  const potatoCard = document.getElementById('potato-card');
  if (!statusContainer || !potatoCard) return;

  const SERVER_IP = 'touhou.wuyulbw.top';
  const COOLDOWN = 30000;
  let lastRefresh = 0;
  let cooldownTimer = null;
  let observer = null;

  const fallbackApis = [
    {
      fetch: () => fetch(`https://api.mcsrvstat.us/2/${SERVER_IP}`),
      parser: (data) => data.online ? `MC幻想乡服务器：🟢 在线 | 玩家: ${data.players.online}/${data.players.max}` : 'MC幻想乡服务器：🔴 离线'
    },
    {
      fetch: () => {
        const [host, port = '25565'] = SERVER_IP.split(':');
        return fetch(`https://mcapi.us/server/status?ip=${host}&port=${port}`);
      },
      parser: (data) => data.online ? `MC幻想乡服务器：🟢 在线 | 玩家: ${data.players.now}/${data.players.max}` : 'MC幻想乡服务器：🔴 离线'
    },
    {
      fetch: () => {
        const [host, port = '25565'] = SERVER_IP.split(':');
        return fetch(`https://api.minetools.eu/ping/${host}/${port}`);
      },
      parser: (data) => data.error === undefined && data.latency !== undefined ? `MC幻想乡服务器：🟢 在线 | 玩家: ${data.players.online}/${data.players.max}` : 'MC幻想乡服务器：🔴 离线'
    },
    {
      fetch: () => {
        const [host, port = '25565'] = SERVER_IP.split(':');
        return fetch(`https://api.mcstatus.io/v2/status/java/${host}:${port}`);
      },
      parser: (data) => data.online ? `MC幻想乡服务器：🟢 在线 | 玩家: ${data.players.online}/${data.players.max}` : 'MC幻想乡服务器：🔴 离线'
    }
  ];

  async function resolveSRV(host) {
    const dohEndpoints = [
      `https://dns.google/resolve?name=_minecraft._tcp.${host}&type=SRV`,
      `https://cloudflare-dns.com/dns-query?name=_minecraft._tcp.${host}&type=SRV`,
      `https://dns.quad9.net:5053/dns-query?name=_minecraft._tcp.${host}&type=SRV`,
      `https://doh.opendns.com/dns-query?name=_minecraft._tcp.${host}&type=SRV`
    ];
    for (const url of dohEndpoints) {
      try {
        const res = await fetch(url, { headers: { 'Accept': 'application/dns-json' } });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.Answer && data.Answer.length > 0) {
          for (let ans of data.Answer) {
            const parts = ans.data.split(' ');
            if (parts.length >= 4) {
              const target = parts[3];
              const port = parseInt(parts[2]);
              return { target, port };
            }
          }
        }
      } catch (e) { continue; }
    }
    return null;
  }

  async function localFetch(host, port) {
    const res = await fetch(`/api/mc-status?host=${encodeURIComponent(host)}&port=${encodeURIComponent(port)}`);
    if (!res.ok) throw new Error('local failed');
    const data = await res.json();
    if (data.online) return `MC幻想乡服务器：🟢 在线 | 玩家: ${data.players.online}/${data.players.max}`;
    return 'MC幻想乡服务器：🔴 离线';
  }

  async function fetchWithFallback(showTip = false) {
    const [host, portStr = '25565'] = SERVER_IP.split(':');
    const port = parseInt(portStr);
    const manualPort = SERVER_IP.includes(':') && portStr !== '25565'; 

    try {
      let result = await localFetch(host, port);
      if (result !== 'MC幻想乡服务器：🔴 离线' || manualPort) return result; 

      const srv = await resolveSRV(host);
      if (srv && (srv.target !== host || srv.port !== port)) {
        try {
          result = await localFetch(srv.target, srv.port);
        } catch (e) { 

         }
      }
      return result;
    } catch (e) {
      let result = null;
      for (let api of fallbackApis) {
        try {
          const res = await api.fetch();
          if (res.ok) {
            const data = await res.json();
            result = api.parser(data);
            break;
          }
        } catch (e) {}
      }
      if (!result) {
        try {
          result = await localFetch(host, port);
        } catch (e) {}
        if (!result) {
          if (!manualPort) {
            const srv = await resolveSRV(host);
            if (srv && (srv.target !== host || srv.port !== port)) {
              try { result = await localFetch(srv.target, srv.port); } catch (e) {}
            }
          }
        }
      }
      if (showTip && result && !result.startsWith('MC幻想乡服务器：')) {
      }
      return result || 'MC幻想乡服务器：⚠️ 所有接口检测失败';
    }
  }

  function setupUI() {
    statusContainer.innerHTML = `
      <span id="mc-status-text">⏳ 加载中…</span>
      <span id="mc-refresh-btn" style="cursor:pointer;margin-left:8px;user-select:none;font-size:0.9rem;">🔄 刷新</span>
    `;
    const refreshBtn = document.getElementById('mc-refresh-btn');
    const statusText = document.getElementById('mc-status-text');

    function startCooldown() {
      lastRefresh = Date.now();
      if (cooldownTimer) clearInterval(cooldownTimer);
      refreshBtn.style.opacity = '0.4';
      refreshBtn.style.pointerEvents = 'none';
      refreshBtn.textContent = '⏳ 30s';
      cooldownTimer = setInterval(() => {
        const remaining = Math.ceil((COOLDOWN - (Date.now() - lastRefresh)) / 1000);
        if (remaining <= 0) {
          clearInterval(cooldownTimer);
          cooldownTimer = null;
          refreshBtn.style.opacity = '1';
          refreshBtn.style.pointerEvents = 'auto';
          refreshBtn.textContent = '🔄 刷新';
        } else {
          refreshBtn.textContent = `⏳ ${remaining}s`;
        }
      }, 200);
    }

    async function doRefresh(userTriggered = false) {
      statusText.textContent = '⏳ 检测中…';
      refreshBtn.style.opacity = '0.5';
      refreshBtn.style.pointerEvents = 'none';

      const result = await fetchWithFallback(userTriggered);
      statusText.textContent = result;
      startCooldown();
    }

    refreshBtn.onclick = () => {
      if (lastRefresh && Date.now() - lastRefresh < COOLDOWN) return;
      doRefresh(true);
    };

    doRefresh(false);
  }

  function stopDetection() {
    if (cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = null; }
    statusContainer.innerHTML = '';
  }

  function startDetection() { setupUI(); }

  observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.attributeName === 'class') {
        const active = potatoCard.classList.contains('active');
        active ? startDetection() : stopDetection();
      }
    });
  });
  observer.observe(potatoCard, { attributes: true, attributeFilter: ['class'] });
  if (potatoCard.classList.contains('active')) startDetection();
})();