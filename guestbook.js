const STORAGE_KEY = 'guestbook_messages';
const msgInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const msgList = document.getElementById('messageList');

function loadMessages() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveMessages(msgs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
}

function render() {
  const messages = loadMessages();
  msgList.innerHTML = '';
  messages.forEach((msg, index) => {
    const li = document.createElement('li');
    li.className = 'message-item';
    li.innerHTML = `<span>${escapeHtml(msg.text)}</span><button class="delete-btn" data-index="${index}">✖</button>`;
    msgList.appendChild(li);
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.index);
      const msgs = loadMessages();
      msgs.splice(idx, 1);
      saveMessages(msgs);
      render();
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

sendBtn.addEventListener('click', () => {
  const text = msgInput.value.trim();
  if (!text) return;
  const messages = loadMessages();
  messages.push({ text, date: Date.now() });
  saveMessages(messages);
  msgInput.value = '';
  render();
});

render();