# Review rc-vc3

Scope: content/questions/verbal-rc-vc3.json, 18 passages and 66 questions (all RC, all multiple choice). Every passage was read in full; every question was answered blind before the key was checked; every keyed answer was matched to specific lines, and each distractor was checked for a nameable failure (reversal, out of scope, too strong, wrong attribution, wrong paragraph, or irrelevant to the argument). Explanations, tip and trap text were read for all 66. No computation is involved, so no scripts were needed beyond checking for duplicate choices (none) and key letters.

Checked: 18 passages, 66 questions. My blind answers matched the key on all 66. No question had a second defensible answer.

| id | problem | severity | fix |
|---|---|---|---|
| rc-vc3-p-01 (passage) | Cited a specific real-world locale ("meadows in southern England") for an invented study, presented as fact | Low (fact risk) | Changed to "a recent field study of meadows"; explanation of p-001 adjusted to "the meadow study" |
| v-rc-detail-vc3-p-002 | Explanation said distractor A "is never observed". In fact A (moth visits higher in dark plots than lit) is true given the 60% fall in lit plots; it fails only because it is the contested result, not the authors' reply | Medium (explanation inaccurate) | Rewrote the A sentence to say A is true but is not the authors' response |
| v-rc-function-vc3-p-003 | Explanation of distractor D was muddled (talked about moths moving) | Low | Rewrote: equal daytime visits show lamps did not affect daytime insects at all |
| rc-vc3-m-12 (passage) and v-rc-inference-vc3-m-044 explanation | "Honey ... follows similar rules" stated as flat fact about foragers; the real record on honey sharing is mixed | Low (fact risk) | Softened to "has often been reported to follow similar rules" in both places; key unchanged (E) |
| v-rc-inference-vc3-m-026 | Difficulty 5 for a straightforward attitude question | Low | Set to 4 |
| v-rc-function-vc3-m-040 | Difficulty 4 for an explicit-text function question | Low | Set to 3 |
| v-rc-function-vc3-m-051 | Difficulty 4 for an explicit-text function question | Low | Set to 3 |

No wrong keys, no ambiguous stems, no duplicate choices. Passages were also scanned for real-world factual claims (Adam Smith remark, Russian blue terms, bilingual advantage debate and publication bias, sepsis mouse comparisons, vitamin D trials, five-year survival and lead-time bias, human fatal crash rate near one per hundred million miles, life-cycle emissions break-even); all are accurate or properly hedged. The numeric study results in the passages (60 percent, a third, half as large) are presented as findings of unnamed studies, which is standard for GMAT-style passages.

`node scripts/validate-content.mjs`: OK, 0 errors, 0 warnings.

VERDICT: SIGN-OFF
