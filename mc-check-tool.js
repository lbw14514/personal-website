(() => {
  const toolContainer = document.getElementById('mc-check-tool');
  if (!toolContainer) return;

  const COOLDOWN = 30000;
  let lastCheck = 0;
  let timer = null;

  toolContainer.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px;">
      <div style="font-size:0.9rem; color:#be185d; margin-bottom:4px;">⚡ 仅支持 Java 版服务器</div>
      <div style="display:flex; flex-wrap:wrap; gap:8px;">
        <input type="text" id="mc-tool-host" placeholder="服务器地址（如 play.hypixel.net）" style="flex: 2 1 200px; padding:10px; border-radius:8px; border:1px solid #ccc;">
        <input type="text" id="mc-tool-port" placeholder="默认25565" style="flex: 1 1 100px; padding:10px; border-radius:8px; border:1px solid #ccc; min-width:100px;">
      </div>
      <button id="mc-tool-check-btn" style="padding:10px 24px; background:#be185d; color:#fff; border:none; border-radius:8px; cursor:pointer; align-self:flex-start; margin-top:4px;">检测</button>
    </div>
    <div id="mc-tool-result" style="margin-top:12px; font-weight:500;"></div>
  `;

  const hostInput = document.getElementById('mc-tool-host');
  const portInput = document.getElementById('mc-tool-port');
  const checkBtn = document.getElementById('mc-tool-check-btn');
  const resultDiv = document.getElementById('mc-tool-result');

  function startCooldown(sec) {
    if (timer) clearInterval(timer);
    checkBtn.disabled = true;
    checkBtn.style.opacity = '0.5';
    let left = sec;
    checkBtn.textContent = `⏳ ${left}s`;
    timer = setInterval(() => {
      left--;
      if (left <= 0) {
        clearInterval(timer);
        timer = null;
        checkBtn.disabled = false;
        checkBtn.style.opacity = '1';
        checkBtn.textContent = '检测';
      } else {
        checkBtn.textContent = `⏳ ${left}s`;
      }
    }, 1000);
  }

  function stopCooldown() {
    if (timer) { clearInterval(timer); timer = null; }
    checkBtn.disabled = false;
    checkBtn.style.opacity = '1';
    checkBtn.textContent = '检测';
  }

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
    if (data.online) return `🟢 在线 | 玩家: ${data.players.online}/${data.players.max}`;
    return '🔴 离线';
  }

  async function thirdPartyFetch(host, port) {
    const apis = [
      { fetch: () => fetch(`https://api.mcsrvstat.us/2/${host}:${port}`), parser: d => d.online ? `🟢 在线 | 玩家: ${d.players.online}/${d.players.max}` : '🔴 离线' },
      { fetch: () => fetch(`https://mcapi.us/server/status?ip=${host}&port=${port}`), parser: d => d.online ? `🟢 在线 | 玩家: ${d.players.now}/${d.players.max}` : '🔴 离线' },
      { fetch: () => fetch(`https://api.minetools.eu/ping/${host}/${port}`), parser: d => d.error===undefined && d.latency!==undefined ? `🟢 在线 | 玩家: ${d.players.online}/${d.players.max}` : '🔴 离线' },
      { fetch: () => fetch(`https://api.mcstatus.io/v2/status/java/${host}:${port}`), parser: d => d.online ? `🟢 在线 | 玩家: ${d.players.online}/${d.players.max}` : '🔴 离线' }
    ];
    for (let api of apis) {
      try {
        const res = await api.fetch();
        if (res.ok) {
          const data = await res.json();
          return api.parser(data);
        }
      } catch (e) {}
    }
    return '⚠️ 第三方检测失败';
  }

  async function handleCheck() {
    const host = hostInput.value.trim();
    let portStr = portInput.value.trim();
    let port = portStr === '' ? 25565 : parseInt(portStr);
    if (!host) return;

    if (lastCheck && Date.now() - lastCheck < COOLDOWN) {
      const remain = Math.ceil((COOLDOWN - (Date.now() - lastCheck)) / 1000);
      startCooldown(remain);
      return;
    }

    resultDiv.textContent = '⏳ 检测中…';
    lastCheck = Date.now();
    startCooldown(30);

    try {
      let result = await localFetch(host, port);
      resultDiv.textContent = result;

      if ((result === '🔴 离线' || result.includes('⚠️')) && portStr === '') {
        resultDiv.textContent = '⏳ 尝试 SRV 解析…';
        const srv = await resolveSRV(host);
        if (srv && (srv.target !== host || srv.port !== port)) {
          try {
            result = await localFetch(srv.target, srv.port);
          } catch (e) {
            result = '🔴 离线';
          }
          resultDiv.textContent = result;
        }
      }
    } catch (e) {
      resultDiv.textContent = '⚠️ 本地API不可用，是否使用第三方API？';
      const confirmed = confirm('本地API暂时不可用，是否尝试第三方服务？');
      if (confirmed) {
        resultDiv.textContent = '⏳ 第三方检测中…';
        let result = await thirdPartyFetch(host, port);
        if ((result === '🔴 离线' || result.includes('⚠️')) && portStr === '') {
          const srv = await resolveSRV(host);
          if (srv && (srv.target !== host || srv.port !== port)) {
            resultDiv.textContent = '⏳ 第三方 SRV 解析…';
            result = await thirdPartyFetch(srv.target, srv.port);
          }
        }
        resultDiv.textContent = result;
      } else {
        resultDiv.textContent = '❌ 检测取消';
        stopCooldown();
      }
    }
  }

  checkBtn.addEventListener('click', handleCheck);
  hostInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleCheck(); });
  portInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleCheck(); });
})();