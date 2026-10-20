# Independent audit: quant and DS files

Scope: content/questions/quant-qa..qg.json, di-ds-da.json, di-mixed-dd.json (DS items only).
Method: random.seed(2027), 30% sample per file (minimum 15), about half from difficulty 4-5 (where available). Every sampled item was solved independently first (by hand and by Python brute force or checks for counting, remainders, divisibility, sets and DS case-testing), then compared with the key. Also checked: single correct choice, no duplicate choices, letter references in explanations/traps against actual choice positions (all sampled items scanned by script and read), no geometry, wording (integers/positive/distinct, strict vs non-strict, "at least").

| File | Items in scope | Sample | Errors found | Full re-check triggered |
|---|---|---|---|---|
| quant-qa.json | 66 | 20 | 0 | No |
| quant-qb.json | 66 | 20 | 0 | No |
| quant-qc.json | 56 | 17 | 0 | No |
| quant-qd.json | 66 | 20 | 0 | No |
| quant-qe.json | 66 | 20 | 0 | No |
| quant-qf.json | 66 | 20 | 0 | No |
| quant-qg.json | 50 | 15 | 0 | No |
| di-ds-da.json | 66 | 20 | 0 | No |
| di-mixed-dd.json (DS only) | 34 | 15 | 0 | No |

Total sampled: 167 items. Keys matched my independent solutions in all 167. No duplicate choices, no mismatched letter references, no geometry, no ambiguity found. Items probed hardest (all held up): qb-m-008 (ratio scaling to integers), qb-p-013 and qb-p-014 (sign cases of x), qc-p-017 and qc-p-014 (factor counts), qd-m-006 (extraneous root), qe-m-007 (sweets leftover wording; sum 156), qf-m-006 (range/median/mean, answer 8), qf-m-007 and qf-m-008 (greatest exactly-two = 45; minimum all-three = 20), qg-m-009 (Bayes 9/13), da-p-039 and dd-m-018 and dd-m-019 and dd-m-020 (DS integer cases), dd-p-013 (x^y vs y^x).

No edits were made to any question file. No file is FAILED-AUDIT. node scripts/validate-content.mjs: 0 errors.

Caveat: this is a 30% sample, so it shows the earlier reviews were trustworthy at that confidence level, not that every unsampled item was proven correct.

VERDICT: SIGN-OFF
