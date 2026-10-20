# Code review: GMAT Buddy 2027 (JavaScript, correctness)

Scope: planner, mock engine and mock view, session view, select, scoring, store, today, lesson, qview, md, sw.js, app router, and the views more, library, checklist, admissions, settings, cards (plus plan, errors, practice, learn, progress, onboarding, common). Method: read every file, simulated the planner under many settings, ran data checks over all 1,047 questions, curl-checked every precache entry from `node server.js 8095`. No browser used. Regression tests are in `tests/review.test.mjs` (24 tests pass in total with `npm test`).

Severity: High = user-visible wrong behaviour in normal use; Medium = wrong in a realistic scenario; Low = edge case or polish.

## Fixed

| # | File:line | Sev | Scenario | Fix |
|---|---|---|---|---|
| 1 | js/views/today.js (render, end of function) | High | `render()` calls itself after every tick, defer, pace change or backup. Each call added another click listener to the same `view` and only the first was ever removed. `stopPropagation` does not stop sibling listeners, so after the first interaction every tap ran the handler twice (tick then untick = nothing happens), three times, and so on. Defer and task sheets opened twice. | Keep exactly one handler on the view (`view._todayClick`), replace it on every render. |
| 2 | js/store.js `logMinutes`, js/views/today.js `toggleItem` | Medium | `logMinutes` ignored negative values, so the "take minutes back" call on un-ticking did nothing. Tick, untick, tick again inflated minutes and streaks. It also subtracted the item's planned minutes even if the item was ticked on another day. | `logMinutes` accepts negatives (floor 0). `toggleItem` subtracts the minutes recorded in `done[key]` and only if that record is from today. |
| 3 | js/views/session.js:108 (and js/views/errors.js:82) | Medium | `date: new Date().toISOString().slice(0,10)` is the UTC date. In India (UTC+5:30) a session done before 05:30 is dated the previous day, so it shows the wrong date in Progress. The rest of the app uses local dates. | Use `todayStr()`. |
| 4 | js/views/session.js `updateTimer` (time up) | Medium | In a timed section test, if time ran out while an answer was selected but Next not yet pressed, the answer counted in the summary but no attempt was recorded (no stats, no mistake-log entry if wrong). | Commit the on-screen question first when it is answered, then close the rest. |
| 5 | js/views/mock.js `endSection` | Medium | `m.draft` (a pick not yet confirmed with Next) was never cleared. When the timer expired mid-question, the first question of the next section opened pre-selected with the previous question's pick and Next enabled. | Clear `m.draft` in `endSection`. |
| 6 | js/views/mock.js timer, break expiry | Low | When the 10-minute break ended by itself, `qStart` was not reset, so the first question of the next section was credited about 10 extra minutes (wrong per-question timing in results and attempts). | Reset `qStart` and `m.current` there. |
| 7 | js/views/mock.js `complete` | Low | A double tap on End section could finalise twice (duplicate result and attempts). | Return early if `activeMock` is already gone. |
| 8 | js/views/mock.js results screen | Low | `bindQuestion` was attached to the shared `#qdetail` host on every question opened. After two questions, each Hide/Show or table-sort click ran twice and cancelled itself. | Bind once, before the click handler. |
| 9 | js/views/mock.js start screen | Medium | Starting a new mock from Today or the hub silently overwrote a mock in progress. | Ask for confirmation first. |
| 10 | js/views/mock.js official score form | Low | A typed total above 805 was stored as is. | Clamp to 805. |
| 11 | js/planner.js `planStatus` | Medium | When all remaining lessons fit but the learning target had already passed (quota is `Infinity`), the banner read "You need about Infinity minutes of new material per study day". Reproduced. | Only use the "tight" message when quota is finite. |
| 12 | js/planner.js mock season | Medium | If the mock day (default Saturday) was not a study day, zero season mocks were scheduled, silently. Likewise a 60-minute weekend (an offered setting) failed the `room >= 60` test after the 10-minute flashcards, so every season mock disappeared. | Mock goes on the next study day after the chosen day (`effectiveMockDay`); test uses the day's capacity, not the room left after habits. |
| 13 | js/planner.js mock season | Low | Deep review was only scheduled when the weekday equalled the review day, so with the mock moved (or a different review day) it never appeared. | Review goes on the day after any mock. |
| 14 | js/planner.js retake phase | Low | `retake:targeted` was pushed with `minutes = min(45, room)`, which gave 0 or negative minutes on short days (reproduced with 30-minute days). | Only add it when at least 15 minutes remain. |
| 15 | js/app.js `route` | Low | A view whose `render` finished after the user had already moved on overwrote the current view's cleanup, so the real one (timers, keydown handlers, for example a running mock or session) never ran. | Sequence number; a stale view cleans itself up immediately. |
| 16 | js/views/plan.js | Low | The "This week" panel on Today links to `#/plan?d=<date>` for the next seven days. Dates falling in next week were ignored (selection reset to today). | Start on the week that contains the requested date. |
| 17 | js/qview.js `renderDropdownPrompt` | Low | `String.replace` with a string replacement interprets `$&`, `$'`, `$$` in the select markup, so an option text such as "$&" or "$'" would corrupt the prompt. No current content hits it. | Use a replacer function. |
| 18 | js/views/checklist.js | Low | Pressing "Mark done" twice logged 15 minutes twice. | Only log the first time. |
| 19 | js/views/common.js `deferSheet` | Low | A typed date of today or earlier was accepted and reported as "Moved", but did nothing. | Ignore dates that are not after today. |
| 20 | js/store.js | Low | Saves are debounced by 150 ms; closing or hiding the tab inside that window lost the last change. | Flush on `pagehide` and when the page becomes hidden. |
| 21 | scripts/build.mjs | Low | `img/` (2.6 MB of lesson images) was not in the precache list, so images were missing offline until each had been seen once online. | Added `img` to the directories. Run `npm run build` before deploying (the committed `precache.json` pre-dates this and the other edits). |

## Checked and found correct (no change)

Planner quota and credit logic, held big items, deferral of queue, held, mock and admissions items, per-day overrides, doneToday, taper and test-day items, retake and apply phases. All items are scheduled at default settings, at every speed with 45 minutes or more per weekday. With 30-minute weekdays about 70 items spill past mock season and the banner correctly says "behind". Mock engine: counts (21/23/20), adaptive targeting, RC/MSR groups kept whole, no repeats across finished mocks, 3-change rule (one question changed twice costs one), scoring and finalise. Resume after reload (`ensureQuestion` does not re-serve the current question). Streak, `recordAttempt` once per question (redo marks errors resolved, mock-hidden skips the error log), import and export. Lesson splitting around fenced code. DS choices A-E mapping, yes/no, TPA and dropdown grading (all 1,047 questions match the shapes the grader assumes). Callouts and Mermaid fallbacks. Service worker: all paths relative, precache URLs all return 200, navigation falls back to `./index.html`. Manifest `start_url` and `scope` are `./`. No absolute `/` fetches, links or image paths anywhere in `index.html`, `sw.js`, `js/`, manifest or lessons (enforced by a new test).

## Observations, not changed

- Mock timer pauses while the tab is hidden and does not run while the page is closed (it counts only visible time). That makes a mock easy to pause, unlike the real exam. Design choice; flagging it.
- `sw.js` itself never changes, so browsers never reinstall it; files refresh through stale-while-revalidate (one reload behind after a deploy) rather than through the precache version. Acceptable for a static site; stamping the version into `sw.js` in `build.mjs` would make updates immediate.
- If the weekly mock day lands on a busy or day-off override, that week's mock is skipped, so the last season mock can fall off the end of the season.
- Unfinished `activeMock` is auto-saved every 10 s while the timer runs; a crash inside that window loses up to 10 s of timer, not answers.
- The `img/gen` images are being produced by someone else; they are not in the committed `precache.json` yet.

## Verification

- `npm test`: 24 pass, 0 fail (10 original + 14 new in `tests/review.test.mjs`).
- `node --check` on every module: clean.
- `node server.js 8095` plus curl over all 145 precache entries: all 200.

VERDICT: SIGN-OFF
