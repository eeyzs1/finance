# The Finance Self-Study Course System

> A general finance course built for self-learners: 11 main branches, one folder per branch, and a self-contained interactive HTML tutorial for every lesson (with animations, chart simulators, and quizzes).
>
> **Start here**: open [`index.html`](index.html) in your browser, or follow the learning path below into each branch.
>
> **English edition** — the Chinese original lives at the repository root: [../README.md](../README.md).

---

## 1. The 11 Main Branches of Finance

Finance is the study of **how funds are allocated across the two dimensions of time and risk**. Academia and industry usually divide it into the following main branches:

| # | Main branch | In one sentence | Folder |
|---|--------|-----------|--------|
| 1 | Financial Markets & Institutions | How funds flow from savers to borrowers: a map of markets and intermediaries | [01-financial-markets-and-institutions](01-financial-markets-and-institutions/index.html) |
| 2 | Money & Banking | Money, credit creation by commercial banks, and central-bank monetary policy | [02-money-and-banking](02-money-and-banking/index.html) |
| 3 | Corporate Finance | How firms make the three big financial decisions: investing, financing, and distribution | [03-corporate-finance](03-corporate-finance/index.html) |
| 4 | Investments | The trade-off between risk and return: portfolios, pricing, and market equilibrium | [04-investments](04-investments/index.html) |
| 5 | Derivatives & Financial Engineering | Contracts about the future: futures, options, and pricing models | [05-derivatives-and-financial-engineering](05-derivatives-and-financial-engineering/index.html) |
| 6 | Risk Management | A systematic way to identify, measure, and respond to financial risk | [06-risk-management](06-risk-management/index.html) |
| 7 | International Finance | Exchange rates, the balance of payments, and cross-border capital flows | [07-international-finance](07-international-finance/index.html) |
| 8 | Behavioral Finance | How psychological biases systematically shape financial decisions and market prices | [08-behavioral-finance](08-behavioral-finance/index.html) |
| 9 | Insurance & Actuarial Science | Turning individual risks into manageable pools through the law of large numbers | [09-insurance-and-actuarial-science](09-insurance-and-actuarial-science/index.html) |
| 10 | Personal Finance | Applying finance to your own balance sheet | [10-personal-finance](10-personal-finance/index.html) |
| 11 | FinTech (Financial Technology) | How technology is reshaping payments, lending, investing, and insurance | [11-fintech](11-fintech/index.html) |

### Adjacent and overlapping fields (no separate folders)

These fields overlap deeply with the main branches; the course covers them inside the relevant branches:

- **Public Finance**: government revenue and spending, taxation, and public debt → paired with Money & Banking (02);
- **Mathematical Finance**: the rigorous mathematics of stochastic processes and pricing → folded into Investments (04) and Financial Engineering (05);
- **Quantitative Trading**: algorithmic, data-driven trading practice → Investments (04) + Financial Engineering (05);
- **Real Estate Finance**: mortgages, REITs, and securitization → Personal Finance (10) + Financial Markets (01);
- **Sustainable Finance**: green bonds and ESG investing → Investments (04) + FinTech (11);
- **Regulation & Compliance**: the Basel Accords, regtech → Risk Management (06) + Money & Banking (02);
- **Financial History**: from the Medici to Bretton Woods → case studies threaded through every branch.

---

## 2. Recommended Learning Path

```
Stage 1 · Foundations (understanding the system)
   01 Financial Markets & Institutions  →  02 Money & Banking
Stage 2 · The Three Core Pillars (reading investments and decisions)
   04 Investments  →  03 Corporate Finance  →  08 Behavioral Finance
Stage 3 · Advanced Toolkit (professional equipment)
   05 Derivatives & Financial Engineering  →  06 Risk Management  →  07 International Finance
Stage 4 · Putting It to Work (daily life and the frontier)
   10 Personal Finance  →  09 Insurance & Actuarial Science  →  11 FinTech
```

Inside each branch folder: `index.html` is the Branch Overview (knowledge map + sub-topic navigation), and from `0001-*.html` on are the numbered lessons, each doable in 10–20 minutes.

---

## 3. How to Use This Course (Teaching Method Notes)

This course is organized around the [teach method](https://skills.sh/mattpocock/skills/teach). Core principles:

1. **One point per lesson**: lessons are short and focused, and each ends with a concrete takeaway you can keep (written in the “Key takeaways” card of every lesson in every branch);
2. **Intuition before formulas**: concepts are built up with interactive animations and simulators (drag a slider and watch what changes); formulas only condense the intuition;
3. **Retrieval practice**: every lesson ends with a quiz — answer from memory and get instant feedback. Come back a few days later and retake it once; that is how short-term memory turns into long-term memory;
4. **Credible sources**: every knowledge point links to a real source wherever possible (Investopedia, Wikipedia, central banks, the IMF, etc.), and each lesson recommends one primary reading;
5. **Consistent terminology**: the course-wide glossary lives at [`reference/glossary.html`](reference/glossary.html); terms carry a dotted underline on first appearance in a lesson — hover to see the definition;
6. **Ask anytime**: the course is static HTML, but your AI tutor is alive — whenever a passage doesn't click, go back to the chat and ask.

### Workspace files

| File / directory | Purpose |
|-------------|------|
| `MISSION.md` | The learning mission: why study, and what success looks like |
| `RESOURCES.md` | A curated list of trusted resources (books, websites, communities) |
| `NOTES.md` | Records of learning preferences (for the AI tutor's reference) |
| `learning-records/` | Learning archive: concepts truly mastered and key turning points |
| `reference/` | Reference documents: glossary and formula quick reference |
| `assets/` | Shared components: stylesheets, quiz component, chart library |
| `..` | Repository root — the Chinese original of this course |

---

## 4. Environment & Offline Use

- Every course page is **self-contained HTML + shared local scripts**, with no CDN or web fonts — just double-click to open it in a browser (Chrome / Edge recommended);
- The interactive components (charts, simulators, quizzes) are all native JavaScript + SVG; there is nothing to install;
- **Your progress**: each lesson's quiz score and date are saved automatically in the browser's localStorage (this device only, offline, never uploaded); reopening a lesson shows your last score, and the Course Home page summarizes your progress and lists lessons not retaken for more than 3 days (to support spaced review). Clearing your browser data erases this progress;
- Pages print cleanly (Ctrl+P) and can be exported to PDF for review.
