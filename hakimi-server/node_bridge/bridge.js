const express = require('express');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const path = require('path');
const app = express();
app.use(express.json());
app.use(cors());
const STATIC_DIR = 'C:\\wwwroot\\www.wuyulbw.top_14514';
app.use(express.static(STATIC_DIR));
const sessions = new Map();
let currentSessionId = null;
const HAKIMI_EXE = 'C:\\Users\\admin\\Desktop\\houduan2\\cpp\\hakimi_engine.exe';
function createProcess() {
    const proc = spawn(HAKIMI_EXE, [], {
        env: { ...process.env, HAKIMI_API_MODE: '1' },
        cwd: path.dirname(HAKIMI_EXE)
    });
    let buffer = '';
    proc.stdout.on('data', (data) => {
        buffer += data.toString();
        let idx;
        while ((idx = buffer.indexOf('__END__')) !== -1) {
            const output = buffer.substring(0, idx).trim();
            buffer = buffer.substring(idx + 7);
            const lines = output.split('\n').filter(l => l.trim() !== '');
            const session = sessions.get(currentSessionId);
            if (session && session.pendingResolve) {
                session.pendingResolve(lines);
                session.pendingResolve = null;
            }
        }
    });
    proc.stderr.on('data', (data) => console.error(`stderr: ${data}`));
    proc.on('exit', () => {
        for (let [sid, sess] of sessions.entries()) {
            if (sess.process === proc) sessions.delete(sid);
        }
    });
    return proc;
}
app.post('/api/hakimi', (req, res) => {
    let { sessionId, input, lang } = req.body;
    if (!sessionId) sessionId = uuidv4();
    currentSessionId = sessionId;
    let session = sessions.get(sessionId);
    if (!session) {
        const proc = createProcess();
        session = { process: proc, busy: false, pendingResolve: null };
        sessions.set(sessionId, session);
    }
    if (session.busy) {
        return res.status(429).json({ error: 'Session busy, please retry' });
    }
    session.busy = true;
    session.process.stdin.write(input + '\n');
    const timeout = setTimeout(() => {
        if (session.pendingResolve) {
            session.pendingResolve = null;
            session.busy = false;
            res.status(504).json({ error: 'Timeout' });
        }
    }, 15000);
    session.pendingResolve = (lines) => {
        clearTimeout(timeout);
        session.busy = false;
        res.json({ sessionId, replies: lines });
    };
});
const PORT = 3000;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`Hakimi service running on http:
    console.log(`Static files from: ${STATIC_DIR}`);
});
