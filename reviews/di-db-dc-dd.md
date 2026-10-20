# Review: di-db-dc-dd

Scope: all questions in `content/questions/di-ta-gi-db.json` (40: 18 TA, 22 GI), `content/questions/di-tpa-msr-dc.json` (63: 30 TPA, 33 MSR) and `content/questions/di-mixed-dd.json` (63: 34 DS, 8 TPA, 6 TA, 6 GI, 9 MSR). Total checked: 166.

Method: every TA statement and GI blank recomputed from the stimulus data with Python; every TPA option set brute-forced (all pairs, plus full permutation search for the ordering puzzles); every MSR answer recomputed from the tabs including cross-tab facts; DS statements brute-forced over integer/rational domains (26 of 34 by script, the remaining 8 word-problem DS by hand with explicit cases). Chart precision was checked against the app renderer (`js/charts.js`): gridlines come from `niceTicks` (about 5 intervals), and no value labels are drawn, so a value must be readable to roughly a tenth of a gridline step or be stated in the text.

Result: no wrong answer keys were found. All issues were chart-precision or wording problems (answer not distinguishable from the chart) plus one garbled choice.

## Issues found and fixed

| id | problem | fix |
|---|---|---|
| d-ta-db-p-009 | Explanation said North-East online sales 90; table gives 89.6 | Corrected to 89.6 |
| d-gi-db-p-001 | Options 70 vs 77 too close for a bar read off step-20 gridlines | Data Delhi 48->45, Mumbai 62->60 (answer 75%), options 60/65/75/90, explanation and trap updated |
| d-gi-db-p-002 | Largest quarterly rise was 6 vs two rises of 5 (1 unit apart on step-5 gridlines) | Q2 23 56->57, Q3 23 61 (answer 7), options 3/5/7/9, explanation updated |
| d-gi-db-p-004 | Share options 25/30/35 and 33/38/42/46 within reading error | Options 20/30/40 and 30/38/46/54 |
| d-gi-db-p-006 | North percent growth 40->56 unreadable on step-50 gridlines, options 30/40 close | North 2024 revenue changed 56->60 so North goes 40->60 (50%), options 20/35/50/60, explanation and trap updated |
| d-gi-db-p-007 | Option spacing 40/50/60 too tight for percent growth | Options 30/50/80 |
| d-gi-db-p-008 | Coal fall 33 vs 40, share rise 22 vs 27 not separable on step-25 gridlines | Options 20/33/50/67 and 12/27/37/44 (answer indices updated), trap/explanation updated |
| d-gi-db-p-009 | Options 141 vs 144 within reading error | Options 134/141/148/156 |
| d-gi-db-p-010 | City H gap of 7 vs option 3 not readable (y step 25) | City H y 135->140 (gap 12), options 4/12/20/28, explanation updated |
| d-gi-db-p-011 | Stacked chart step 50: segment growth and share change not readable | Intro now states 2022 and 2024 segment values |
| d-gi-db-m-002 | Share options 20/25/30/35 too close on step-200 bars | Options 15/25/35/45 |
| d-gi-db-m-004 | Share options 40/45/50/55 and 48/50/52/56 indistinguishable | Options 30/40/50/60 and 40/52/64/75, answer [2,1] |
| d-gi-db-m-006 | 55+ at 31% gave ratio 3.87 vs options 3.4/3.9/4.4 (not readable) | 55+ set to 30%, options 2.0/3.0/4.0/5.0 (answer 4.0), explanation and trap updated |
| d-gi-db-m-007 | Profit 50 vs 45 and margin 17.3% vs 16.7% impossible to tell on step-50 lines | Revenue/cost series redesigned (profit 30/60/55/85/60, margin peak Year 2 30% vs Year 4 25%); answer now Year 4 / Year 2 |
| d-gi-db-m-008 | Stacked step 50: 60+ growth and share rise unreadable | Intro states 60+ and total figures for 2000 and 2020 |
| d-gi-db-m-010 | Options 6.8 vs 7.5 close (group ratio) | Options 5.0/6.8/8.5/10.0 |
| d-gi-dd-m-001 | Totals 66 vs 68 (97%) vs options 94-106 not distinguishable | Options 80/88/97/108/120, answer [2,2], trap updated |
| d-gi-dd-m-003 | Materials share 45.0% (2023) vs 44.4% (2024) indistinguishable; small overhead segments unreadable | Data redesigned (2023 share 55%, 2024 46.9%), intro states Overheads 15 and 24, options 35/50/60/75/90, explanation rewritten |
| d-gi-dd-m-004 | Slope 12 vs 11 and lowest-ratio store F 8.57 vs H 8.9 not distinguishable | Store A y 120->140, Store F y 300->270, options $130k/$180k/$220k/$270k, explanation rewritten |
| d-gi-dd-m-006 | Relative growth options 45/55/65 within reading error | Options 12/35/55/75/95 |
| d-tpa-dc-m-027 | Choice A was garbled ("and most of the airline's airports the airline would pay") | Reworded to "so at most of the airline's airports the airline would pay" |
| d-msr-dc-p-002 | Exact 5.0% growth boundary (Apr to May 12.0 to 12.6) and exact values not readable on the line chart | Added exact revenue table to the chart tab |
| d-msr-dc-p-005 | Usage of 210 vs 200-unit slab not readable on step-100 bars | Added exact usage table to the chart tab |
| d-msr-dc-m-002 | Store 1 exactly 9.0 boundary not readable from scatter | Added area/sales table to the chart tab |
| d-msr-dc-m-004 | Segment sizes (12 vs 15, 28 vs 30) not readable from stacked chart | Added sessions table to the chart tab |
| d-msr-dc-m-006 | Week 2 rate exactly 8.0 depends on exact values not readable from line chart | Added defect-rate table to the chart tab |
| d-msr-dc-p-012 | Explanation described 350 and 440 wrongly | Reworded (350 = South + Central, 440 = East + South + Central, both need three nurses) |
| 6 MSR yes/no items (Yes/No labels) | Prompt said "true or false" while labels are Yes/No | Prompts now say "true (Yes) or false (No)" |

## Verified with no change
- TA: all 24 TA items (18 + 6) recomputed; all keys correct.
- TPA: all 38 TPA items have exactly one valid pair (numeric ones by checking all option pairs; logic puzzles by full permutation search; verbal TPA by reasoning).
- MSR: all 42 MSR items recomputed from the tabs, keys all correct.
- DS: all 34 keys correct (A-E confirmed).
- GI items not listed above were checked and left alone (pie charts show percentage labels; remaining chart reads have adequate spacing).

VERDICT: SIGN-OFF
