// index.js — 逐字累加显示“祝你生日快乐！”，结束后切换为蛋糕 + 蜡烛（蜡烛仅在蛋糕出现后才显示）

var S = {
    isCake: false,
    init: function () {
        S.Drawing.init('.canvas');
        document.body.classList.add('body--ready');
        // 启动生日序列（逐字累加），参数：短句、每字间隔、完整后停留时间
        S.UI.startBirthdaySequence('祝你生日快乐！', 1400, 1200); // <-- 这里的 1400ms 是每字间隔（已延长）
        S.Drawing.loop(function () {
            S.Shape.render();
            // 只有进入蛋糕模式时才绘制蜡烛（否则不出现）
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
        function (cb) { window.setTimeout(cb, 1000 / 60); };

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
            canvas.width = Math.max(300, window.innerWidth - 100);
            canvas.height = Math.max(200, window.innerHeight - 30);
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
        // ========== 蛋糕与蜡烛（与此前效果一致） ==========
        drawCakeAndCandles: function (bounds) {
            if (!bounds || !bounds.width) return;
            var now = Date.now();
            var ctx = context;

            var cakeLeft = bounds.cx;
            var cakeTop = bounds.cy;
            var cakeW = bounds.width;
            var cakeH = bounds.height;

            var tiers = 3;
            var tierHeight = Math.max(20, cakeH / (tiers * 1.6));

            // 蛋糕层体 + 糖霜装饰
            for (var t = 0; t < tiers; t++) {
                var wFactor = 1 - (t * 0.15);
                var w = cakeW * wFactor;
                var h = tierHeight;
                var x = cakeLeft + (cakeW - w) / 2;
                var y = cakeTop + cakeH - (t + 1) * h - (t * 6);

                // 身体
                ctx.fillStyle = 'rgba(200,120,120,0.95)';
                ctx.fillRect(x, y, w, h);

                // 糖霜波浪
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

                // 层装饰小点（美观）
                for (var d = 0; d < 8; d++) {
                    var dx = x + (d + 0.5) * (w / 8);
                    var dy = y + h / 2;
                    ctx.beginPath();
                    ctx.arc(dx, dy, 4, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(' + (100 + d * 15) + ',' + (50 + d * 10) + ',' + (180 - d * 8) + ',0.95)';
                    ctx.fill();
                }
            }

            // 蜡烛与火焰闪光
            var topY = cakeTop + cakeH - tiers * tierHeight - (tiers - 1) * 6;
            var candleCount = Math.max(3, Math.min(7, Math.round(cakeW / 110)));
            var spacing = cakeW / (candleCount + 1);
            for (var i = 1; i <= candleCount; i++) {
                var cx = cakeLeft + spacing * i;
                var candleHeight = Math.max(40, tierHeight * 1.1);
                var cw = 8;
                var cxLeft = cx - cw / 2;
                var cyTop = topY - candleHeight - 6;

                // 烛身阴影
                ctx.fillStyle = 'rgba(0,0,0,0.12)';
                ctx.fillRect(cxLeft + 1, cyTop + candleHeight - 2, cw, 2);

                // 烛身
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(cxLeft, cyTop, cw, candleHeight);

                // 细条纹
                ctx.fillStyle = 'rgba(255,120,120,0.9)';
                ctx.fillRect(cxLeft + 1, cyTop + 4, cw - 2, 3);
                ctx.fillStyle = 'rgba(120,180,255,0.9)';
                ctx.fillRect(cxLeft + 1, cyTop + 12, cw - 2, 3);

                // 灰烬环
                ctx.fillStyle = 'rgba(0,0,0,0.18)';
                ctx.fillRect(cxLeft - 1, cyTop - 2, cw + 2, 2);

                // 火焰（带闪烁）
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

                // 小闪光（星形）
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

// ========== UI / 控制逻辑 ==========
S.UI = (function () {
    var perCharDelay = 1400; // 每个累加步间隔（ms）——已延长
    var holdDelay = 1200;   // 全句显示后停留时间 (ms)

    // 提供外部接口调整速度
    function setSpeeds(charDelay, fullHold) {
        if (typeof charDelay === 'number') perCharDelay = charDelay;
        if (typeof fullHold === 'number') holdDelay = fullHold;
    }

    // 逐字累加显示的入口：phrase 字符串，perCharDelay 毫秒，holdDelay 毫秒
    function startBirthdaySequence(phrase, charDelay, fullHold) {
        if (typeof charDelay === 'number') perCharDelay = charDelay;
        if (typeof fullHold === 'number') holdDelay = fullHold;

        // 构建累加数组： ['祝','祝你','祝你生', ...]
        var parts = [];
        for (var i = 1; i <= phrase.length; i++) {
            parts.push(phrase.slice(0, i));
        }

        // 遍历显示每一步（递归 setTimeout）
        var idx = 0;
        S.isCake = false; // 确保文字阶段没有蛋糕/蜡烛

        function step() {
            if (idx < parts.length) {
                // 目前显示的是累加到 parts[idx]
                S.isCake = false;
                S.Shape.switchShape(S.ShapeBuilder.letter(parts[idx]));
                idx++;
                setTimeout(step, perCharDelay);
            } else {
                // 全句显示完，停留 holdDelay 后切换为蛋糕
                setTimeout(function () {
                    // 切换为蛋糕点阵并启用蜡烛显示
                    S.Shape.switchShape(S.ShapeBuilder.cake());
                    S.isCake = true;
                }, holdDelay);
            }
        }

        // 启动
        step();
    }

    return {
        startBirthdaySequence: startBirthdaySequence,
        setSpeeds: setSpeeds
    };
})();

// ========== 点 / 形状 / 构建器（保留原逻辑，支持文字与蛋糕点阵） ==========
S.Point = function (args) {
    this.x = args.x;
    this.y = args.y;
    this.z = args.z || 5;
    this.a = args.a || 1;
    this.h = args.h || 0;
};
S.Color = function (r, g, b, a) {
    this.r = r; this.g = g; this.b = b; this.a = a;
};
S.Color.prototype.render = function () {
    return 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.a + ')';
};
S.Dot = function (x, y, color) {
    this.p = new S.Point({ x: x, y: y, z: 5, a: 1, h: 0 });
    this.e = 0.07;
    this.s = true;
    this.c = color ? new S.Color(color.r, color.g, color.b, this.p.a) : new S.Color(255, 255, 255, this.p.a);
    this.t = this.clone();
    this.q = [];
};
S.Dot.prototype = {
    clone: function () {
        return new S.Point({ x: this.p.x, y: this.p.y, z: this.p.z, a: this.p.a, h: this.p.h });
    },
    _draw: function () {
        this.c.a = this.p.a;
        S.Drawing.drawCircle(this.p, this.c);
    },
    _moveTowards: function (n) {
        var details = this.distanceTo(n, true), dx = details[0], dy = details[1], d = details[2], e = this.e * d;
        if (this.p.h === -1) { this.p.x = n.x; this.p.y = n.y; return true; }
        if (d > 1) { this.p.x -= ((dx / d) * e); this.p.y -= ((dy / d) * e); }
        else {
            if (this.p.h > 0) { this.p.h--; } else { return true; }
        }
        return false;
    },
    _update: function () {
        if (this._moveTowards(this.t)) {
            var p = this.q.shift();
            if (p) {
                this.t.x = p.x || this.p.x; this.t.y = p.y || this.p.y; this.t.z = p.z || this.p.z;
                this.t.a = p.a || this.p.a; this.p.h = p.h || 0;
            } else {
                if (this.s) {
                    this.p.x -= Math.sin(Math.random() * 3.142); this.p.y -= Math.sin(Math.random() * 3.142);
                } else {
                    this.move(new S.Point({ x: this.p.x + (Math.random() * 50) - 25, y: this.p.y + (Math.random() * 50) - 25 }));
                }
            }
        }
        var d = this.p.a - this.t.a; this.p.a = Math.max(0.1, this.p.a - (d * 0.05));
        d = this.p.z - this.t.z; this.p.z = Math.max(1, this.p.z - (d * 0.05));
    },
    distanceTo: function (n, details) {
        var dx = this.p.x - n.x, dy = this.p.y - n.y, d = Math.sqrt(dx * dx + dy * dy);
        return details ? [dx, dy, d] : d;
    },
    move: function (p, avoidStatic) {
        if (!avoidStatic || (avoidStatic && this.distanceTo(p) > 1)) this.q.push(p);
    },
    render: function () { this._update(); this._draw(); }
};

S.ShapeBuilder = (function () {
    var gap = 13;
    var shapeCanvas = document.createElement('canvas');
    var shapeContext = shapeCanvas.getContext('2d');
    var fontSize = 500;
    var fontFamily = 'Microsoft YaHei, "PingFang SC", "Noto Sans CJK SC", Avenir, Helvetica, Arial, sans-serif';

    function fit() {
        shapeCanvas.width = Math.floor(window.innerWidth / gap) * gap;
        shapeCanvas.height = Math.floor(window.innerHeight / gap) * gap;
        shapeContext.fillStyle = 'red';
        shapeContext.textBaseline = 'middle';
        shapeContext.textAlign = 'center';
    }
    window.addEventListener('resize', fit);
    fit();

    function processCanvas() {
        var pixels = shapeContext.getImageData(0, 0, shapeCanvas.width, shapeCanvas.height).data;
        var dots = [], x = 0, y = 0, fx = shapeCanvas.width, fy = shapeCanvas.height, w = 0, h = 0;
        for (var p = 0; p < pixels.length; p += (4 * gap)) {
            if (pixels[p + 3] > 0) {
                dots.push(new S.Point({ x: x, y: y }));
                w = x > w ? x : w; h = y > h ? y : h;
                fx = x < fx ? x : fx; fy = y < fy ? y : fy;
            }
            x += gap;
            if (x >= shapeCanvas.width) {
                x = 0; y += gap; p += gap * 4 * shapeCanvas.width;
            }
        }
        return { dots: dots, w: w + fx, h: h + fy };
    }

    function setFontSize(s) { shapeContext.font = 'bold ' + s + 'px ' + fontFamily; }
    function isNumber(n) { return !isNaN(parseFloat(n)) && isFinite(n); }

    return {
        letter: function (l) {
            var s = 0;
            setFontSize(fontSize);
            s = Math.min(fontSize,
                (shapeCanvas.width / shapeContext.measureText(l).width) * 0.8 * fontSize,
                (shapeCanvas.height / fontSize) * (isNumber(l) ? 1 : 0.45) * fontSize);
            setFontSize(s);
            shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
            shapeContext.fillText(l, shapeCanvas.width / 2, shapeCanvas.height / 2);
            return processCanvas();
        },
        rectangle: function (w, h) {
            var dots = [], width = gap * w, height = gap * h;
            for (var y = 0; y < height; y += gap) for (var x = 0; x < width; x += gap) dots.push(new S.Point({ x: x, y: y }));
            return { dots: dots, w: width, h: height };
        },
        circle: function (d) {
            var r = Math.max(0, d) / 2;
            shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
            shapeContext.beginPath();
            shapeContext.arc(r * gap, r * gap, r * gap, 0, 2 * Math.PI, false);
            shapeContext.fill();
            shapeContext.closePath();
            return processCanvas();
        },
        cake: function (tiers) {
            tiers = tiers || 3;
            var dots = [];
            var area = S.Drawing.getArea();
            var cakeW = Math.floor((Math.min(area.w, area.h * 0.6) * 0.6) / gap) * gap;
            var baseW = Math.max(20 * gap, cakeW);
            var baseH = Math.floor(10 * gap);
            var startX = Math.floor((area.w - baseW) / 2 / gap) * gap;
            var startY = Math.floor((area.h * 0.48) / gap) * gap;
            for (var t = 0; t < tiers; t++) {
                var wFactor = 1 - (t * 0.14);
                var w = Math.floor(baseW * wFactor / gap) * gap;
                var h = Math.floor((8 * gap) / gap) * gap;
                var x0 = startX + Math.floor((baseW - w) / 2 / gap) * gap;
                var y0 = startY + (tiers - t - 1) * (h + 6);
                for (var y = y0; y < y0 + h; y += gap) for (var x = x0; x < x0 + w; x += gap) dots.push(new S.Point({ x: x, y: y }));
            }
            return { dots: dots, w: baseW, h: baseH + (tiers - 1) * (8 * gap + 6) };
        }
    };
})();

S.Shape = (function () {
    var dots = [], width = 0, height = 0, cx = 0, cy = 0;
    function compensate() {
        var a = S.Drawing.getArea();
        cx = a.w / 2 - width / 2;
        cy = a.h / 2 - height / 2;
    }
    return {
        switchShape: function (n, fast) {
            var a = S.Drawing.getArea();
            width = n.w; height = n.h; compensate();
            if (n.dots.length > dots.length) {
                var size = n.dots.length - dots.length;
                for (var d = 1; d <= size; d++) dots.push(new S.Dot(a.w / 2, a.h / 2));
            }
            var d = 0;
            while (n.dots.length > 0) {
                var i = Math.floor(Math.random() * n.dots.length);
                dots[d].e = fast ? 0.25 : (dots[d].s ? 0.14 : 0.11);
                if (dots[d].s) {
                    dots[d].move(new S.Point({ z: Math.random() * 20 + 10, a: Math.random(), h: 18 }));
                } else {
                    dots[d].move(new S.Point({ z: Math.random() * 5 + 5, h: fast ? 18 : 30 }));
                }
                dots[d].s = true;
                dots[d].move(new S.Point({
                    x: n.dots[i].x + cx,
                    y: n.dots[i].y + cy,
                    a: 1, z: 5, h: 0
                }));
                n.dots = n.dots.slice(0, i).concat(n.dots.slice(i + 1));
                d++;
            }
            for (var i = d; i < dots.length; i++) {
                if (dots[i].s) {
                    dots[i].move(new S.Point({ z: Math.random() * 20 + 10, a: Math.random(), h: 20 }));
                    dots[i].s = false;
                    dots[i].e = 0.04;
                    dots[i].move(new S.Point({ x: Math.random() * a.w, y: Math.random() * a.h, a: 0.3, z: Math.random() * 4, h: 0 }));
                }
            }
        },
        render: function () {
            for (var d = 0; d < dots.length; d++) dots[d].render();
        },
        getBounds: function () {
            return { cx: cx, cy: cy, width: width, height: height };
        }
    };
})();

// 启动
S.init();
