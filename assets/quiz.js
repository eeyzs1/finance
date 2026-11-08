/* ============================================================
   课程运行时：随堂测验组件 + 术语提示
   用法（测验）：在页面中放置——
   <div class="quiz">
     <script type="application/json">
     {
       "title": "随堂测验",
       "questions": [
         {"q": "题目", "options": ["甲", "乙"], "answer": 0, "explain": "解析"}
       ]
     }
     </script>
   </div>
   用法（术语）：<span class="term" data-def="释义">术语</span>
   ============================================================ */

(function () {
  "use strict";

  /* ---------- 学习进度（localStorage，本机离线保存） ---------- */

  var STORE_KEY = "finance-course-progress-v1";

  function loadAllProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveProgress(key, rec) {
    var all = loadAllProgress();
    all[key] = rec;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(all));
    } catch (e) {
      /* 隐私模式 / 存储被禁用时静默放弃，不影响答题 */
    }
  }

  /* ---------- 术语提示 ---------- */

  // 术语靠近屏幕左右边缘时，把气泡平移回可视区，避免被裁切
  function clampBubble(el, bubble) {
    var bw = bubble.offsetWidth;
    if (!bw) return;
    var r = el.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var dx = 0;
    if (cx - bw / 2 < 8) dx = 8 - (cx - bw / 2);
    else if (cx + bw / 2 > window.innerWidth - 8) dx = window.innerWidth - 8 - (cx + bw / 2);
    bubble.style.transform = dx
      ? "translateX(calc(-50% + " + Math.round(dx) + "px))"
      : "";
  }

  function initTerms() {
    document.querySelectorAll(".term[data-def]").forEach(function (el, i) {
      if (el.querySelector(".term-bubble")) return;
      var bubble = document.createElement("span");
      bubble.className = "term-bubble";
      bubble.id = "term-tip-" + i;
      bubble.setAttribute("role", "tooltip");
      bubble.textContent = el.getAttribute("data-def");
      el.appendChild(bubble);
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-describedby", bubble.id);
      // 触屏设备没有 hover：点击切换气泡显示
      el.addEventListener("click", function () {
        var isOpen = el.classList.toggle("open");
        if (isOpen) {
          document.querySelectorAll(".term.open").forEach(function (other) {
            if (other !== el) other.classList.remove("open");
          });
          clampBubble(el, bubble);
        }
      });
      el.addEventListener("mouseenter", function () { clampBubble(el, bubble); });
      el.addEventListener("focus", function () { clampBubble(el, bubble); });
    });
    // 点击术语以外的区域时收起所有气泡
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".term")) return;
      document.querySelectorAll(".term.open").forEach(function (t) {
        t.classList.remove("open");
      });
    });
  }

  /* ---------- 测验组件 ---------- */

  function buildQuiz(box) {
    var data = box.__quizData;
    if (!data) {
      var dataEl = box.querySelector('script[type="application/json"]');
      if (!dataEl) return;
      try {
        data = JSON.parse(dataEl.textContent);
      } catch (e) {
        console.error("测验数据解析失败：", e);
        return;
      }
      // 缓存解析结果：「重新测验」会清空 box.innerHTML，
      // 其中的原始 <script> 数据节点会被一并移除，重建时只能依赖这份缓存。
      box.__quizData = data;
    }
    var questions = data.questions || [];
    if (!questions.length) return;

    var answered = 0, correct = 0, locked = questions.map(function () { return false; });

    // 头部
    var head = document.createElement("div");
    head.className = "quiz-head";
    var title = document.createElement("span");
    title.className = "quiz-title";
    title.textContent = data.title || "随堂测验";
    var score = document.createElement("span");
    score.className = "quiz-score";
    score.setAttribute("aria-live", "polite");
    head.appendChild(title);
    head.appendChild(score);
    // 有本课历史记录时，提示上次成绩与重测时间（配合"隔几天重测"的间隔复习）
    var saved = loadAllProgress()[location.pathname];
    if (saved && saved.n) {
      var d = new Date(saved.t);
      var last = document.createElement("span");
      last.className = "quiz-last";
      last.textContent = "上次 " + saved.c + "/" + saved.n +
        " · " + (d.getMonth() + 1) + "月" + d.getDate() + "日";
      head.appendChild(last);
    }
    box.appendChild(head);

    function updateScore() {
      score.textContent = "已作答 " + answered + " / " + questions.length +
        " · 正确 " + correct;
    }
    updateScore();

    var summary = document.createElement("div");
    summary.className = "quiz-summary";

    questions.forEach(function (q, qi) {
      var qEl = document.createElement("div");
      qEl.className = "quiz-q";
      var no = document.createElement("span");
      no.className = "qno";
      no.textContent = "第 " + (qi + 1) + " 题";
      qEl.appendChild(no);
      qEl.appendChild(document.createTextNode(" " + q.q));
      box.appendChild(qEl);

      var opts = document.createElement("div");
      opts.className = "quiz-opts";

      q.options.forEach(function (optText, oi) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quiz-opt";
        btn.textContent = String.fromCharCode(65 + oi) + "．" + optText;
        btn.addEventListener("click", function () {
          if (locked[qi]) return;
          locked[qi] = true;
          answered++;
          var buttons = opts.querySelectorAll(".quiz-opt");
          var pick = Number(q.answer) === oi;
          if (pick) correct++;
          buttons.forEach(function (b, bi) {
            b.disabled = true;
            if (bi === Number(q.answer)) b.classList.add("right");
          });
          if (!pick) btn.classList.add("wrong");
          var ex = document.createElement("div");
          ex.className = "quiz-explain";
          var lead = document.createElement("b");
          lead.textContent = pick ? "回答正确。" : "再想想：正确答案是 " + String.fromCharCode(65 + Number(q.answer)) + "。";
          ex.appendChild(lead);
          if (q.explain) ex.appendChild(document.createTextNode(q.explain));
          opts.appendChild(ex);
          updateScore();
          if (answered === questions.length) {
            var pct = Math.round((correct / questions.length) * 100);
            var msg;
            if (pct === 100) msg = "全对！这些概念已经进入你的短期记忆——隔几天回来重测一遍，才能变成长期记忆。";
            else if (pct >= 60) msg = "不错！错题旁边的解析值得再读一遍，然后隔几天重测。";
            else msg = "没关系，回到上文对应小节再走一遍，然后点击下方按钮重测。";
            summary.textContent = "成绩：" + correct + " / " + questions.length + "（" + pct + "%）· " + msg;
            saveProgress(location.pathname, {
              c: correct,
              n: questions.length,
              t: Date.now(),
              title: document.title
            });
            var retry = document.createElement("button");
            retry.type = "button";
            retry.className = "btn ghost";
            retry.style.marginLeft = "12px";
            retry.textContent = "重新测验";
            retry.addEventListener("click", function () {
              box.innerHTML = "";
              buildQuiz(box);
            });
            summary.appendChild(retry);
            box.appendChild(summary);
          }
        });
        opts.appendChild(btn);
      });
      box.appendChild(opts);
    });
  }

  function initQuizzes() {
    document.querySelectorAll("div.quiz").forEach(buildQuiz);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initTerms();
      initQuizzes();
    });
  } else {
    initTerms();
    initQuizzes();
  }
})();
