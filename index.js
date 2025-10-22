var S = {
    isCake: false, // 是否处于蛋糕模式
    init: function () {
        S.Drawing.init('.canvas');
        document.body.classList.add('body--ready');
        // 依次显示祝福文字，最后显示蛋糕
        S.UI.simulate("祝|你|生|日|快|乐|！|#cake");
        S.Drawing.loop(function () {
            S.Shape.render();
            // 仅当进入蛋糕模式后才绘制蜡烛与闪光
            if (S.isCake) {
                S.Drawing.drawCakeAndCandles(S.Shape.getBounds());
            }
        });
    }
};

S.Drawing = (function () {
    var canvas, context, renderFn;
    var requestFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) { window.setTimeout(callback, 1000 / 60); };

    return {
        init: function (el) {
            canvas = document.querySelector(el);
            context = canvas.getContext('2d');
            this.adjustCanvas();
            window.addEventListener('resize', this.adjustCanvas.bind(this));
        },
        loop: function (fn) {
            renderFn = fn;
            this.clearFrame();
            renderFn();
            requestFrame(this.loop.bind(this, fn));
        },
        adjustCanvas: function () {
            canvas.width = window.innerWidth - 100;
            canvas.height = window.innerHeight - 30;
        },
        clearFrame: function () {
            context.clearRect(0, 0, canvas.width, canvas.height);
        },
        getArea: function () {
            return { w: canvas.width, h: canvas.height };
        },
        drawCircle: function (p, c) {
            context.fillStyle = c.render();
            context.beginPath();
            context.arc(p.x, p.y, p.z, 0, 2 * Math.PI, true);
            context.closePath();
            context.fill();
        },
        // 绘制蛋糕与蜡烛闪光（仅在 isCake=true 时调用）
        drawCakeAndCandles: function (bounds) {
            if (!bounds || !bounds.width) return;
            var ctx = context;
            var now = Date.now();
            var cakeLeft = bounds.cx, cakeTop = bounds.cy;
            var cakeW = bounds.width, cakeH = bounds.height;

            // 绘制蛋糕层
            var tiers = 3, tierHeight = Math.max(20, cakeH / (tiers * 1.6));
            for (var t = 0; t < tiers; t++) {
                var w = cakeW * (1 - t * 0.15);
                var h = tierHeight;
                var x = cakeLeft + (cakeW - w) / 2;
                var y = cakeTop + cakeH - (t + 1) * h - (t * 6);

                ctx.fillStyle = 'rgba(200,120,120,0.95)';
                ctx.fillRect(x, y, w, h);

                ctx.fillStyle = 'rgba(255,245,220,0.95)';
                ctx.beginPath();
                ctx.moveTo(x, y);
                var steps = Math.max(4, Math.floor(w / 12));
                for (var s = 0; s <= steps; s++) {
                    var sx = x + (s / steps) * w;
                    var sy = y - (4 + Math.sin((s + now / 200) * 0.5) * 4);
                    ctx.quadraticCurveTo(sx, sy, sx + w / steps, y);
                }
                ctx.fill();
            }

            // 绘制蜡烛
            var topY = cakeTop + cakeH - tiers * tierHeight - (tiers - 1) * 6;
            var candleCount = Math.max(3, Math.min(7, Math.round(cakeW / 110)));
            var spacing = cakeW / (candleCount + 1);
            for (var i = 1; i <= candleCount; i++) {
                var cx = cakeLeft + spacing * i;
                var ch = Math.max(40, tierHeight * 1.1);
                var cw = 8;
                var cxLeft = cx - cw / 2;
                var cyTop = topY - ch - 6;

                ctx.fillStyle = '#fff';
                ctx.fillRect(cxLeft, cyTop, cw, ch);

                ctx.fillStyle = 'rgba(255,120,120,0.9)';
                ctx.fillRect(cxLeft + 1, cyTop + 4, cw - 2, 3);
                ctx.fillStyle = 'rgba(120,180,255,0.9)';
                ctx.fillRect(cxLeft + 1, cyTop + 12, cw - 2, 3);

                // 火焰闪光
                var flameX = cx;
                var flameY = cyTop - 6;
                var flicker = 0.6 + Math.abs(Math.sin((now + i * 250) / 180)) * 0.6;

                var grad = ctx.createRadialGradient(flameX, flameY, 1, flameX, flameY, 18);
                grad.addColorStop(0, 'rgba(255,255,200,' + (0.95 * flicker) + ')');
                grad.addColorStop(0.4, 'rgba(255,180,60,' + (0.85 * flicker) + ')');
                grad.addColorStop(1, 'rgba(255,80,0,' + (0.35 * flicker) + ')');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.ellipse(flameX, flameY, 6 * flicker, 10 * flicker, 0, 0, Math.PI * 2);
                ctx.fill();

                // 小闪光星形
                var starAlpha = 0.4 + 0.6 * Math.abs(Math.sin((now + i * 410) / 160));
                ctx.save();
                ctx.translate(flameX, flameY - 6);
                ctx.rotate(((now + i * 130) % 360) * Math.PI / 1800);
                ctx.globalAlpha = starAlpha;
                ctx.strokeStyle = 'rgba(255,255,255,0.95)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(0, -8 * flicker);
                ctx.lineTo(0, 8 * flicker);
                ctx.moveTo(-6 * flicker, 0);
                ctx.lineTo(6 * flicker, 0);
                ctx.stroke();
                ctx.restore();
            }
        }
    };
})();

S.UI = (function () {
    var interval, currentAction, time;
    var cmd = '#', baseDelay = 900;
    var sequence = [];

    function formatTime(date) {
        var h = date.getHours(), m = date.getMinutes();
        m = m < 10 ? '0' + m : m;
        return h + ':' + m;
    }

    function getValue(value) { return value && value.split(' ')[1]; }
    function getAction(value) { value = value && value.split(' ')[0]; return value && value[0] === cmd && value.substring(1); }

    function timedAction(fn, delay, max, reverse) {
        clearInterval(interval);
        currentAction = reverse ? max : 1;
        fn(currentAction);
        if (!max || (!reverse && currentAction < max) || (reverse && currentAction > 0)) {
            interval = setInterval(function () {
                currentAction = reverse ? currentAction - 1 : currentAction + 1;
                fn(currentAction);
                if ((!reverse && max && currentAction === max) || (reverse && currentAction === 0)) {
                    clearInterval(interval);
                }
            }, delay);
        }
    }

    function performAction(value) {
        var action, current;
        sequence = typeof value === 'object' ? value : sequence.concat(value.split('|'));
        timedAction(function (index) {
            current = sequence.shift();
            action = getAction(current);
            switch (action) {
                case 'cake':
                    // 延迟执行蛋糕显示与蜡烛动画
                    setTimeout(function () {
                        S.Shape.switchShape(S.ShapeBuilder.cake());
                        S.isCake = true;
                    }, baseDelay);
                    break;
                default:
                    S.Shape.switchShape(S.ShapeBuilder.letter(current));
            }
        }, baseDelay, sequence.length);
    }

    return {
        simulate: function (action) { performAction(action); },
        setSpeed: function (ms) { baseDelay = ms; }
    };
})();
