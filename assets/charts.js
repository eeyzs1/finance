/* ============================================================
   FChart · 轻量 SVG 图表库（课程共享组件）
   无外部依赖，适用于 file:// 本地打开的课程页面。

   快速上手：
     var c = new FChart(document.getElementById("chart1"), {
       height: 340,
       x: { min: 0, max: 10, label: "年" },
       y: { min: 0, max: 100, label: "元", fmt: v => v }
     });
     c.line(x => x * x, { color: "#0d5c4f", width: 2.5 });
     c.scatter([[2, 4], [6, 36]], { color: "#a3701a" });
     c.legend([{ color: "#0d5c4f", text: "本金曲线" }]);
   交互更新：在滑块回调里 c.clear(); 重画曲线即可。
   ============================================================ */

(function (global) {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) node.setAttribute(k, attrs[k]);
    }
    return node;
  }

  function niceTicks(min, max, count) {
    count = count || 5;
    if (max === min) { max = min + 1; }
    var span = max - min;
    var step0 = span / count;
    var mag = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10));
    var norm = step0 / mag;
    var step;
    if (norm <= 1) step = 1;
    else if (norm <= 2) step = 2;
    else if (norm <= 2.5) step = 2.5;
    else if (norm <= 5) step = 5;
    else step = 10;
    step *= mag;
    var ticks = [];
    var start = Math.ceil(min / step) * step;
    for (var v = start; v <= max + step * 1e-9; v += step) {
      ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    }
    return ticks;
  }

  function FChart(container, opts) {
    opts = opts || {};
    this.w = opts.width || 680;
    this.h = opts.height || 340;
    var m = opts.margin || {};
    this.m = {
      t: m.t != null ? m.t : 34,
      r: m.r != null ? m.r : 22,
      b: m.b != null ? m.b : 46,
      l: m.l != null ? m.l : 60
    };
    this.xo = opts.x || {};
    this.yo = opts.y || {};
    this.xfmt = this.xo.fmt || function (v) { return FChart.trimNum(v); };
    this.yfmt = this.yo.fmt || function (v) { return FChart.trimNum(v); };

    container.innerHTML = "";
    this.svg = el("svg", {
      viewBox: "0 0 " + this.w + " " + this.h,
      role: "img",
      "aria-label": opts.title || "图表"
    });
    container.appendChild(this.svg);

    if (opts.title) {
      var t = el("text", {
        x: this.m.l, y: 20,
        "font-family": "Segoe UI, system-ui, sans-serif",
        "font-size": 13.5, "font-weight": 700, fill: "#5d5749"
      });
      t.textContent = opts.title;
      this.svg.appendChild(t);
    }

    this.base = el("g", {});
    this.layer = el("g", {});
    this.svg.appendChild(this.base);
    this.svg.appendChild(this.layer);

    this.setScale(this.xo.min || 0, this.xo.max || 1, this.yo.min || 0, this.yo.max || 1);
  }

  FChart.prototype.setScale = function (xmin, xmax, ymin, ymax) {
    this.xmin = xmin; this.xmax = xmax; this.ymin = ymin; this.ymax = ymax;
    if (xmax === xmin) this.xmax = xmax + 1;
    if (ymax === ymin) this.ymax = ymax + 1;
    while (this.base.firstChild) this.base.removeChild(this.base.firstChild);
    var m = this.m, w = this.w - m.l - m.r, h = this.h - m.t - m.b;
    this.pw = w; this.ph = h;

    // 网格与刻度
    var xticks = this.xo.ticks || niceTicks(this.xmin, this.xmax);
    var yticks = this.yo.ticks || niceTicks(this.ymin, this.ymax);
    var self = this;

    yticks.forEach(function (v) {
      var y = self.ty(v);
      self.base.appendChild(el("line", {
        x1: m.l, x2: m.l + w, y1: y, y2: y,
        stroke: "#e5dfcf", "stroke-width": 1
      }));
      var lab = el("text", {
        x: m.l - 8, y: y + 4.5,
        "text-anchor": "end",
        "font-family": "Segoe UI, system-ui, sans-serif",
        "font-size": 11.5, fill: "#5d5749"
      });
      lab.textContent = self.yfmt(v);
      self.base.appendChild(lab);
    });
    xticks.forEach(function (v) {
      var x = self.tx(v);
      self.base.appendChild(el("line", {
        x1: x, x2: x, y1: m.t, y2: m.t + h,
        stroke: "#e5dfcf", "stroke-width": 1
      }));
      var lab = el("text", {
        x: x, y: m.t + h + 18,
        "text-anchor": "middle",
        "font-family": "Segoe UI, system-ui, sans-serif",
        "font-size": 11.5, fill: "#5d5749"
      });
      lab.textContent = self.xfmt(v);
      self.base.appendChild(lab);
    });

    // 坐标轴
    this.base.appendChild(el("line", {
      x1: m.l, x2: m.l, y1: m.t, y2: m.t + h, stroke: "#a9a290", "stroke-width": 1.5
    }));
    this.base.appendChild(el("line", {
      x1: m.l, x2: m.l + w, y1: m.t + h, y2: m.t + h, stroke: "#a9a290", "stroke-width": 1.5
    }));

    // 轴标签
    if (this.yo.label) {
      var yl = el("text", {
        x: 14, y: m.t + h / 2,
        "text-anchor": "middle",
        transform: "rotate(-90 14 " + (m.t + h / 2) + ")",
        "font-family": "Segoe UI, system-ui, sans-serif",
        "font-size": 12.5, fill: "#5d5749"
      });
      yl.textContent = this.yo.label;
      this.base.appendChild(yl);
    }
    if (this.xo.label) {
      var xl = el("text", {
        x: m.l + w / 2, y: this.h - 8,
        "text-anchor": "middle",
        "font-family": "Segoe UI, system-ui, sans-serif",
        "font-size": 12.5, fill: "#5d5749"
      });
      xl.textContent = this.xo.label;
      this.base.appendChild(xl);
    }
    this.clear();
  };

  FChart.prototype.tx = function (x) {
    return this.m.l + (x - this.xmin) / (this.xmax - this.xmin) * this.pw;
  };
  FChart.prototype.ty = function (y) {
    return this.m.t + this.ph - (y - this.ymin) / (this.ymax - this.ymin) * this.ph;
  };

  FChart.prototype.clear = function () {
    while (this.layer.firstChild) this.layer.removeChild(this.layer.firstChild);
    return this;
  };

  function toPts(fnOrPts, xmin, xmax) {
    if (typeof fnOrPts === "function") {
      var pts = [];
      var n = 160;
      for (var i = 0; i <= n; i++) {
        var x = xmin + (xmax - xmin) * i / n;
        var y = fnOrPts(x);
        if (y == null || isNaN(y)) continue;
        pts.push([x, y]);
      }
      return pts;
    }
    return fnOrPts.slice();
  }

  FChart.prototype.path = function (fnOrPts, style) {
    style = style || {};
    var pts = toPts(fnOrPts, this.xmin, this.xmax);
    if (!pts.length) return this;
    var self = this;
    var d = pts.map(function (p, i) {
      return (i === 0 ? "M" : "L") + self.tx(p[0]).toFixed(2) + " " + self.ty(p[1]).toFixed(2);
    }).join(" ");
    this.layer.appendChild(el("path", {
      d: d, fill: "none",
      stroke: style.color || "#0d5c4f",
      "stroke-width": style.width || 2.5,
      "stroke-dasharray": style.dash || "none",
      "stroke-linejoin": "round", "stroke-linecap": "round",
      opacity: style.opacity != null ? style.opacity : 1
    }));
    return this;
  };

  FChart.prototype.area = function (fnOrPts, style) {
    style = style || {};
    var pts = toPts(fnOrPts, this.xmin, this.xmax);
    if (!pts.length) return this;
    var self = this;
    var y0 = style.y0 != null ? style.y0 : this.ymin;
    var d = "M" + this.tx(pts[0][0]).toFixed(2) + " " + this.ty(y0).toFixed(2);
    pts.forEach(function (p) {
      d += "L" + self.tx(p[0]).toFixed(2) + " " + self.ty(p[1]).toFixed(2);
    });
    d += "L" + this.tx(pts[pts.length - 1][0]).toFixed(2) + " " + this.ty(y0).toFixed(2) + "Z";
    this.layer.appendChild(el("path", {
      d: d, fill: style.fill || "#0d5c4f",
      opacity: style.fillOpacity != null ? style.fillOpacity : 0.18,
      stroke: "none"
    }));
    if (style.stroke !== false) {
      this.path(fnOrPts, style);
    }
    return this;
  };

  FChart.prototype.bars = function (items, style) {
    style = style || {};
    var self = this;
    items.forEach(function (it) {
      var x1 = self.tx(it.x0), x2 = self.tx(it.x1);
      var yTop = self.ty(it.y), yBase = self.ty(style.y0 != null ? style.y0 : self.ymin);
      if (it.y < 0 && style.y0 != null) { yBase = self.ty(style.y0); }
      var rect = el("rect", {
        x: Math.min(x1, x2), y: Math.min(yTop, yBase),
        width: Math.max(Math.abs(x2 - x1), 1),
        height: Math.max(Math.abs(yBase - yTop), 1),
        fill: it.color || style.color || "#0d5c4f",
        opacity: it.opacity != null ? it.opacity : 0.85,
        rx: 2
      });
      self.layer.appendChild(rect);
      if (it.label) {
        var lab = el("text", {
          x: (x1 + x2) / 2, y: Math.min(yTop, yBase) - 6,
          "text-anchor": "middle",
          "font-family": "Segoe UI, system-ui, sans-serif",
          "font-size": 12, "font-weight": 600, fill: it.color || style.color || "#0d5c4f"
        });
        lab.textContent = it.label;
        self.layer.appendChild(lab);
      }
    });
    return this;
  };

  FChart.prototype.scatter = function (pts, style) {
    style = style || {};
    var self = this;
    pts.forEach(function (p) {
      self.layer.appendChild(el("circle", {
        cx: self.tx(p[0]), cy: self.ty(p[1]),
        r: style.r || 5,
        fill: p[2] || style.color || "#a3701a",
        opacity: style.opacity != null ? style.opacity : 0.9,
        stroke: "#fffdf8", "stroke-width": 1.5
      }));
      if (p[3]) {
        var lab = el("text", {
          x: self.tx(p[0]) + 9, y: self.ty(p[1]) + 4,
          "font-family": "Segoe UI, system-ui, sans-serif",
          "font-size": 11.5, fill: "#5d5749"
        });
        lab.textContent = p[3];
        self.layer.appendChild(lab);
      }
    });
    return this;
  };

  FChart.prototype.vline = function (x, style) {
    style = style || {};
    this.layer.appendChild(el("line", {
      x1: this.tx(x), x2: this.tx(x),
      y1: this.m.t, y2: this.m.t + this.ph,
      stroke: style.color || "#b3372f",
      "stroke-width": style.width || 1.5,
      "stroke-dasharray": style.dash || "6 5"
    }));
    if (style.label) {
      var lab = el("text", {
        x: this.tx(x) + 5, y: this.m.t + 14,
        "font-family": "Segoe UI, system-ui, sans-serif",
        "font-size": 12, fill: style.color || "#b3372f", "font-weight": 600
      });
      lab.textContent = style.label;
      this.layer.appendChild(lab);
    }
    return this;
  };

  FChart.prototype.hline = function (y, style) {
    style = style || {};
    this.layer.appendChild(el("line", {
      x1: this.m.l, x2: this.m.l + this.pw,
      y1: this.ty(y), y2: this.ty(y),
      stroke: style.color || "#b3372f",
      "stroke-width": style.width || 1.5,
      "stroke-dasharray": style.dash || "6 5"
    }));
    if (style.label) {
      var lab = el("text", {
        x: this.m.l + this.pw - 4, y: this.ty(y) - 6,
        "text-anchor": "end",
        "font-family": "Segoe UI, system-ui, sans-serif",
        "font-size": 12, fill: style.color || "#b3372f", "font-weight": 600
      });
      lab.textContent = style.label;
      this.layer.appendChild(lab);
    }
    return this;
  };

  FChart.prototype.text = function (x, y, str, style) {
    style = style || {};
    var lab = el("text", {
      x: this.tx(x) + (style.dx || 0), y: this.ty(y) + (style.dy || 0),
      "text-anchor": style.anchor || "start",
      "font-family": "Segoe UI, system-ui, sans-serif",
      "font-size": style.size || 12.5,
      "font-weight": style.weight || 400,
      fill: style.color || "#26241f"
    });
    lab.textContent = str;
    this.layer.appendChild(lab);
    return this;
  };

  FChart.prototype.legend = function (entries) {
    var g = el("g", {});
    var x = this.w - this.m.r, y = this.m.t + 2;
    var self = this;
    entries.forEach(function (e) {
      var t = el("text", {
        x: x, y: y,
        "text-anchor": "end",
        "font-family": "Segoe UI, system-ui, sans-serif",
        "font-size": 12, fill: "#5d5749"
      });
      t.textContent = e.text;
      g.appendChild(t);
      var tw = e.text.length * 12;
      g.appendChild(el("line", {
        x1: x - tw - 26, x2: x - tw - 8, y1: y - 4, y2: y - 4,
        stroke: e.color || "#0d5c4f", "stroke-width": 2.5,
        "stroke-dasharray": e.dash || "none"
      }));
      y += 18;
    });
    this.layer.appendChild(g);
    return this;
  };

  /* ---------- 工具函数 ---------- */

  FChart.trimNum = function (v) {
    if (Math.abs(v) >= 1000) {
      return Math.round(v).toLocaleString("zh-CN");
    }
    return String(Math.round(v * 100) / 100);
  };

  FChart.pct = function (v) { return Math.round(v * 100) + "%"; };

  /* 补间动画：从 from 到 to，持续 dur 毫秒，每帧回调 cb(value) */
  FChart.tween = function (from, to, dur, cb, done) {
    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      cb(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(step);
      else if (done) done();
    }
    requestAnimationFrame(step);
  };

  /* 便捷：为滑块绑定数值显示，返回当前数值 */
  FChart.slider = function (input, fmt) {
    var val = parseFloat(input.value);
    if (input._out) {
      input._out.textContent = fmt ? fmt(val) : String(Math.round(val * 100) / 100);
    }
    return val;
  };
  FChart.bindSliderLabel = function (input, outEl, fmt) {
    input._out = outEl;
    return FChart.slider(input, fmt);
  };

  global.FChart = FChart;
})(window);
