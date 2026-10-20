# Review: lessons-quant-di

Scope: all 31 lesson files `content/lessons/q-*.md` (20) and `content/lessons/d-*.md` (11).
Checked: 31 of 31 lessons. Every formula, rule, worked example, quick-check answer and number fact was re-derived (by hand and with Python brute-force/script checks for counting, remainders, probability, sequences, DS case enumeration, TPA pairs, mixtures, stats). All 27 Mermaid diagrams were read for logical correctness (DS AD/BCE tree, DS C-trap tree, yes/no loop, counting tree, probability tree, percent tree, etc.); all node labels are quoted and valid. All "Go deeper" URLs were audited.

Scope checks: no geometry in Quant or DI content (one geometry-flavoured DS rephrase example removed); calculator mentioned only for DI, Quant explicitly "no calculator"; DS lives in Data Insights; Quant 21 Q / 45 min, DI 20 Q / 45 min, section scores 60-90, Review & Edit (bookmark, change up to 3) consistent with the other lessons.

Go deeper URLs: only 7 distinct URLs are used (gmatclub.com/forum/, mba.com/exams/gmat-exam, khanacademy.org/math, /math/arithmetic, /math/pre-algebra, /math/algebra, /math/algebra2, /math/statistics-probability). All are domain roots or long-standing top-level course paths; none were doubtful, so none were replaced.

## Issues found and fixed

| Lesson | Severity | Problem | Fix |
|---|---|---|---|
| q-linear | Medium | Worked example 1 trap text blamed (E) Rs 60 for "dividing 210 by 4"; 210/4 = 52.50 is choice (D) | Trap now says (D) comes from 210/4 and (E) from 180/3 |
| q-rates | Medium | Worked example 3 trap listed "120 (ignoring the head start)"; no sensible error gives 120 (leaving together gives 96) | Changed to 96 (treating both cars as leaving together) |
| q-probability | Medium | Dice table row contained `6 − \|s − 7\|`; the pipes split the Markdown table cell and corrupt the table | Reworded to "6 minus the gap between s and 7" |
| q-stats | Medium | SD table cell "Multiplied by \|k\|" had the same pipe problem (extra column) | Reworded to "the absolute value of k" |
| q-functions | Low | f(f(x)) = 9x + 8 solution silently dropped the a = -3 branch (f(x) = -3x - 4 also works) | Added a one-sentence note on the second branch |
| q-ratios | Low | Rupee amounts in Indian grouping (3,10,000 / 1,00,000) contradict q-arith, which says the GMAT uses international commas | Rewritten as 310,000 / 100,000 / 120,000 |
| d-msr | Low | Same Indian-grouping amounts throughout the kiosk set (1,00,000, 5,76,000, 2,59,200 etc.) | All converted to international commas; arithmetic unchanged and re-verified |
| d-ds-method | Medium | Rephrase example used a rectangle perimeter (geometry, out of GMAT Focus scope) | Replaced with a pens-and-notebooks cost rephrase |
| d-ds-method | Low | "The two-step routine" lists three steps | Renamed "The routine" |
| d-intro, d-msr, d-strategy, d-tpa, d-gi, d-ta | Medium | Contradictory question-count guidance across lessons (MSR 6-7 vs 6-9; DS 5-7 vs 4-6; TPA 2-4 vs 3-5; TA/GI 2-4 vs "one or two") | Aligned everywhere: DS 5-7, MSR 6-9 (2-3 sets), TA 2-4, GI 2-4, TPA 2-4 |
| d-tpa | Low | Unsupported precise claim "60% quant / 40% verbal" | Softened to "most are quantitative" |
| d-ta | Low | Muddled sentence for the percent-of-total check | Reworded (row x 4 > total, explained as "more than one third of all other rows") |
| d-data-literacy | Low | Link label "Algebra basics" pointed at the Algebra course | Label changed to "Algebra" |

## Verified with no change needed (highlights)
- All numeric answers in the 100+ worked examples and ~110 quick checks (counting, divisibility, exponents, fractions, sequences, inequalities, linear systems, mixtures/interest/profit, percents, probability, quadratics, rates/work, ratios, remainders/cyclicity, sets, stats, word problems, strategy, all DI lessons).
- DS examples enumerated by brute force: Kavya pens/notebooks ((15,1),(3,6)), TPA gym, machine rates (a=10,b=15), x+y/xy pair, xy>0 and xy<0 cases, race/order examples.
- Mermaid decision trees: DS AD/BCE tree maps S/S to D, S/N to A, N/S to B, N/N to C or E correctly; C-trap tree correct; yes/no loop correct.

## Noted, left unchanged
- Several DI examples use Indian units (Rs lakh/crore) as business context (d-intro, d-gi, d-ta, d-data-literacy). They are internally consistent and flagged in the lessons as unit-reading practice, but q-arith says the real exam never uses those words. Left as culturally relevant context for the learner; consider a note if desired.

VERDICT: SIGN-OFF
