# Review: rc-vc1-vc2

Scope: content/questions/verbal-rc-vc1.json (14 passages, 50 questions) and content/questions/verbal-rc-vc2.json (18 passages, 65 questions). Total 32 passages, 115 questions, all checked.

Method: read every passage in full, answered every question from scratch before looking at the key, then compared with `answer`. For each item I confirmed the keyed choice is supported by specific lines and each distractor fails for a nameable reason (too strong, reversed, out of scope, wrong paragraph or wrong side of the debate). I also confirmed that choices are unique, there are exactly 5 per question, the explanation's "Correct" marker matches the key (vc1), vc2 explanations name the right letter and reasoning, and quoted phrases in stems appear verbatim in the passages. Answer positions are evenly spread (10 each in vc1, 13 each in vc2). Passages were checked for real-world claims: soil carbon, Yellowstone wolves (1995), Green Revolution in India, shrinking human brain volume, antibiotic course advice, decoy effect, Muybridge's galloping horse and similar are accurate or framed as researchers' views; the studies cited are fictional and framed neutrally.

Key result: all 115 keyed answers agree with my independent answers; no wrong keys, no second defensible answer, no false facts.

## Issues found and fixed

| id | problem | fix |
|---|---|---|
| v-rc-function-vc2-p-015 | Explanation misattributed "logic seemed unassailable" to the second paragraph (it is in the first). | Reworded the distractor (E) rebuttal to cite both paragraphs correctly. |
| v-rc-detail-vc1-p-004, v-rc-detail-vc1-p-005, v-rc-detail-vc1-m-001, v-rc-detail-vc1-m-003 | Explanations were 71-79 words, under the spec's 80-word minimum. | Added one short, correct sentence of method to each. |
| v-rc-application-vc1-p-004, v-rc-application-vc1-p-006, v-rc-application-vc1-m-002 | Difficulty 5 for easy analogy questions (about 2 levels too high). | Set to 3. |
| v-rc-inference-vc2-p-013, v-rc-application-vc2-m-036 | Difficulty 5 too high for a direct inference and a counting question. | Set to 4. |
| v-rc-application-vc2-m-029, v-rc-application-vc2-m-040 | Difficulty 5 for questions with one clearly matching choice. | Set to 3. |

Severity: 0 critical (wrong key or false fact), 0 major, 1 minor explanation error, 4 minor length shortfalls, 7 minor difficulty labels.

## Notes (no change needed)

- rc-vc1-p-01 and rc-vc2-p-01 both cover microbial soil carbon. The texts, questions and choices are different, but a learner may notice the repeated topic.
- Several vc2 first-question timeTargets are 150-180 seconds; these include passage reading time, consistent with the spec.

`node scripts/validate-content.mjs`: OK, 0 errors, 0 warnings.

VERDICT: SIGN-OFF
