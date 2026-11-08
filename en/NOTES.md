# Teaching Notes (NOTES)

Learner preferences and working conventions for the AI tutor's reference in later teaching sessions.

## Learner preferences

- Language: Simplified Chinese; give the Chinese–English pairing when a finance term first appears (e.g. “贴现率 (discount rate)”);
- Math background: high-school level. Always give the intuition or a diagram before any formula; the formula is only the summary;
- Enjoys interactive content: sliders, animations, and simulators work better than plain text;
- 10–20 minutes per lesson, with one takeaway conclusion per lesson;
- The purpose of study is literacy and better personal decisions, not certifications (see Out of scope in MISSION.md).

## Working conventions

- All course pages share the components under `assets/` (styles, quiz, chart library); prefer reusing components over inlining when adding new content;
- `reference/glossary.html` is the authority for term definitions, and lesson text stays consistent with it; new terms must be back-filled into the glossary;
- Course file naming: within each branch folder, increment as `0001-slug.html`;
- Quiz-writing rules: keep the options of each question close in length (character count), rotate the correct answer's position across A/B/C/D, and give away nothing by format;
- Run `node assets/validate.js .` before committing changes: it checks quiz JSON, id references and duplicates, local links and cross-file anchors, component imports (quiz.js / charts.js), `rel="noopener"` on external links, and whether every `.term` term used in lessons has been back-filled into the glossary (compound entries go through the TERM_ALIAS alias map in validate.js);
- Whenever a branch is finished, ask the learner whether to write a learning-record (recording concepts genuinely mastered, not merely “seen”).
