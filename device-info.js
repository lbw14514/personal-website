(function () {
  const container = document.getElementById('device-info');
  if (!container) return;

  window.userIpInfo = window.userIpInfo || {};
  let geoPermDenied = false;

  function hideIp(ip) {
    if (!ip) return '';
    const p = ip.split('.');
    if (p.length === 4) { p[1] = '***'; p[2] = '***'; return p.join('.'); }
    return ip;
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  function render() {
    const ua = navigator.userAgent;
    const screenInfo = `${screen.width}×${screen.height} @ ${window.devicePixelRatio}x`;

    let os = '未知';
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Mac/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua) && !/Android/i.test(ua)) os = 'Linux';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';

    let browser = '未知';
    if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';

    const isMobile = /Mobi|Android/i.test(ua);
    const deviceType = isMobile ? '手机' : '电脑';

    const http = window.userIpInfo.httpIp;
    const webrtc = window.userIpInfo.webrtcIp;
    const score = window.userIpInfo.vpnScore || 0;
    const geoDist = window.userIpInfo.geoDistanceKm;
    const geoPos = window.userIpInfo.geoPositionStr;

    let suspicion = false;
    if (http && webrtc && http !== webrtc) suspicion = true;
    else if (score >= 3) suspicion = true;
    if (!suspicion && geoDist !== null && geoDist !== undefined) {
      if (geoDist > 500) suspicion = true;
    }

    let ipLine = `🌐 IP：${hideIp(http) || '获取失败'}`;
    if (suspicion) {
      const maskedWebrtc = hideIp(webrtc || '');
      ipLine += `（你似乎在使用VPN 真实IP：${maskedWebrtc}）`;
    }
    ipLine += `<br>📍 归属：${window.userIpInfo.locationText || '获取失败'}`;

    if (geoPos) {
      ipLine += `<br>📌 精确定位：${geoPos}`;
      if (geoDist !== null) ipLine += ` | 距IP归属约 ${geoDist} km`;
    } else if (geoPermDenied) {
      ipLine += `<br>📌 精确定位：未授权`;
    } else if (window.userIpInfo.geoLoading) {
      ipLine += `<br>📌 精确定位：获取中…`;
    } else {
      ipLine += `<br>📌 <a href="javascript:void(0)" id="get-geo-link" style="color:#be185d; text-decoration:none;">基于IP大致位置，点击获取精确定位</a>`;
    }

    container.innerHTML = `
      🖥️ ${deviceType} | ${os} | ${browser}<br>
      📐 分辨率：${screenInfo}<br>
      ${ipLine}
    `;

    const geoLink = document.getElementById('get-geo-link');
    if (geoLink) {
      geoLink.addEventListener('click', requestGeolocation);
    }
  }

  function requestGeolocation() {
    if (!navigator.geolocation) {
      alert('你的浏览器不支持地理定位');
      return;
    }
    window.userIpInfo.geoLoading = true;
    render();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        window.userIpInfo.geoPositionStr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        window.userIpInfo.geoLoading = false;
        const ipLat = window.userIpInfo.ipLat;
        const ipLon = window.userIpInfo.ipLon;
        if (ipLat !== undefined && ipLon !== undefined) {
          window.userIpInfo.geoDistanceKm = calculateDistance(latitude, longitude, ipLat, ipLon);
        }
        geoPermDenied = false;
        render();
      },
      (err) => {
        window.userIpInfo.geoLoading = false;
        if (err.code === 1) geoPermDenied = true;
        render();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  async function fetchAll() {
    container.innerHTML = '⏳ 获取信息中…';
    try {
      const res = await fetch('/api/ip-info');
      if (res.ok) {
        const data = await res.json();
        window.userIpInfo.httpIp = data.ip || '';
        const loc = data.location || {};
        const city = loc.city || '';
        const region = loc.region || '';
        const country = loc.country || '';
        window.userIpInfo.locationText = [city, region, country].filter(Boolean).join(', ') || '未知';
        if (loc.latitude !== undefined && loc.longitude !== undefined) {
          window.userIpInfo.ipLat = parseFloat(loc.latitude);
          window.userIpInfo.ipLon = parseFloat(loc.longitude);
        }
      } else {
        window.userIpInfo.httpIp = '';
        window.userIpInfo.locationText = '获取失败';
      }
    } catch (e) {
      window.userIpInfo.httpIp = '';
      window.userIpInfo.locationText = '获取失败';
    }
    render();
  }

  window.addEventListener('webrtc-ready', render);
  window.addEventListener('vpn-score-ready', render);
  fetchAll();
})();