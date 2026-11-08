// 课程文件自动化校验：测验 JSON、id 匹配、本地链接、HTML 闭合
// 用法：node validate.js [目录]
const fs = require("fs");
const path = require("path");

const root = process.argv[2] || ".";
const problems = [];
const stats = { files: 0, quizzes: 0, ids: 0, links: 0 };
const fileCache = new Map();

function readCached(p) {
  if (!fileCache.has(p)) fileCache.set(p, fs.readFileSync(p, "utf8"));
  return fileCache.get(p);
}
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 课程术语名 → 术语表词条名（去括号）的别名：组合词条拆分讲授的情况
// 英文树（en/）的别名与中文树一一对应；比较一律小写。
const TERM_ALIAS = {
  "看涨期权": "看涨期权 / 看跌期权",
  "看跌期权": "看涨期权 / 看跌期权",
  "内在价值": "内在价值与时间价值",
  "时间价值": "内在价值与时间价值",
  "波动率/标准差": "波动率",
  "国际收支平衡表": "国际收支",
  "风险中性": "风险中性概率",
  "call option": "call option / put option",
  "put option": "call option / put option",
  "intrinsic value": "intrinsic value and time value",
  "time value": "intrinsic value and time value",
  "volatility / standard deviation": "volatility",
  "balance of payments account": "balance of payments",
  "risk-neutral": "risk-neutral probability",
  "risk-neutral probabilities": "risk-neutral probability",
  "financial intermediaries": "financial intermediary",
  "market-based financial systems": "market-based financial system",
  "bank-based financial systems": "bank-based financial system",
};
function termKey(s) {
  return s.replace(/（[^）]*）|\([^)]*\)/g, "").trim().toLowerCase();
}

// 术语表词条集合（懒加载，供覆盖检查）；en/ 下的文件用英文树自己的术语表
const glossCache = new Map();
function glossaryTerms(p) {
  const isEn = path.relative(root, p).split(path.sep)[0] === "en";
  const glossPath = path.resolve(root, isEn ? "en/reference/glossary.html" : "reference/glossary.html");
  if (glossCache.has(glossPath)) return glossCache.get(glossPath);
  const terms = new Set();
  if (fs.existsSync(glossPath)) {
    for (const mm of readCached(glossPath).matchAll(/<dt id="([^"]+)">([\s\S]*?)<\/dt>/g)) {
      terms.add(termKey(mm[2].replace(/<span class="(?:en|zh)">[\s\S]*?<\/span>/g, "")));
    }
  }
  glossCache.set(glossPath, terms);
  return terms;
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      walk(p);
    } else if (name.endsWith(".html")) {
      checkFile(p);
    }
  }
}

function checkFile(p) {
  stats.files++;
  const html = fs.readFileSync(p, "utf8");
  const rel = path.relative(root, p);
  const dir = path.dirname(p);

  if (!/<\/html>/i.test(html)) problems.push(`${rel}: 缺少 </html> 闭合`);
  if (!/<meta charset="utf-8"/i.test(html)) problems.push(`${rel}: 缺少 charset 声明`);

  // 1) quiz JSON
  const qRe = /<script type="application\/json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = qRe.exec(html))) {
    try {
      const data = JSON.parse(m[1]);
      stats.quizzes++;
      const qs = data.questions || [];
      if (!qs.length) problems.push(`${rel}: 测验无题目`);
      qs.forEach((q, i) => {
        if (!Array.isArray(q.options) || q.options.length < 2)
          problems.push(`${rel}: 第${i + 1}题选项不足`);
        if (!(q.answer >= 0 && q.answer < q.options.length))
          problems.push(`${rel}: 第${i + 1}题 answer 越界`);
        if (!q.explain) problems.push(`${rel}: 第${i + 1}题缺 explain`);
        const lens = q.options.map((o) => o.length);
        // 选项字数均衡规则只针对中文（中文选项等长可防止格式暗示答案）；
        // 英文选项天然长度不一，跳过该检查。
        const allCJK = q.options.every((o) => /[\u4e00-\u9fff]/.test(o));
        if (allCJK && Math.max(...lens) - Math.min(...lens) > 4)
          problems.push(`${rel}: 第${i + 1}题选项字数差过大(${lens.join(",")})`);
      });
    } catch (e) {
      problems.push(`${rel}: 测验 JSON 解析失败 - ${e.message}`);
    }
  }

  // 2) id 引用匹配 + 同页重复 id
  const ids = new Set();
  for (const mm of html.matchAll(/\bid="([^"]+)"/g)) {
    if (ids.has(mm[1])) problems.push(`${rel}: 重复 id "${mm[1]}"`);
    ids.add(mm[1]);
  }
  for (const mm of html.matchAll(/getElementById\(["']([^"']+)["']\)/g)) {
    stats.ids++;
    if (!ids.has(mm[1])) problems.push(`${rel}: JS 引用不存在的 id "${mm[1]}"`);
  }

  // 3) 本地链接与跨文件锚点
  for (const mm of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const t = mm[1];
    if (/^(https?:|mailto:|#|data:)/.test(t)) continue;
    stats.links++;
    const base = t.split("#")[0];
    const anchor = t.split("#")[1];
    if (!base) continue;
    const target = path.resolve(dir, base);
    if (!fs.existsSync(target)) {
      problems.push(`${rel}: 链接目标不存在 "${t}"`);
      continue;
    }
    if (anchor && /\.html?$/i.test(base) &&
        !new RegExp(`\\bid="${escapeRe(anchor)}"`).test(readCached(target))) {
      problems.push(`${rel}: 目标文件缺少锚点 "${t}"`);
    }
  }

  // 4) 粗查未闭合 script
  const open = (html.match(/<script\b/gi) || []).length;
  const close = (html.match(/<\/script>/gi) || []).length;
  if (open !== close) problems.push(`${rel}: script 标签不配对(${open}/${close})`);

  // 5) 组件加载与链接安全
  if (/<script type="application\/json">/.test(html) && !/<script src="[^"]*quiz\.js">/.test(html))
    problems.push(`${rel}: 含测验数据但未引入 quiz.js`);
  if (/\bnew FChart\b/.test(html) && !/<script src="[^"]*charts\.js">/.test(html))
    problems.push(`${rel}: 使用 FChart 但未引入 charts.js`);
  for (const mm of html.matchAll(/<a\b[^>]*\starget="_blank"[^>]*>/g)) {
    if (!/\brel="[^"]*noopener/.test(mm[0]))
      problems.push(`${rel}: 外链 target="_blank" 缺少 rel="noopener"`);
  }

  // 6) 术语表覆盖：课程 .term 术语须已收录术语表（新增术语要回填，见 NOTES.md）
  if (/<span class="term"/.test(html) && glossaryTerms(p).size) {
    const seen = new Set();
    for (const mm of html.matchAll(/<span class="term"[^>]*>([^<]+)<\/span>/g)) {
      const zh = termKey(mm[1]);
      const canonical = TERM_ALIAS[zh] || zh;
      if (!zh || seen.has(zh)) continue;
      seen.add(zh);
      if (!glossaryTerms(p).has(canonical))
        problems.push(`${rel}: 术语「${zh}」未收录于术语表 reference/glossary.html`);
    }
  }
}

walk(root);
console.log(`检查 ${stats.files} 个 HTML · 测验 ${stats.quizzes} 组 · id 引用 ${stats.ids} · 本地链接 ${stats.links}`);
if (problems.length) {
  console.log(`\n发现 ${problems.length} 个问题：`);
  problems.forEach((p) => console.log("  - " + p));
  process.exit(1);
} else {
  console.log("全部通过 ✓");
}
