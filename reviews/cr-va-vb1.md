# Review cr-va-vb1: Critical Reasoning

Scope: all questions in content/questions/verbal-cr-va.json (66) and content/questions/verbal-cr-vb1.json (66). 132 checked.

Method: each stimulus and stem was read, prephrased and answered before the key was looked at. Each keyed answer was then attacked and every distractor argued for. Quantitative inference and paradox items were rechecked by hand (percent and overlap arithmetic, ordering puzzles). All 132 independent answers matched the key, and the explanations agree with the keyed letters.

## Issues found and fixed

| id | Severity | Problem | Fix |
|---|---|---|---|
| v-cr-evaluate-vb1-p-001 | High | Choice A (was the website redesigned during the same six months) is a legitimate rival-cause check, so it competed with keyed C. The explanation's dismissal of A was not convincing. | Replaced A with an irrelevant option (product reviews on the website) and rewrote the A line in the explanation. |
| v-cr-evaluate-vb1-p-009 | Medium | Choice E (are the pilot households in the capital city) is a plausible representativeness check, so it was a partly defensible second answer. | Replaced E with an irrelevant option (domestic manufacturer of the meters) and updated the explanation. |
| v-cr-weaken-va-p-009 (EXCEPT) | High | Choice D (app users earn points only in store, so they buy in store what others buy online) arguably supports the stated in-store conclusion, so D and keyed E were both defensible as the exception. | Rewrote D as a clear weakener (app promoted at the largest stores, which draw wealthier shoppers). Updated explanation lines for C and D. |
| About 60 stimuli in verbal-cr-va.json | Register | Many stimuli opened with an invented filler sentence ("The market is a popular shopping street...", "The firm is a mid-sized..."). These are not in real GMAT register. Several used a definite article before the noun was introduced, then re-introduced it with "A" in the next sentence (for example "The firm ... A mid-sized firm surveyed ..."). Some filler also hinted at the answer (v-cr-weaken-va-p-011 mentioned collecting family background). One had a stray inconsistency (v-cr-weaken-va-m-004 said two thousand employees, while distractor E said three thousand). | Removed the filler preamble sentence(s) on every affected item. Where information was needed, it was merged into the main sentence (v-cr-assumption-va-p-001 "market street", v-cr-strengthen-va-p-009 ten-year tracking, v-cr-weaken-va-p-007 volunteers, v-cr-weaken-va-m-007 study description, v-cr-strengthen-va-p-005 study). Definitional lead-ins that carry logic were kept (Obsidian signatures, Migraine, driver-assistance features). verbal-cr-vb1.json stimuli were already in a clean register. |

## Nothing else to change
No wrong keys and no keyed answers needing an unstated leap were found. EXCEPT items (v-cr-weaken-va-p-009, -012, -m-006, v-cr-paradox-vb1-p-008, -p-012, -m-004) were verified so that exactly four choices fit the stem and the fifth does not. Difficulty labels are plausible (within one level). validate-content.mjs: 0 errors, 0 warnings after edits.

Minor, left as is: the explanation text of a few items carries a trailing general-lesson sentence (strengthen-va-p-005, strengthen-va-m-001, weaken-va-p-002, weaken-va-m-001, -m-003, -m-007), harmless.

VERDICT: SIGN-OFF
