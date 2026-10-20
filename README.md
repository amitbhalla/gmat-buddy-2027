# GMAT Buddy 2027

A complete, guided GMAT Focus Edition study companion that runs in the browser — built for one learner (Maria) going from zero to test day (target: **Saturday 28 August 2027**, backup attempt October 2027) and on to MBA / Masters applications.

**Open it:** https://amitbhalla.github.io/gmat-buddy-2027/ (works on phones; add it to your home screen and it works offline).

## What's inside

| Area | What it does |
|---|---|
| **Today** | One clear "Next up", the rest of the day, optional extras folded away. Tell it if today is busy, normal, free or off; move any item to another day. |
| **Daily plan** | A ten-month plan (Orientation → Foundations → Core → Advanced → Mock season → Taper → Test → Applications) recomputed every day. Missed days roll forward. Pace: Gentle / Balanced / Fast-track. Holidays and breaks supported. |
| **Learn** | 72 lessons across Start Here, Quant, Verbal, Data Insights, Strategy and Admissions — bite-sized steps, diagrams (Mermaid), infographics, worked examples with hidden solutions, tips and traps. Unit concept maps show the big picture. |
| **Practice** | ~1,000 original questions in all GMAT Focus formats (PS, CR, RC, DS, TA, GI, TPA, MSR) with full explanations, takeaways and named traps. Smart practice targets weak topics; missed questions come back on a spaced schedule. |
| **Mocks** | Full-length adaptive mocks (21/23/20 questions, 45 min each), section-order choice, Review & Edit with 3 answer changes, optional 10-minute break, estimated 60-90 / 205-805 scores. A separate question pool is reserved for mocks. Official practice exam scores can be logged too. |
| **Flashcards** | ~360 spaced-repetition cards: number facts, formulas, traps, CR/RC/DI strategy, exam facts, vocabulary. |
| **Mistake log** | Every miss with a one-tap reason (concept, careless, misread, timing, trap, guess), a one-line fix, and redo sets. |
| **Progress** | Projected score, mock trend, section strength, topic mastery, study calendar, milestones. |
| **Admissions** | Programmes that fit a ~2-3 year marketing profile (ISB PGP, SPJIMR, European MiMs and marketing masters, later MBAs), a tracker, and a dated admissions timeline through 2028. |

## Run it locally

```bash
npm start            # serves on http://localhost:8080 and prints a URL for your phone on the same Wi-Fi
npm run validate     # checks every content file against CONTENT_SPEC.md
npm run build        # validate + rebuild indexes + offline precache list
npm test             # unit tests (planner, scoring, selection)
```

No dependencies. Node 18+. Progress is stored in the browser (localStorage); use **More → Backup** regularly.

## How it's built

- Vanilla JavaScript ES modules, no bundler, no framework. Hash routing; works on GitHub Pages as plain static files.
- `content/` holds all learning material as JSON + Markdown (see `CONTENT_SPEC.md`). `content/curriculum.json` is the ordered course map the planner schedules.
- `js/planner.js` builds the day-by-day plan; `js/mockengine.js` + `js/scoring.js` run adaptive mocks with a Rasch (IRT) ability estimate; `js/select.js` picks questions; `js/srs.js` schedules flashcards (SM-2).
- Offline support via a service worker and `precache.json`.
- Vendored: [marked](https://github.com/markedjs/marked) (MIT), [Mermaid](https://github.com/mermaid-js/mermaid) (MIT).

## Honesty notes

- All questions and passages are original, written in the style of the exam. They are not official GMAC questions. Use the free Official Practice Exams on mba.com as your most reliable score predictor.
- Score estimates are approximations: GMAC does not publish its algorithm.
- Facts about fees, deadlines and programme rules were researched in October 2026 and marked where unverified. Always confirm on the official site before acting.

GMAT™ is a registered trademark of the Graduate Management Admission Council (GMAC). This project is not affiliated with or endorsed by GMAC.
