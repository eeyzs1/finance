/* ============================================================
   Course runtime: quiz widget + term tooltips (English edition)
   Usage (quiz): place in the page —
   <div class="quiz">
     <script type="application/json">
     {
       "title": "Quiz",
       "questions": [
         {"q": "Question", "options": ["A", "B"], "answer": 0, "explain": "Explanation"}
       ]
     }
     </script>
   </div>
   Usage (terms): <span class="term" data-def="definition">term</span>
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Learning progress (localStorage, local & offline) ---------- */

  // Separate key from the Chinese site so each language tracks its own progress.
  var STORE_KEY = "finance-course-progress-en-v1";

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
      /* Private mode / storage disabled: give up silently, answering still works */
    }
  }

  /* ---------- Term tooltips ---------- */

  // When a term sits near a screen edge, shift the bubble back into view
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
      // Touch devices have no hover: tap to toggle the bubble
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
    // Collapse all bubbles when clicking outside a term
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".term")) return;
      document.querySelectorAll(".term.open").forEach(function (t) {
        t.classList.remove("open");
      });
    });
  }

  /* ---------- Quiz widget ---------- */

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function buildQuiz(box) {
    var data = box.__quizData;
    if (!data) {
      var dataEl = box.querySelector('script[type="application/json"]');
      if (!dataEl) return;
      try {
        data = JSON.parse(dataEl.textContent);
      } catch (e) {
        console.error("Quiz data failed to parse:", e);
        return;
      }
      // Cache the parsed data: "Retake quiz" clears box.innerHTML, which
      // removes the original <script> data node, so rebuilds rely on this copy.
      box.__quizData = data;
    }
    var questions = data.questions || [];
    if (!questions.length) return;

    var answered = 0, correct = 0, locked = questions.map(function () { return false; });

    // Header
    var head = document.createElement("div");
    head.className = "quiz-head";
    var title = document.createElement("span");
    title.className = "quiz-title";
    title.textContent = data.title || "Quiz";
    var score = document.createElement("span");
    score.className = "quiz-score";
    score.setAttribute("aria-live", "polite");
    head.appendChild(title);
    head.appendChild(score);
    // If this lesson has a saved record, show the last score and date
    // (supports the "retake a few days later" spaced-repetition routine)
    var saved = loadAllProgress()[location.pathname];
    if (saved && saved.n) {
      var d = new Date(saved.t);
      var last = document.createElement("span");
      last.className = "quiz-last";
      last.textContent = "Last " + saved.c + "/" + saved.n +
        " · " + MONTHS[d.getMonth()] + " " + d.getDate();
      head.appendChild(last);
    }
    box.appendChild(head);

    function updateScore() {
      score.textContent = "Answered " + answered + " / " + questions.length +
        " · Correct " + correct;
    }
    updateScore();

    var summary = document.createElement("div");
    summary.className = "quiz-summary";

    questions.forEach(function (q, qi) {
      var qEl = document.createElement("div");
      qEl.className = "quiz-q";
      var no = document.createElement("span");
      no.className = "qno";
      no.textContent = "Question " + (qi + 1);
      qEl.appendChild(no);
      qEl.appendChild(document.createTextNode(" " + q.q));
      box.appendChild(qEl);

      var opts = document.createElement("div");
      opts.className = "quiz-opts";

      q.options.forEach(function (optText, oi) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quiz-opt";
        btn.textContent = String.fromCharCode(65 + oi) + ". " + optText;
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
          lead.textContent = pick ? "Correct. " : "Not quite — the correct answer is " + String.fromCharCode(65 + Number(q.answer)) + ". ";
          ex.appendChild(lead);
          if (q.explain) ex.appendChild(document.createTextNode(q.explain));
          opts.appendChild(ex);
          updateScore();
          if (answered === questions.length) {
            var pct = Math.round((correct / questions.length) * 100);
            var msg;
            if (pct === 100) msg = "Perfect score! These concepts are in your short-term memory now — come back in a few days and retake the quiz to move them into long-term memory.";
            else if (pct >= 60) msg = "Good work! Re-read the explanations next to the questions you missed, then retake this quiz in a few days.";
            else msg = "No problem — walk through the relevant sections above once more, then use the button below to retake.";
            summary.textContent = "Score: " + correct + " / " + questions.length + " (" + pct + "%) · " + msg;
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
            retry.textContent = "Retake quiz";
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
