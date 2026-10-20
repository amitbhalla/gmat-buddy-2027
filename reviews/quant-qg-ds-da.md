# Review: quant-qg-ds-da

Scope: all 50 questions in content/questions/quant-qg.json (25 counting, 25 probability) and all 66 Data Sufficiency questions in content/questions/di-ds-da.json. 116 checked.

Method: every counting and probability question was brute-forced in Python (itertools, exact Fractions) and the result matched against the choice list (single match, no duplicate choices). Every DS question was tested by enumerating integer and non-integer values (grids of fractions, permutations for ordering and seating questions) for each statement alone and together, honouring stem constraints (positive, integer, distinct). Logic-only questions (p-034, m-010, p-024) were checked by hand. Explanations, answer letters ("The answer is X" vs key), tips and traps were read in full.

Result: all 116 answer keys are correct and each has exactly one correct choice. Issues found were in explanation text and scope only.

| id | problem | fix |
|---|---|---|
| q-counting-qg-p-009 | Trap text said 480 came from "forgetting to divide the total by 2!", which is wrong (that gives 600; 480 = 720 − 240) | Trap rewritten to explain 600 and 480 correctly |
| q-counting-qg-p-016 | Trap said 5880 came from multiplying by 4!; that is actually 1680 (70 x 24). 5880 had no such origin | Trap now cites 1680 |
| q-counting-qg-p-012 | Stem said "Team Red and Team Blue are NOT labelled", self-contradictory wording | Reworded: teams are not labelled, swapping gives the same split |
| d-ds-da-p-011 | Rectangle perimeter/area DS is geometry, out of GMAT Focus scope | Recast as two positive numbers (larger is twice smaller; sum 18 / product 72); answer D unchanged and re-verified; skill tag geometry-lite removed |
| d-ds-da-m-005 | Rectangle area from perimeter DS is geometry, out of scope | Recast as "x, y positive, value of xy? (1) x+y=12 (2) x>y"; answer E unchanged and re-verified; skill tags updated |
| d-ds-da-p-033 | Explanation said "Three placements fit" for statement (1) when four seatings exist (three distinct Tara seats) | Reworded to "Several placements fit... for example" |

Severity: no wrong answer keys (0 critical). 3 minor explanation errors, 1 wording defect, 2 scope issues (geometry). All fixed.

`node scripts/validate-content.mjs`: 0 errors, 0 warnings.

VERDICT: SIGN-OFF
