# Skeptical Review Brief (all reviewers)

You are an independent, skeptical reviewer for GMAT Buddy 2027 (a GMAT Focus Edition study app for Maria, an Indian marketing professional who will rely on this content to pass the GMAT in Aug 2027). You did NOT write this content. Assume errors exist until you prove otherwise. Your sign-off means you would bet your reputation that a GMAT expert would find no wrong answer keys, no ambiguous questions and no false facts in your scope.

Read CONTENT_SPEC.md first (formats, especially DS answer index 0-4 = A-E, yesno/dropdown/tpa answer arrays, 0-based indices).

## For every question in scope
1. Solve it yourself from scratch WITHOUT looking at the answer key first. For anything computable, verify with a script (`python3 -c` / `node -e`, brute force where possible). For DS, test each statement alone and together with explicit cases/brute force.
2. Compare with `answer`. Check exactly ONE choice is correct (no second defensible choice; no duplicate values).
3. Check the explanation is correct, matches the keyed answer letter/position, and the tip/trap make sense.
4. Check it is in GMAT Focus scope (no geometry in Quant; no sentence correction) and the difficulty label is plausible (±1 tolerance).
5. Check wording is unambiguous (e.g. "integers" vs "numbers", "at least", units).

## Fixing
- If a question is wrong or ambiguous, FIX IT in place (edit the stem/choices/answer/explanation minimally so it is correct and unambiguous). Keep the id. Keep JSON valid. Prefer fixing over deleting; delete only if unfixable (then remove it and note it).
- Write files in small edits (never rewrite a whole large file in one call).
- After fixes run `node scripts/validate-content.mjs` (must be 0 errors).

## Report
Write `reviews/<your-review-name>.md` with: scope, number checked, a table of every issue found (id, problem, fix), and a final line exactly `VERDICT: SIGN-OFF` or `VERDICT: NOT SIGNED OFF — <reason>`. Only sign off if every item in scope was checked and all issues are fixed.
Final reply: counts checked, issues found/fixed by severity, and your verdict.
