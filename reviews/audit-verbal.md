# Audit: verbal files (independent re-check of earlier sign-offs)

Method: `random.seed(2027)`. CR files: 20 of 66 questions each (30%, above the 18 minimum), 10 drawn from difficulty 4-5 and 10 from difficulty 1-3. RC files: 6 whole passages each, with all their questions. Every item was answered blind first, then compared with the key, then attacked as a hostile expert (every distractor argued, second-answer search, unstated leaps, explanation letters vs positions, stimulus leaks, false real-world facts). Sampling script: `/private/tmp/claude-502/s/samp.py`.

## verbal-cr-va.json

- Sample (20 questions): v-cr-assumption-va-p-013, v-cr-strengthen-va-m-005, v-cr-assumption-va-p-012, v-cr-assumption-va-p-010, v-cr-weaken-va-p-012, v-cr-strengthen-va-p-011, v-cr-strengthen-va-p-013, v-cr-assumption-va-m-005, v-cr-weaken-va-p-014, v-cr-weaken-va-p-011, v-cr-strengthen-va-m-001, v-cr-assumption-va-m-003, v-cr-strengthen-va-p-005, v-cr-strengthen-va-p-006, v-cr-assumption-va-p-005, v-cr-strengthen-va-p-009, v-cr-strengthen-va-p-007, v-cr-weaken-va-p-009, v-cr-assumption-va-p-009, v-cr-strengthen-va-m-003

- My blind answer matched the key on every sampled item. No second defensible answer, no unstated leap in a keyed answer, no explanation letter that disagrees with the keyed position, no leaked hint, no false real-world fact found.
- Errors found: 0
- Full re-check triggered: No
- Result: PASSED-AUDIT

## verbal-cr-vb1.json

- Sample (20 questions): v-cr-paradox-vb1-m-008, v-cr-paradox-vb1-p-012, v-cr-evaluate-vb1-m-008, v-cr-inference-vb1-p-014, v-cr-inference-vb1-m-007, v-cr-evaluate-vb1-m-007, v-cr-evaluate-vb1-m-005, v-cr-inference-vb1-p-011, v-cr-inference-vb1-p-012, v-cr-paradox-vb1-p-013, v-cr-inference-vb1-m-004, v-cr-paradox-vb1-p-004, v-cr-inference-vb1-m-003, v-cr-evaluate-vb1-m-002, v-cr-paradox-vb1-m-003, v-cr-inference-vb1-m-002, v-cr-inference-vb1-p-008, v-cr-evaluate-vb1-p-008, v-cr-paradox-vb1-m-002, v-cr-paradox-vb1-p-002

- My blind answer matched the key on every sampled item. No second defensible answer, no unstated leap in a keyed answer, no explanation letter that disagrees with the keyed position, no leaked hint, no false real-world fact found.
- Errors found: 0
- Full re-check triggered: No
- Result: PASSED-AUDIT

## verbal-cr-vb2.json

- Sample (20 questions): v-cr-role-vb2-m-006, v-cr-complete-vb2-m-006, v-cr-role-vb2-p-011, v-cr-flaw-vb2-p-011, v-cr-flaw-vb2-m-006, v-cr-role-vb2-m-008, v-cr-flaw-vb2-m-007, v-cr-role-vb2-p-013, v-cr-complete-vb2-p-013, v-cr-flaw-vb2-p-014, v-cr-flaw-vb2-m-003, v-cr-complete-vb2-m-002, v-cr-role-vb2-p-006, v-cr-role-vb2-m-003, v-cr-flaw-vb2-p-005, v-cr-role-vb2-p-005, v-cr-complete-vb2-m-003, v-cr-complete-vb2-p-001, v-cr-role-vb2-p-003, v-cr-flaw-vb2-p-003

- My blind answer matched the key on every sampled item. No second defensible answer, no unstated leap in a keyed answer, no explanation letter that disagrees with the keyed position, no leaked hint, no false real-world fact found.
- Errors found: 0
- Full re-check triggered: No
- Result: PASSED-AUDIT

## verbal-rc-vc1.json

- Sample (6 passages, 21 questions): rc-vc1-m-04, rc-vc1-p-10, rc-vc1-m-01, rc-vc1-m-02, rc-vc1-p-01, rc-vc1-p-05

- My blind answer matched the key on every sampled item. No second defensible answer, no unstated leap in a keyed answer, no explanation letter that disagrees with the keyed position, no leaked hint, no false real-world fact found.
- Errors found: 0
- Full re-check triggered: No
- Result: PASSED-AUDIT

## verbal-rc-vc2.json

- Sample (6 passages, 20 questions): rc-vc2-m-09, rc-vc2-m-07, rc-vc2-m-10, rc-vc2-m-16, rc-vc2-p-06, rc-vc2-m-12

- My blind answer matched the key on every sampled item. No second defensible answer, no unstated leap in a keyed answer, no explanation letter that disagrees with the keyed position, no leaked hint, no false real-world fact found.
- Errors found: 0
- Full re-check triggered: No
- Result: PASSED-AUDIT

## verbal-rc-vc3.json

- Sample (6 passages, 23 questions): rc-vc3-p-01, rc-vc3-m-01, rc-vc3-m-05, rc-vc3-p-03, rc-vc3-p-04, rc-vc3-m-11

- My blind answer matched the key on every sampled item. No second defensible answer, no unstated leap in a keyed answer, no explanation letter that disagrees with the keyed position, no leaked hint, no false real-world fact found.
- Errors found: 0
- Full re-check triggered: No
- Result: PASSED-AUDIT

## Other observations (not errors, no edits made)
- Answer-key letters named in explanations agree with `answer` for all 389 questions across the six files (regex sweep, not only the sample); no duplicate choices.
- Style only: roughly 55 explanations (mostly the vb1 inference/paradox items and many vc3 mock items) run 49-79 words, under the spec's 80-word minimum. The validator does not flag this and the content is correct, so I left them.
- Judgement calls I examined and left alone: vb2 role-p-013 (B over A) and vb1 evaluate-m-002 (C vs A) have one clearly best answer; vc3-m-019 (B vs E) is correctly keyed because E alone is not a trigger for scrutiny under the passage; vb2 complete-m-006 option A is a weak distractor, not a rival answer.
- `node scripts/validate-content.mjs`: 0 errors, 0 warnings. No content files were modified.

VERDICT: SIGN-OFF
