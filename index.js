var S = {
    init: function () {
        S.Drawing.init('.canvas');
        document.body.classList.add('body--ready');
        // 先依次显示祝福文字（快速），最后显示蛋糕点阵
        S.UI.simulate("祝|你|生|日|快|乐|！|#cake");
        S.Drawing.loop(function () {
            S.Shape.render();
            // 在点阵渲染后绘制蜡烛和闪光（覆盖层）
            S.Drawing.drawCakeAndCandles(S.Shape.getBounds());
        });
    }
};
S.Drawing = (function () {
    var canvas,
        context,
        renderFn,
        requestFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 2000 / 60);
        };
    return {
        init: function (el) {
            canvas = document.querySelector(el);
            context = canvas.getContext('2d');
            this.adjustCanvas();
            window.addEventListener('resize', function (e) {
                S.Drawing.adjustCanvas();
            });
        },
        loop: function (fn) {
            renderFn = !renderFn ? fn : renderFn;
            this.clearFrame();
            renderFn();
            requestFrame.call(window, this.loop.bind(this));
        },
        adjustCanvas: function () {
            canvas.width = window.innerWidth - 100;
            canvas.height = window.innerHeight - 30;
        },
        clearFrame: function () {
            context.clearRect(0, 0, canvas.width, canvas.height);
        },
        getArea: function () {
            return {w: canvas.width, h: canvas.height};
        },
        drawCircle: function (p, c) {
            context.fillStyle = c.render();
            context.beginPath();
            context.arc(p.x, p.y, p.z, 0, 2 * Math.PI, true);
            context.closePath();
            context.fill();
        },
        // 在点阵上绘制蜡烛与闪光（覆盖层）
        drawCakeAndCandles: function (bounds) {
            if (!bounds || !bounds.width) return;
            var now = Date.now();
            var ctx = context;
            // 基于蛋糕边界计算蛋糕顶部 y 坐标
            var cakeLeft = bounds.cx;
            var cakeTop = bounds.cy;
            var cakeW = bounds.width;
            var cakeH = bounds.height;
            // 参数：层数、每层高度
            var tiers = 3;
            var tierHeight = Math.max(20, cakeH / (tiers * 1.6));
            // 绘制蛋糕（覆盖在点阵之下但在点阵之上，用半透明色更协调）
            for (var t = 0; t < tiers; t++) {
                var wFactor = 1 - (t * 0.15); // 上层宽度递减
                var w = cakeW * wFactor;
                var h = tierHeight;
                var x = cakeLeft + (cakeW - w) / 2;
                var y = cakeTop + cakeH - (t + 1) * h - (t * 6);
                // 身体
                ctx.fillStyle = 'rgba(200,120,120,0.95)'; // 蛋糕主色（偏粉）
                ctx.fillRect(x, y, w, h);
                // 糖霜（顶部装饰）
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
                // 小圆点装饰
                for (var d = 0; d < 8; d++) {
                    var dx = x + (d + 0.5) * (w / 8);
                    var dy = y + h / 2;
                    ctx.beginPath();
                    ctx.arc(dx, dy, 4, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(' + (100 + d * 15) + ',' + (50 + d * 10) + ',' + (180 - d * 8) + ',0.95)';
                    ctx.fill();
                }
            }
            // 在最上层画蜡烛
            var topY = cakeTop + cakeH - tiers * tierHeight - (tiers - 1) * 6;
            var candleCount = Math.max(3, Math.min(7, Math.round(cakeW / 110))); // 根据宽度决定蜡烛数
            var spacing = cakeW / (candleCount + 1);
            for (var i = 1; i <= candleCount; i++) {
                var cx = cakeLeft + spacing * i;
                var candleHeight = Math.max(40, tierHeight * 1.1);
                // 蜡烛身体
                var cw = 8;
                var ch = candleHeight;
                var cxLeft = cx - cw / 2;
                var cyTop = topY - ch - 6;
                // 烛身底部投影（深色）
                ctx.fillStyle = 'rgba(0,0,0,0.12)';
                ctx.fillRect(cxLeft + 1, cyTop + ch - 2, cw, 2);
                // 蜡烛身
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(cxLeft, cyTop, cw, ch);
                // 细条纹（彩色）
                ctx.fillStyle = 'rgba(255,120,120,0.9)';
                ctx.fillRect(cxLeft + 1, cyTop + 4, cw - 2, 3);
                ctx.fillStyle = 'rgba(120,180,255,0.9)';
                ctx.fillRect(cxLeft + 1, cyTop + 12, cw - 2, 3);
                // 灰烬环
                ctx.fillStyle = 'rgba(0,0,0,0.18)';
                ctx.fillRect(cxLeft - 1, cyTop - 2, cw + 2, 2);

                // 火焰（闪光）——使用径向渐变并随时间闪烁
                var flameX = cx;
                var flameY = cyTop - 6;
                // 颜色与闪烁幅度随时间变化
                var flicker = 0.6 + Math.abs(Math.sin((now + i * 250) / 180)) * 0.6;
                // 主火焰
                var grad = ctx.createRadialGradient(flameX, flameY, 1, flameX, flameY, 18);
                grad.addColorStop(0, 'rgba(255,255,200,' + (0.95 * flicker) + ')');
                grad.addColorStop(0.4, 'rgba(255,180,60,' + (0.85 * flicker) + ')');
                grad.addColorStop(1, 'rgba(255,80,0,' + (0.35 * flicker) + ')');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.ellipse(flameX, flameY, 6 * flicker, 10 * flicker, 0, 0, Math.PI * 2);
                ctx.fill();

                // 小闪光（星形），随时间脉动
                var starAlpha = 0.4 + 0.6 * Math.abs(Math.sin((now + i * 410) / 160));
                ctx.save();
                ctx.translate(flameX, flameY - 6);
                ctx.rotate(((now + i * 130) % 360) * Math.PI / 1800);
                ctx.globalAlpha = starAlpha;
                ctx.strokeStyle = 'rgba(255,255,255,0.95)';
                ctx.lineWidth = 1.2;
                // draw tiny 4-point sparkle
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
}());
S.UI = (function () {
    var interval,
        currentAction,
        time,
        maxShapeSize = 30,
        sequence = [],
        cmd = '#',
        baseDelay = 900; // 每个序列项显示的间隔(ms)，中文字符显示会更顺畅
    function formatTime(date) {
        var h = date.getHours(),
            m = date.getMinutes(),
            m = m < 10 ? '0' + m : m;
        return h + ':' + m;
    }
    function getValue(value) {
        return value && value.split(' ')[1];
    }
    function getAction(value) {
        value = value && value.split(' ')[0];
        return value && value[0] === cmd && value.substring(1);
    }
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
        var action,
            value,
            current;
        sequence = typeof (value) === 'object' ? value : sequence.concat(value.split('|'));
        timedAction(function (index) {
            current = sequence.shift();
            action = getAction(current);
            value = getValue(current);
            switch (action) {
                case 'countdown':
                    value = parseInt(value) || 10;
                    value = value > 0 ? value : 10;
                    timedAction(function (index) {
                        if (index === 0) {
                            if (sequence.length === 0) {
                                S.Shape.switchShape(S.ShapeBuilder.letter(''));
                            } else {
                                performAction(sequence);
                            }
                        } else {
                            S.Shape.switchShape(S.ShapeBuilder.letter(index), true);
                        }
                    }, 1000, value, true);
                    break;
                case 'rectangle':
                    value = value && value.split('x');
                    value = (value && value.length === 2) ? value : [maxShapeSize, maxShapeSize / 2];
                    S.Shape.switchShape(S.ShapeBuilder.rectangle(Math.min(maxShapeSize, parseInt(value[0])), Math.min(maxShapeSize, parseInt(value[1]))));
                    break;
                case 'circle':
                    value = parseInt(value) || maxShapeSize;
                    value = Math.min(value, maxShapeSize);
                    S.Shape.switchShape(S.ShapeBuilder.circle(value));
                    break;
                case 'time':
                    var t = formatTime(new Date());
                    if (sequence.length > 0) {
                        S.Shape.switchShape(S.ShapeBuilder.letter(t));
                    } else {
                        timedAction(function () {
                            t = formatTime(new Date());
                            if (t !== time) {
                                time = t;
                                S.Shape.switchShape(S.ShapeBuilder.letter(time));
                            }
                        }, 1000);
                    }
                    break;
                case 'cake':
                    // 可带参数：'#cake 3' 表示层数（暂时未使用），直接生成蛋糕点阵
                    S.Shape.switchShape(S.ShapeBuilder.cake());
                    break;
                default:
                    // 默认把 current 字符作为 Shape 显示（支持中文）
                    S.Shape.switchShape(S.ShapeBuilder.letter(current[0] === cmd ? 'HacPai' : current));
            }
        }, baseDelay, sequence.length);
    }
    return {
        simulate: function (action) {
            performAction(action);
        },
        // 提供可外部调整速度的接口（可选）
        setSpeed: function(ms){
            baseDelay = ms;
        }
    };
}());
S.Point = function (args) {
    this.x = args.x;
    this.y = args.y;
    this.z = args.z || 5;
    this.a = args.a || 1;
    this.h = args.h || 0;
};
S.Color = function (r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
};
S.Color.prototype = {
    render: function () {
        return 'rgba(' + this.r + ',' + +this.g + ',' + this.b + ',' + this.a + ')';
    }
};
S.Dot = function (x, y, color) {
    this.p = new S.Point({
        x: x,
        y: y,
        z: 5,
        a: 1,
        h: 0
    });
    this.e = 0.07;
    this.s = true;
    // 允许传入颜色
    this.c = color ? new S.Color(color.r, color.g, color.b, this.p.a) : new S.Color(255, 255, 255, this.p.a);
    this.t = this.clone();
    this.q = [];
};
S.Dot.prototype = {
    clone: function () {
        return new S.Point({
            x: this.p.x,
            y: this.p.y,
            z: this.p.z,
            a: this.p.a,
            h: this.p.h
        });
    },
    _draw: function () {
        // 动态把 alpha 同步到颜色
        this.c.a = this.p.a;
        S.Drawing.drawCircle(this.p, this.c);
    },
    _moveTowards: function (n) {
        var details = this.distanceTo(n, true),
            dx = details[0],
            dy = details[1],
            d = details[2],
            e = this.e * d;
        if (this.p.h === -1) {
            this.p.x = n.x;
            this.p.y = n.y;
            return true;
        }
        if (d > 1) {
            this.p.x -= ((dx / d) * e);
            this.p.y -= ((dy / d) * e);
        } else {
            if (this.p.h > 0) {
                this.p.h--;
            } else {
                return true;
            }
        }
        return false;
    },
    _update: function () {
        if (this._moveTowards(this.t)) {
            var p = this.q.shift();
            if (p) {
                this.t.x = p.x || this.p.x;
                this.t.y = p.y || this.p.y;
                this.t.z = p.z || this.p.z;
                this.t.a = p.a || this.p.a;
                this.p.h = p.h || 0;
            } else {
                if (this.s) {
                    this.p.x -= Math.sin(Math.random() * 3.142);
                    this.p.y -= Math.sin(Math.random() * 3.142);
                } else {
                    this.move(new S.Point({
                        x: this.p.x + (Math.random() * 50) - 25,
                        y: this.p.y + (Math.random() * 50) - 25
                    }));
                }
            }
        }
        var d = this.p.a - this.t.a;
        this.p.a = Math.max(0.1, this.p.a - (d * 0.05));
        d = this.p.z - this.t.z;
        this.p.z = Math.max(1, this.p.z - (d * 0.05));
    },
    distanceTo: function (n, details) {
        var dx = this.p.x - n.x,
            dy = this.p.y - n.y,
            d = Math.sqrt(dx * dx + dy * dy);
        return details ? [dx, dy, d] : d;
    },
    move: function (p, avoidStatic) {
        if (!avoidStatic || (avoidStatic && this.distanceTo(p) > 1)) {
            this.q.push(p);
        }
    },
    render: function () {
        this._update();
        this._draw();
    }
};
S.ShapeBuilder = (function () {
    var gap = 13,
        shapeCanvas = document.createElement('canvas'),
        shapeContext = shapeCanvas.getContext('2d'),
        fontSize = 500,
        // 加入中文字体以提高中文显示效果
        fontFamily = 'Microsoft YaHei, "PingFang SC", "Noto Sans CJK SC", Avenir, Helvetica Neue, Helvetica, Arial, sans-serif';
    function fit() {
        shapeCanvas.width = Math.floor(window.innerWidth / gap) * gap;
        shapeCanvas.height = Math.floor(window.innerHeight / gap) * gap;
        shapeContext.fillStyle = 'red';
        shapeContext.textBaseline = 'middle';
        shapeContext.textAlign = 'center';
    }
    function processCanvas() {
        var pixels = shapeContext.getImageData(0, 0, shapeCanvas.width, shapeCanvas.height).data;
        dots = [],
            pixels,
            x = 0,
            y = 0,
            fx = shapeCanvas.width,
            fy = shapeCanvas.height,
            w = 0,
            h = 0;
        for (var p = 0; p < pixels.length; p += (4 * gap)) {
            if (pixels[p + 3] > 0) {
                dots.push(new S.Point({
                    x: x,
                    y: y
                }));
                w = x > w ? x : w;
                h = y > h ? y : h;
                fx = x < fx ? x : fx;
                fy = y < fy ? y : fy;
            }
            x += gap;
            if (x >= shapeCanvas.width) {
                x = 0;
                y += gap;
                p += gap * 4 * shapeCanvas.width;
            }
        }
        return {dots: dots, w: w + fx, h: h + fy};
    }
    function setFontSize(s) {
        shapeContext.font = 'bold ' + s + 'px ' + fontFamily;
    }
    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    function init() {
        fit();
        window.addEventListener('resize', fit);
    }
    // Init
    init();
    return {
        imageFile: function (url, callback) {
            var image = new Image(),
                a = S.Drawing.getArea();
            image.onload = function () {
                shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
                shapeContext.drawImage(this, 0, 0, a.h * 0.6, a.h * 0.6);
                callback(processCanvas());
            };
            image.onerror = function () {
                callback(S.ShapeBuilder.letter('What?'));
            };
            image.src = url;
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
            var dots = [],
                width = gap * w,
                height = gap * h;
            for (var y = 0; y < height; y += gap) {
                for (var x = 0; x < width; x += gap) {
                    dots.push(new S.Point({
                        x: x,
                        y: y
                    }));
                }
            }
            return {dots: dots, w: width, h: height};
        },
        // 生成蛋糕点阵（分层矩形）供 Shape 使用
        cake: function (tiers) {
            tiers = tiers || 3;
            var dots = [];
            // 蛋糕宽度根据视口确定，使用 gap 单位来生成点阵
            var area = S.Drawing.getArea();
            var cakeW = Math.floor((Math.min(area.w, area.h * 0.6) * 0.6) / gap) * gap; // 保持在画布中间偏下
            var baseW = Math.max(20 * gap, cakeW);
            var baseH = Math.floor(10 * gap); // 基底高度
            var startX = Math.floor((area.w - baseW) / 2 / gap) * gap;
            var startY = Math.floor((area.h * 0.48) / gap) * gap;
            // 为每层生成点，越上层宽度越窄
            for (var t = 0; t < tiers; t++) {
                var wFactor = 1 - (t * 0.14);
                var w = Math.floor(baseW * wFactor / gap) * gap;
                var h = Math.floor((8 * gap) / gap) * gap; // 每层高度以 gap 为单位
                var x0 = startX + Math.floor((baseW - w) / 2 / gap) * gap;
                var y0 = startY + (tiers - t - 1) * (h + 6);
                for (var y = y0; y < y0 + h; y += gap) {
                    for (var x = x0; x < x0 + w; x += gap) {
                        dots.push(new S.Point({
                            x: x,
                            y: y
                        }));
                    }
                }
            }
            // 返回值的 w/h 需要是宽度/高度（像素），和点阵数组
            return {dots: dots, w: baseW, h: baseH + (tiers - 1) * (8 * gap + 6)};
        }
    };
}());
S.Shape = (function () {
    var dots = [],
        width = 0,
        height = 0,
        cx = 0,
        cy = 0;
    function compensate() {
        var a = S.Drawing.getArea();
        cx = a.w / 2 - width / 2;
        cy = a.h / 2 - height / 2;
    }
    return {
        shuffleIdle: function () {
            var a = S.Drawing.getArea();
            for (var d = 0; d < dots.length; d++) {
                if (!dots[d].s) {
                    dots[d].move({
                        x: Math.random() * a.w,
                        y: Math.random() * a.h
                    });
                }
            }
        },
        switchShape: function (n, fast) {
            var size,
                a = S.Drawing.getArea();
            width = n.w;
            height = n.h;
            compensate();
            if (n.dots.length > dots.length) {
                size = n.dots.length - dots.length;
                for (var d = 1; d <= size; d++) {
                    dots.push(new S.Dot(a.w / 2, a.h / 2));
                }
            }
            var d = 0,
                i = 0;
            while (n.dots.length > 0) {
                i = Math.floor(Math.random() * n.dots.length);
                dots[d].e = fast ? 0.25 : (dots[d].s ? 0.14 : 0.11);
                if (dots[d].s) {
                    dots[d].move(new S.Point({
                        z: Math.random() * 20 + 10,
                        a: Math.random(),
                        h: 18
                    }));
                } else {
                    dots[d].move(new S.Point({
                        z: Math.random() * 5 + 5,
                        h: fast ? 18 : 30
                    }));
                }
                dots[d].s = true;
                dots[d].move(new S.Point({
                    x: n.dots[i].x + cx,
                    y: n.dots[i].y + cy,
                    a: 1,
                    z: 5,
                    h: 0
                }));
                n.dots = n.dots.slice(0, i).concat(n.dots.slice(i + 1));
                d++;
            }
            for (var i = d; i < dots.length; i++) {
                if (dots[i].s) {
                    dots[i].move(new S.Point({
                        z: Math.random() * 20 + 10,
                        a: Math.random(),
                        h: 20
                    }));
                    dots[i].s = false;
                    dots[i].e = 0.04;
                    dots[i].move(new S.Point({
                        x: Math.random() * a.w,
                        y: Math.random() * a.h,
                        a: 0.3,
                        z: Math.random() * 4,
                        h: 0
                    }));
                }
            }
        },
        render: function () {
            for (var d = 0; d < dots.length; d++) {
                dots[d].render();
            }
        },
        // 允许外部查询当前形状边界（用于定位蜡烛）
        getBounds: function () {
            return {cx: cx, cy: cy, width: width, height: height};
        }
    };
}());
S.init();
