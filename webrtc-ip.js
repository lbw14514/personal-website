window.userIpInfo = window.userIpInfo || { webrtcIp: null, httpIp: null };

(function() {
  function isPrivate(ip) {
    const parts = ip.split('.').map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 127 && parts[1] === 0 && parts[2] === 0 && parts[3] === 1) return true;
    return false;
  }

  function getWebRTCIP() {
    return new Promise((resolve) => {
      const pc = new RTCPeerConnection({ iceServers: [] });
      const candidates = [];
      let timer = setTimeout(() => {
        pc.close();
        const publicIP = candidates.find(ip => !isPrivate(ip));
        resolve(publicIP || null);
      }, 2000);

      pc.createDataChannel('');
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        const candidate = e.candidate.candidate;
        const ipRegex = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
        const match = candidate.match(ipRegex);
        if (match) {
          const ip = match[0];
          if (!isPrivate(ip)) candidates.push(ip);
        }
      };
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          clearTimeout(timer);
          pc.close();
          const publicIP = candidates.find(ip => !isPrivate(ip));
          resolve(publicIP || null);
        }
      };
    });
  }

  getWebRTCIP().then(ip => {
    window.userIpInfo.webrtcIp = ip;
    window.dispatchEvent(new CustomEvent('webrtc-ready', { detail: ip }));
  });
})();