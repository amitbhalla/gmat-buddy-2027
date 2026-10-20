# Review: quant-qa-qb

Scope: all 66 questions in content/questions/quant-qa.json and 66 in content/questions/quant-qb.json (132 total).

Checked: 132 of 132. Every item was solved independently by script or by hand before looking at the key. All 132 answer keys matched my solutions, each had exactly one correct choice, none used geometry, and difficulty labels were plausible. Every explanation, tip and trap was read against the keyed answer.

## Issues found (no wrong keys; all were wording in trap or explanation text)

| id | problem | fix |
|---|---|---|
| q-fractions-qa-m-008 | Explanation and trap said d = 12 gives "b = 0"; it actually gives a = 0 and b = 0 | Wording corrected |
| q-ratios-qb-p-003 | Trap explaining the 36,000 distractor was garbled ("one third of 9 units") | Rewritten to the real slip |
| q-ratios-qb-p-004 | Trap explaining the 6:5 distractor was unclear | Reworded as a term mix-up after scaling |
| q-ratios-qb-m-003 | Trap claimed 60 came from "adding coin counts"; not true | Replaced (50 is the number of Rs 2 coins; 60 is a plain distractor) |
| q-numprops-qb-m-003 | Explanation labelled the "x < 0" choice as (A); it is (B) | Letter corrected |

Validator: `node scripts/validate-content.mjs` returns OK, 0 errors, 0 warnings.

VERDICT: SIGN-OFF
