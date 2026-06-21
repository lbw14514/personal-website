(function() {
    const container = document.getElementById('function-graph-container');
    if (!container) return;

    container.innerHTML = `
        <canvas id="function-canvas" width="600" height="400" style="width:100%; height:auto; max-width:800px; background:#f9f9f9; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1); margin-bottom:16px;"></canvas>
        <div class="graph-controls">
            <div class="graph-input-group">
                <label>f(x) = </label>
                <input type="text" id="func-expr-f" placeholder="例如: x^2, sin(x), 2*x+1" value="x^2">
            </div>
            <div class="graph-input-group">
                <label>y = </label>
                <input type="text" id="func-expr-y" placeholder="例如: x^2, sin(x), 2*x+1" value="x^2">
            </div>
            <div class="graph-status">
                <span>提示: 鼠标拖拽平移 | 滚轮缩放 | 支持 sin/cos/tan/ln/log/sqrt/^ | 自变量为 x (y 会自动转为 x)</span>
            </div>
            <div>
                <button id="graph-draw-btn">绘制</button>
                <button id="graph-example-btn">示例</button>
            </div>
        </div>
    `;

    const canvas = document.getElementById('function-canvas');
    const ctx = canvas.getContext('2d');
    let width = 600, height = 400;
    canvas.width = width;
    canvas.height = height;

    let xMin = -5, xMax = 5, yMin = -5, yMax = 5;
    let isDragging = false;
    let dragStartX = 0, dragStartY = 0;
    let lastXMin = xMin, lastXMax = xMax, lastYMin = yMin, lastYMax = yMax;

    const fInput = document.getElementById('func-expr-f');
    const yInput = document.getElementById('func-expr-y');

    function syncInputs(source, target) {
        if (source.value !== target.value) {
            target.value = source.value;
        }
    }

    fInput.addEventListener('input', () => syncInputs(fInput, yInput));
    yInput.addEventListener('input', () => syncInputs(yInput, fInput));

    function toCanvasX(x) { return ((x - xMin) / (xMax - xMin)) * width; }
    function toCanvasY(y) { return height - ((y - yMin) / (yMax - yMin)) * height; }
    function toMathX(cx) { return xMin + (cx / width) * (xMax - xMin); }
    function toMathY(cy) { return yMin + ((height - cy) / height) * (yMax - yMin); }

    function drawGridAndAxis() {
        ctx.save();
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.font = '12px Arial';
        ctx.fillStyle = '#333';
        
        for (let x = Math.ceil(xMin); x <= xMax; x += 1) {
            const cx = toCanvasX(x);
            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, height);
            ctx.stroke();
            if (cx > 15 && cx < width - 15) {
                ctx.fillText(x.toString(), cx - 4, toCanvasY(0) - 5);
            }
        }
        for (let y = Math.ceil(yMin); y <= yMax; y += 1) {
            const cy = toCanvasY(y);
            ctx.beginPath();
            ctx.moveTo(0, cy);
            ctx.lineTo(width, cy);
            ctx.stroke();
            if (cy > 15 && cy < height - 10) {
                ctx.fillText(y.toString(), toCanvasX(0) + 5, cy + 4);
            }
        }
        ctx.beginPath();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        const x0 = toCanvasX(0);
        if (x0 >= 0 && x0 <= width) {
            ctx.moveTo(x0, 0);
            ctx.lineTo(x0, height);
            ctx.stroke();
        }
        const y0 = toCanvasY(0);
        if (y0 >= 0 && y0 <= height) {
            ctx.moveTo(0, y0);
            ctx.lineTo(width, y0);
            ctx.stroke();
        }
        ctx.restore();
    }

    function fuzzyFixExpression(expr) {
        let fixed = expr.trim();
        fixed = fixed.replace(/[（(]/g, '(').replace(/[）)]/g, ')');
        fixed = fixed.replace(/\s+/g, '');
        fixed = fixed.replace(/(\d)([a-zA-Z])/g, '$1*$2');
        fixed = fixed.replace(/([a-zA-Z])(\d)/g, '$1*$2');
        fixed = fixed.replace(/(\))(\d)/g, '$1*$2');
        fixed = fixed.replace(/(\d)(\()/g, '$1*$(');
        fixed = fixed.replace(/y/g, 'x');
        fixed = fixed.replace(/sin/g, 'Math.sin');
        fixed = fixed.replace(/cos/g, 'Math.cos');
        fixed = fixed.replace(/tan/g, 'Math.tan');
        fixed = fixed.replace(/ln/g, 'Math.log');
        fixed = fixed.replace(/log/g, 'Math.log10');
        fixed = fixed.replace(/sqrt/g, 'Math.sqrt');
        fixed = fixed.replace(/\^/g, '**');
        return fixed;
    }

    function evaluateExpression(expr, x) {
        try {
            let processed = fuzzyFixExpression(expr);
            const fn = new Function('x', 'return (' + processed + ')');
            const result = fn(x);
            if (isNaN(result) || !isFinite(result)) return NaN;
            return result;
        } catch(e) {
            return NaN;
        }
    }

    function drawFunction(expr) {
        ctx.clearRect(0, 0, width, height);
        drawGridAndAxis();

        const step = (xMax - xMin) / width;
        ctx.beginPath();
        ctx.strokeStyle = '#be185d';
        ctx.lineWidth = 2;
        let first = true;
        let anyPointDrawn = false;
        for (let px = 0; px <= width; px++) {
            const x = xMin + px * step;
            const y = evaluateExpression(expr, x);
            if (isNaN(y)) {
                first = true;
                continue;
            }
            const cx = toCanvasX(x);
            const cy = toCanvasY(y);
            if (cy < -50 || cy > height + 50) {
                first = true;
                continue;
            }
            if (first) {
                ctx.moveTo(cx, cy);
                first = false;
                anyPointDrawn = true;
            } else {
                ctx.lineTo(cx, cy);
            }
        }
        if (anyPointDrawn) {
            ctx.stroke();
        } else {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#be185d';
            ctx.fillText('无有效点（函数可能超出范围或表达式错误）', width/2 - 150, height/2);
        }
    }

    function showMessage(msg) {
        ctx.clearRect(0, 0, width, height);
        drawGridAndAxis();
        ctx.font = '14px Arial';
        ctx.fillStyle = '#be185d';
        ctx.fillText(msg, width/2 - 120, height/2);
    }

    function redraw() {
        const expr = fInput.value.trim();
        if (expr === '') {
            showMessage('请输入函数表达式');
            return;
        }
        try {
            drawFunction(expr);
        } catch(e) {
            showMessage('表达式错误: ' + e.message);
        }
    }

    function setExample(example) {
        fInput.value = example;
        yInput.value = example;
        redraw();
    }

    function onMouseDown(e) {
        isDragging = true;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        dragStartX = (e.clientX - rect.left) * scaleX;
        dragStartY = (e.clientY - rect.top) * scaleY;
        lastXMin = xMin;
        lastXMax = xMax;
        lastYMin = yMin;
        lastYMax = yMax;
        canvas.style.cursor = 'grabbing';
    }

    function onMouseMove(e) {
        if (!isDragging) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const currentX = (e.clientX - rect.left) * scaleX;
        const currentY = (e.clientY - rect.top) * scaleY;
        const dx = currentX - dragStartX;
        const dy = currentY - dragStartY;
        const deltaX = (dx / width) * (xMax - xMin);
        const deltaY = (dy / height) * (yMax - yMin);
        xMin = lastXMin - deltaX;
        xMax = lastXMax - deltaX;
        yMin = lastYMin + deltaY;
        yMax = lastYMax + deltaY;
        redraw();
    }

    function onMouseUp() {
        isDragging = false;
        canvas.style.cursor = 'grab';
        lastXMin = xMin;
        lastXMax = xMax;
        lastYMin = yMin;
        lastYMax = yMax;
    }

    function onWheel(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scaleXCanvas = canvas.width / rect.width;
        const scaleYCanvas = canvas.height / rect.height;
        const mouseXCanvas = (e.clientX - rect.left) * scaleXCanvas;
        const mouseYCanvas = (e.clientY - rect.top) * scaleYCanvas;
        const zoom = e.deltaY < 0 ? 0.9 : 1.1;
        const newWidth = (xMax - xMin) * zoom;
        const newHeight = (yMax - yMin) * zoom;
        const cx = toMathX(mouseXCanvas);
        const cy = toMathY(mouseYCanvas);
        xMin = cx - newWidth * (mouseXCanvas / width);
        xMax = xMin + newWidth;
        yMin = cy - newHeight * (1 - mouseYCanvas / height);
        yMax = yMin + newHeight;
        lastXMin = xMin;
        lastXMax = xMax;
        lastYMin = yMin;
        lastYMax = yMax;
        redraw();
    }

    function initEvents() {
        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.style.cursor = 'grab';
        const drawBtn = document.getElementById('graph-draw-btn');
        if (drawBtn) drawBtn.addEventListener('click', () => redraw());
        const exampleBtn = document.getElementById('graph-example-btn');
        if (exampleBtn) {
            exampleBtn.addEventListener('click', () => {
                const examples = ['x^2', 'sin(x)', '2*x+1', 'x^3-3*x', 'sqrt(x)', 'log(x)'];
                const randomExample = examples[Math.floor(Math.random() * examples.length)];
                setExample(randomExample);
            });
        }
        const exprInputs = [fInput, yInput];
        exprInputs.forEach(inp => {
            if (inp) {
                inp.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') redraw();
                });
            }
        });
    }

    redraw();
    initEvents();
})();