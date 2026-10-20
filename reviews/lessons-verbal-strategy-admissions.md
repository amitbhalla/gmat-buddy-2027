# Review: lessons-verbal-strategy-admissions

## Scope
- 41 lessons: content/lessons/v-*.md (17), s-*.md (11), a-*.md (13)
- content/admissions/schools.json (25 programmes), timeline.json (45 steps), content/resources.json (35 resources)
- content/flashcards.json decks test (31), cr (51), rc (25), di (41), vocab (30) = 178 cards
- content/glossary.json (156 terms)
- Checked against research/01, 02, 02-part2, 03 and CONTENT_SPEC.md. Every worked CR/RC example (about 70) was solved independently; every Mermaid block (about 35) was read for logic and syntax; every URL was checked (all are domain roots or stable pages; the few 403s are bot blocks on live sites).
- `node scripts/validate-content.mjs` after all edits: OK, 0 errors, 0 warnings.

## Exam facts (check 1)
Section counts 21/23/20, 45 min each, 2h15m, 64 questions, 60-90 and 205-805, Review & Edit (3 changes), one optional 10-minute break, Superscore since Aug 2026, 5 attempts per rolling 12 months, 16-day gap, no lifetime cap, passport ID for centres in India, calculator only in Data Insights: all consistent across lessons, flashcards and glossary. Vendor-only claims (unanswered penalty formula, standard error, early-question weight, fees, break rule) are already attributed to prep companies with "confirm on mba.com". No false exam fact found.

## Issues found and fixed

| # | File | Severity | Problem | Fix |
|---|---|---|---|---|
| 1 | s-scores-retakes | Medium | Superscore example totals (625/645/660) contradicted the lesson's own formula in s-scoring | Recomputed to about 610 / 630 / 650 |
| 2 | s-welcome | Medium | "100 to 150 hours for modest improvement" is not in research (research says about 180 h for 50-80 pts, 240-360 h for 100-150 pts) | Replaced with TTP figures, marked as vendor estimates |
| 3 | s-test-day-india, a-timeline, a-logistics, timeline.json | Medium | Inconsistent booking advice (end Feb 2027 vs early July vs "6-8 weeks") | Unified: book when the 6-month window opens (about 28 Feb 2027), early July is the latest sensible date |
| 4 | a-logistics | Low | Passport check dated Dec 2026 vs Nov 2026 elsewhere | Changed to Nov 2026 |
| 5 | a-logistics | Medium | Claim that most Indian and European schools accept a 3-year bachelor's is unsourced | Reworded to "policies vary, confirm per school" |
| 6 | a-logistics | Low | LBS English-test row garbled vs research | Reworded to match research |
| 7 | a-profile, a-timeline, timeline.json | Low | Quant-course finish date (April / June / May-Jul) and recommender timing (Sep vs Jun-Aug) conflicted | Aligned to July and Jun-Aug |
| 8 | a-global-programs | Low | "Many MiMs are 12-16 months" not supported (HEC, ESSEC, ESCP are two-year) | Reworded |
| 9 | s-scoring, s-scores-retakes | Low | ISB 683 called "mixed scale"; ISB does not say which scale | "ISB doesn't say which scale" |
| 10 | s-scoring | Low | Review & Edit not resetting difficulty path stated as fact | Attributed to prep companies, noted GMAC does not publish it |
| 11 | s-scores-retakes | Low | Enhanced Score Report "existed in the past" stated flatly | Softened; also fixed glossary ESR entry (research flags it UNVERIFIED) |
| 12 | s-section-order-review | Low | "No break means 90 minutes" (it is 2h15m) | Fixed |
| 13 | s-mocks | Low | Suggested saving "later official exams" for a retake though all six are used | Reworded |
| 14 | glossary.json | Low | "Earlier rounds usually have more scholarship money" vs ISB FAQ | "often", with ISB caveat |
| 15 | v-strategy | Low | RC passage length 200-450 words (research: up to about 350); RC read time inconsistent with s-pacing | 200-350 words; 1.5-2.5 min reading |
| 16 | v-strategy (ex. 3) | Medium | Inference example: "largest single employer" does not guarantee resident employees; ambiguous | Rewritten as "largest source of jobs in the town" with matching choices |
| 17 | v-cr-assumption (table) | Low | Negation of "most" given as "fewer than half" (should be half or fewer) | Fixed |
| 18 | v-cr-assumption (ex. 3, Tarun Motors) | High | Choice A ("most customers would consider electric") was negated as "most would NOT", a wrong negation, and the negation did not break the plan | Choice A now "at least some ... would buy"; negation "none would" collapses the plan |
| 19 | v-cr-weaken (ex. 3, food court) | High | Choice A (vending users are people who would skip lunch) also weakens the plan, so two defensible answers | Replaced with a neutral payment-method choice; explanation updated |
| 20 | v-cr-weaken (ex. 4) | Low | Explanation for D ambiguous (it actually supports the author) | Clarified |
| 21 | v-cr-inference (ex. 1) | High | Choice D "No cafe stays open after 9 p.m. unless it serves breakfast" is vacuously true given all cafes close by 9, so two correct answers | Replaced with "Every cafe in the Old Quarter serves breakfast"; explanation updated |
| 22 | v-cr-flaw (ex. 3) | Medium | Analogy choice A (league average height / every team) was a loose match | Replaced with class average / every student |
| 23 | v-cr-paradox (ex. 4, EXCEPT) | High | Choice C ("cut applied only to rarely used routes") contradicts the stem and does not actually explain a revenue rise, so it was arguably a second EXCEPT answer | Replaced with a March fare rise on busiest routes (clearly helps) |
| 24 | v-cr-evaluate (ex. 3) | Medium | Choice D (motorist injuries) is a defensible partial control, weakening the single-answer claim | Replaced with an irrelevant motorist-opinion choice; trap re-targeted to E |
| 25 | v-cr-role (ex. 1) | Low | Trap text referred to a "number-like claim" not in the passage | Corrected |
| 26 | v-cr-structure | Low | "Roughly half of Verbal is CR" (research 9-11 of 23); "three main question families" followed by five | Fixed both; "almost always" softened |
| 27 | v-rc-reading | Medium | RC share "a third to a half" and passage lengths (350-450 words) conflicted with research and s-gmat-explained; tip told learner to answer questions out of order (impossible); map length inconsistent | Aligned counts (about 9-14 questions, 3-4 passages), lengths (200-250 / 300-350 words), removed out-of-order advice |
| 28 | v-rc-main | Medium | Passage about a "Bronze Age settlement at Karanis" (Karanis is a Graeco-Roman town) and a real economist (Joan Robinson) given invented views | Renamed to fictional Tell Ardan and Leela Menon |
| 29 | v-rc-detail (ex. 4) | Medium | "No more price-sensitive" is compatible with "less price-sensitive", so choice A was not cleanly wrong | Passage now says "just as price-sensitive" |
| 30 | v-rc-inference | Medium | Real village (Pazhaverkadu) given an invented quota scheme; quick check treated "most regions" as excluding all regions | Renamed to fictional Kadalmedu; safe inference restated as "more than half" |
| 31 | v-rc-application (ex. 2) | Medium | Choice A (traffic on bridge roads fell 25%) also supports the closure explanation, so two weakeners | Replaced with neutral charge-structure choice |
| 32 | v-rc-application | Low | "Application" is not an official GMAC type; unflagged | Added a NOTE |

## Checked and found sound (no change)
- All answer keys for the worked examples in the other CR/RC lessons (assumption ex. 1, 2, 4; strengthen ex. 1-4; weaken ex. 1, 2; inference ex. 2-4 with arithmetic; flaw ex. 1, 2, 4; paradox ex. 1-3; complete ex. 1-4; evaluate ex. 1, 2, 4; role ex. 2-4; RC main, detail, inference, function, application remaining examples). Arithmetic verified (staff 1,500/1,600; 300 overlap; 700 -> 990 complaints; superscore and score tables).
- schools.json: every figure matches research/02 or is labelled third-party or "check official deadline"; "verified" flags are consistent. timeline.json dates: 28 Aug 2027 and 16 Oct 2027 are both Saturdays; ISB, LBS, Imperial, HEC, INSEAD patterns match research.
- resources.json prices are labelled approximate and match research ranges; all URLs are domain roots or stable pages.
- Flashcards (test, cr, rc, di, vocab) and the rest of the glossary: factually correct and consistent with lessons.
- Mermaid diagrams: logic and syntax fine.

## Residual notes (not errors)
- Several figures remain vendor or third-party sourced because mba.com did not render during research (fees, percentiles, reschedule tiers, penalty formula). Lessons say so and point learners to mba.com; no change needed.

VERDICT: SIGN-OFF
