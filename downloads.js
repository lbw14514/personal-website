(function () {
  const container = document.getElementById('downloads-container');
  if (!container) return;

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  }

  function formatSpeed(bytesPerSecond) {
    if (bytesPerSecond < 1024) return bytesPerSecond.toFixed(1) + ' B/s';
    if (bytesPerSecond < 1048576) return (bytesPerSecond / 1024).toFixed(1) + ' KB/s';
    return (bytesPerSecond / 1048576).toFixed(1) + ' MB/s';
  }

  function hasCryptoSupport() {
    return window.crypto && window.crypto.subtle && window.crypto.subtle.digest;
  }

  async function sha256(buffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function load() {
    container.innerHTML = '⏳ 加载文件列表…';
    try {
      const res = await fetch('/api/downloads');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const files = await res.json();
      if (files.length === 0) {
        container.innerHTML = '暂无文件';
        return;
      }
      let html = '<table style="width:100%; border-collapse:collapse;">';
      html += '<tr style="border-bottom:1px solid rgba(0,0,0,0.15);"><th align="left">文件名</th><th>大小</th><th>日期</th><th>操作</th></tr>';
      files.forEach(f => {
        const cellId = 'cell-' + f.name.replace(/[^a-zA-Z0-9]/g, '');
        html += `<tr style="border-bottom:1px solid rgba(0,0,0,0.08);">
          <td>${f.name}</td>
          <td style="text-align:center;">${formatBytes(f.size)}</td>
          <td style="text-align:center;">${f.date}</td>
          <td style="text-align:center;" id="${cellId}">
            <a href="javascript:void(0)" onclick="startDownload(event, '${encodeURIComponent(f.name)}', '${cellId}')" style="color:#be185d; text-decoration:none; font-weight:600;">下载</a>
          </td>
        </tr>`;
      });
      html += '</table>';
      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = '⚠️ 加载失败：' + e.message;
    }
  }

  window.startDownload = function(evt, filename, cellId) {
    const cell = document.getElementById(cellId);
    if (!cell) return;
    const originalHTML = cell.innerHTML;
    const DOWNLOAD_TIMEOUT = 10 * 60 * 1000;

    cell.innerHTML = `
      <div style="position:relative; width:100%; height:20px; background:rgba(0,0,0,0.1); border-radius:10px; overflow:hidden;">
        <div class="progress-fill" style="width:0%; height:100%; background:#be185d; border-radius:10px; transition: width 0.5s linear;"></div>
        <div class="progress-text" style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:12px; color:#fff; text-shadow:0 1px 2px rgba(0,0,0,0.5);">0%</div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:3px;">
        <div class="speed-text" style="font-size:11px; color:var(--text-secondary);">--</div>
        <a href="javascript:void(0)" class="cancel-btn" style="font-size:11px; color:#ef4444; text-decoration:none;">取消</a>
      </div>
    `;

    const progressFill = cell.querySelector('.progress-fill');
    const progressText = cell.querySelector('.progress-text');
    const speedText = cell.querySelector('.speed-text');
    const cancelBtn = cell.querySelector('.cancel-btn');

    let fakeProgress = 0;
    let fakeTimer = null;
    let realPercent = 0;
    let hasRealProgress = false;

    function updateDisplay(percent) {
      const displayPercent = Math.min(99, Math.round(percent));
      progressFill.style.width = displayPercent + '%';
      progressText.textContent = displayPercent + '%';
    }

    function startFakeProgress() {
      if (fakeTimer) clearInterval(fakeTimer);
      fakeProgress = 0;
      updateDisplay(0);
      speedText.textContent = '--';
      fakeTimer = setInterval(() => {
        if (hasRealProgress) {
          clearInterval(fakeTimer);
          fakeTimer = null;
          return;
        }
        fakeProgress += 1;
        if (fakeProgress > 90) fakeProgress = 90;
        updateDisplay(fakeProgress);
      }, 10000);
    }

    function stopFakeProgress() {
      if (fakeTimer) {
        clearInterval(fakeTimer);
        fakeTimer = null;
      }
    }

    let lastLoaded = 0;
    let lastTime = performance.now();
    let xhr = new XMLHttpRequest();
    let aborted = false;

    cancelBtn.onclick = function(e) {
      e.preventDefault();
      if (xhr && !aborted) {
        aborted = true;
        xhr.abort();
        stopFakeProgress();
        cell.innerHTML = originalHTML;
      }
    };

    xhr.open('GET', '/api/download/' + filename, true);
    xhr.responseType = 'arraybuffer';
    xhr.timeout = DOWNLOAD_TIMEOUT;

    xhr.onprogress = function(e) {
      if (aborted) return;
      const loaded = e.loaded;
      const total = e.total;

      if (e.lengthComputable && total > 0) {
        realPercent = (loaded / total) * 100;
        hasRealProgress = true;
        stopFakeProgress();
        updateDisplay(Math.max(fakeProgress, realPercent));
      } else {
        if (!hasRealProgress) {
          hasRealProgress = true;
          stopFakeProgress();
        }
      }

      const now = performance.now();
      const elapsed = (now - lastTime) / 1000;
      if (elapsed > 0.3) {
        const speed = (loaded - lastLoaded) / elapsed;
        speedText.textContent = formatSpeed(speed);
        lastTime = now;
        lastLoaded = loaded;
      }

      if (e.lengthComputable && loaded >= total) {
        speedText.textContent = '下载完成，校验中…';
      }
    };

    xhr.onload = async function() {
      if (aborted) return;
      stopFakeProgress();
      if (xhr.status !== 200) {
        cell.innerHTML = originalHTML;
        if (xhr.status === 404) alert('文件不存在，可能已被移除。');
        else alert('下载失败 HTTP ' + xhr.status);
        return;
      }
      const buffer = xhr.response;
      const serverSha = xhr.getResponseHeader('X-File-Sha256');

      if (serverSha && hasCryptoSupport()) {
        try {
          const hash = await sha256(buffer);
          if (hash !== serverSha) {
            alert('⚠️ 文件可能已损坏，请重新下载或联系管理员。');
            cell.innerHTML = originalHTML;
            return;
          }
        } catch (e) {
        }
      }

      const blob = new Blob([buffer]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = decodeURIComponent(filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      cell.innerHTML = originalHTML;
    };

    xhr.ontimeout = function() {
      if (aborted) return;
      stopFakeProgress();
      cell.innerHTML = originalHTML;
      alert('⚠️ 下载超时，请稍后重试');
    };

    xhr.onerror = function() {
      if (aborted) return;
      stopFakeProgress();
      cell.innerHTML = originalHTML;
      alert('下载出错：网络错误');
    };

    startFakeProgress();
    xhr.send();
  };

  load();
})();