(function() {
    let sessionId = localStorage.getItem('hakimi_session_id');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random();
        localStorage.setItem('hakimi_session_id', sessionId);
    }
    let currentLang = localStorage.getItem('hakimi_lang') || '中文';

    const container = document.getElementById('hakimi-console');
    if (!container) return;

    container.innerHTML = `
        <div class="hakimi-lang-bar">
            <label>🌐 语言 / Language : </label>
            <select id="hakimi-lang-select">
                <option value="中文">中文</option>
                <option value="English">English</option>
            </select>
        </div>
        <div class="hakimi-chat-area" id="hakimi-chat-area"></div>
        <div class="hakimi-input-area">
            <input type="text" id="hakimi-input" placeholder="输入命令 / 回复..." autocomplete="off">
            <button id="hakimi-send">发送</button>
        </div>
    `;

    const chatArea = document.getElementById('hakimi-chat-area');
    const inputField = document.getElementById('hakimi-input');
    const sendBtn = document.getElementById('hakimi-send');
    const langSelect = document.getElementById('hakimi-lang-select');

    const menus = {
        '中文': {
            welcome: '欢迎使用 hakimi 控制台！请从下方菜单选择功能。',
            menu: '请选择功能：\n1  |  hakimi 加法小程序\n2  |  hakimi学你说话\n3  |  真—计算器\n4  |  退出'
        },
        'English': {
            welcome: 'Welcome to hakimi console! Choose an option from the menu below.',
            menu: 'Please select a function:\n1  |  hakimi addition program\n2  |  hakimi repeats what you say\n3  |  Real Calculator\n4  |  Exit'
        }
    };

    function addMessage(text, isUser) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'hakimi-message ' + (isUser ? 'user' : 'bot');
        const bubble = document.createElement('div');
        bubble.className = 'hakimi-bubble';
        bubble.innerHTML = text.replace(/\n/g, '<br>');
        msgDiv.appendChild(bubble);
        chatArea.appendChild(msgDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function clearChatArea() {
        chatArea.innerHTML = '';
    }

    function resetToMainMenu() {
        clearChatArea();
        const lang = currentLang;
        addMessage(menus[lang].welcome, false);
        addMessage(menus[lang].menu, false);
    }

    function isMenuLine(line) {
        return /^\d+\)\s/.test(line) || line.includes('请选择功能') || line.includes('Please select a function');
    }

    function containsMenuHeading(lines) {
        return lines.some(l => l.includes('请选择功能') || l.includes('Please select a function'));
    }

    function showCalculator() {
        clearChatArea();
        const calcDiv = document.createElement('div');
        calcDiv.className = 'hakimi-calculator';
        calcDiv.innerHTML = `
            <div class="calc-display">
                <input type="text" id="calc-input" placeholder="0">
            </div>
            <div class="calc-buttons">
                <div class="calc-row">
                    <button class="calc-btn" data-val="7">7</button>
                    <button class="calc-btn" data-val="8">8</button>
                    <button class="calc-btn" data-val="9">9</button>
                    <button class="calc-btn" data-op="/">/</button>
                    <button class="calc-btn" data-op="sqrt">√</button>
                </div>
                <div class="calc-row">
                    <button class="calc-btn" data-val="4">4</button>
                    <button class="calc-btn" data-val="5">5</button>
                    <button class="calc-btn" data-val="6">6</button>
                    <button class="calc-btn" data-op="*">*</button>
                    <button class="calc-btn" data-op="sin">sin</button>
                </div>
                <div class="calc-row">
                    <button class="calc-btn" data-val="1">1</button>
                    <button class="calc-btn" data-val="2">2</button>
                    <button class="calc-btn" data-val="3">3</button>
                    <button class="calc-btn" data-op="-">-</button>
                    <button class="calc-btn" data-op="cos">cos</button>
                </div>
                <div class="calc-row">
                    <button class="calc-btn" data-val="0">0</button>
                    <button class="calc-btn" data-val=".">.</button>
                    <button class="calc-btn" data-op="%">%</button>
                    <button class="calc-btn" data-op="+">+</button>
                    <button class="calc-btn" data-op="tan">tan</button>
                </div>
                <div class="calc-row">
                    <button class="calc-btn" data-op="(">(</button>
                    <button class="calc-btn" data-op=")">)</button>
                    <button class="calc-btn" data-op="^">^</button>
                    <button class="calc-btn" id="calc-backspace">⌫</button>
                    <button class="calc-btn" id="calc-clear">C</button>
                </div>
                <div class="calc-row">
                    <button class="calc-btn" id="calc-equal">=</button>
                    <button class="calc-btn" id="calc-back">返回主菜单</button>
                </div>
            </div>
        `;
        chatArea.appendChild(calcDiv);

        const calcInput = document.getElementById('calc-input');
        let currentExpr = '';

        function updateDisplay(value) {
            calcInput.value = value || '';
            currentExpr = value || '';
        }

        function appendToExpr(str) {
            currentExpr += str;
            updateDisplay(currentExpr);
        }

        function clearExpr() {
            currentExpr = '';
            updateDisplay('');
        }

        function backspace() {
            currentExpr = currentExpr.slice(0, -1);
            updateDisplay(currentExpr);
        }

        function autoCompleteParentheses(expr) {
            let openCount = 0;
            for (let ch of expr) {
                if (ch === '(') openCount++;
                else if (ch === ')') openCount--;
            }
            if (openCount > 0) {
                expr += ')'.repeat(openCount);
            }
            return expr;
        }

        function safeEvaluate(expr) {
            expr = expr.trim();
            if (expr === '') return '请输入表达式';
            expr = autoCompleteParentheses(expr);
            try {
                let processed = expr.replace(/\^/g, '**');
                const toRad = (deg) => deg * Math.PI / 180;
                const toDeg = (rad) => rad * 180 / Math.PI;
                const fnSin = (x) => Math.sin(toRad(x));
                const fnCos = (x) => Math.cos(toRad(x));
                const fnTan = (x) => Math.tan(toRad(x));
                const fnAsin = (x) => toDeg(Math.asin(x));
                const fnAcos = (x) => toDeg(Math.acos(x));
                const fnAtan = (x) => toDeg(Math.atan(x));
                const exprWithAngle = processed.replace(/sin\(/g, 'fnSin(')
                                               .replace(/cos\(/g, 'fnCos(')
                                               .replace(/tan\(/g, 'fnTan(')
                                               .replace(/asin\(/g, 'fnAsin(')
                                               .replace(/acos\(/g, 'fnAcos(')
                                               .replace(/atan\(/g, 'fnAtan(');
                const resultFunc = new Function('fnSin', 'fnCos', 'fnTan', 'fnAsin', 'fnAcos', 'fnAtan', 'Math', 'return (' + exprWithAngle + ')');
                const result = resultFunc(fnSin, fnCos, fnTan, fnAsin, fnAcos, fnAtan, Math);
                if (!isFinite(result)) {
                    return '错误：结果超出范围（无穷大）';
                }
                if (Math.abs(result) > 1e15) {
                    return '结果过大，已近似：' + result.toExponential(8);
                }
                if (Math.abs(result) < 1e-15 && result !== 0) {
                    return '结果过小，已近似：' + result.toExponential(8);
                }
                if (Number.isInteger(result)) return result.toString();
                return parseFloat(result.toFixed(10)).toString();
            } catch (e) {
                return '表达式错误：' + e.message;
            }
        }

        function calculate() {
            if (!currentExpr) return;
            const result = safeEvaluate(currentExpr);
            addMessage(`计算: ${currentExpr} = ${result}`, false);
            clearExpr();
        }

        calcInput.addEventListener('input', (e) => {
            currentExpr = e.target.value;
        });
        calcInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                calculate();
            }
        });
        calcInput.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                e.preventDefault();
                backspace();
            }
        });

        calcDiv.querySelectorAll('.calc-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = btn.dataset.val;
                const op = btn.dataset.op;
                if (val !== undefined) {
                    appendToExpr(val);
                } else if (op !== undefined) {
                    if (op === 'sqrt') {
                        appendToExpr('sqrt(');
                    } else if (op === 'sin') {
                        appendToExpr('sin(');
                    } else if (op === 'cos') {
                        appendToExpr('cos(');
                    } else if (op === 'tan') {
                        appendToExpr('tan(');
                    } else {
                        appendToExpr(op);
                    }
                } else if (btn.id === 'calc-equal') {
                    calculate();
                } else if (btn.id === 'calc-clear') {
                    clearExpr();
                } else if (btn.id === 'calc-backspace') {
                    backspace();
                } else if (btn.id === 'calc-back') {
                    resetToMainMenu();
                }
            });
        });
        updateDisplay('');
    }

    async function sendToBridge(input) {
        if (!input.trim()) return;
        const trimmed = input.trim();
        if (trimmed === '3') {
            showCalculator();
            inputField.value = '';
            return;
        }
        if (trimmed === '4') {
            resetToMainMenu();
            inputField.value = '';
            return;
        }
        addMessage(input, true);
        try {
            const res = await fetch('/api/hakimi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionId,
                    input: input,
                    lang: currentLang
                })
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            if (data.replies && data.replies.length) {
                const filtered = [];
                let hasMenuHeading = false;
                for (let reply of data.replies) {
                    if (isMenuLine(reply)) {
                        if (!hasMenuHeading && (reply.includes('请选择功能') || reply.includes('Please select a function'))) {
                            hasMenuHeading = true;
                        }
                        continue;
                    }
                    filtered.push(reply);
                }
                for (let reply of filtered) {
                    if (reply.trim()) addMessage(reply, false);
                }
                if (hasMenuHeading) {
                    addMessage(menus[currentLang].menu, false);
                }
            }
            if (data.sessionId) {
                sessionId = data.sessionId;
                localStorage.setItem('hakimi_session_id', sessionId);
            }
        } catch (err) {
            addMessage('❌ 无法连接到 hakimi 服务，请确保 Node 桥接已启动', false);
        }
        inputField.value = '';
    }

    sendBtn.addEventListener('click', function() {
        const val = inputField.value;
        if (val.trim()) sendToBridge(val);
    });
    inputField.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = inputField.value;
            if (val.trim()) sendToBridge(val);
        }
    });
    langSelect.addEventListener('change', function(e) {
        currentLang = e.target.value;
        localStorage.setItem('hakimi_lang', currentLang);
        resetToMainMenu();
    });

    resetToMainMenu();
})();