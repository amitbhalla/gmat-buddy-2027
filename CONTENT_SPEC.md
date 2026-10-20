# Content Specification — GMAT Buddy 2027

Every content file in this repository MUST follow this spec. The app loads these files directly in the browser, so a malformed file breaks the app. After writing any file, run:

```
node scripts/validate-content.mjs
```

and fix every error before you finish. Warnings should also be fixed where reasonable.

## Who the learner is

Maria: Indian, graduated from Jesus and Mary College (Delhi University, humanities/commerce background), working in marketing for about a year. She has not done serious math since school. She is smart, busy (full-time job), and will study mostly on her phone in short sessions plus longer weekend sessions. She is aiming for a competitive GMAT Focus Edition score (target 655-705+) in the second half of 2027, then MBA / MiM applications.

Write for her: warm, plain English, zero assumed knowledge, but never dumbed-down on rigor. Explain the "why", show the fastest method AND the safe method, and name the trap. Use contractions. Short paragraphs. Occasional Indian context (rupees, Delhi Metro, cricket, chai, Diwali sales) is welcome but keep most examples neutral and international, like the real exam.

## The exam (GMAT Focus Edition) — facts to respect

- 3 sections, 45 minutes each, 2 h 15 min total, any section order, one optional 10-minute break.
- Quantitative Reasoning: 21 Problem Solving questions. Arithmetic + algebra ONLY. No geometry. No calculator.
- Verbal Reasoning: 23 questions: Critical Reasoning (CR) + Reading Comprehension (RC). No Sentence Correction.
- Data Insights: 20 questions: Data Sufficiency (DS), Multi-Source Reasoning (MSR), Table Analysis (TA), Graphics Interpretation (GI), Two-Part Analysis (TPA). On-screen calculator available.
- Scores: section 60-90, total 205-805. Question-level adaptive. Review & Edit: bookmark, then change up to 3 answers per section. Unanswered questions are penalised.

## ORIGINALITY (hard rule)

All questions, passages and examples must be ORIGINAL. Never reproduce or lightly paraphrase questions from the Official Guide, GMAT Prep, Manhattan, TTP, e-GMAT, GMAT Club or any other source. Write in the style of the real exam, with your own numbers, scenarios and passages.

## Lessons — `content/lessons/<lesson-id>.md`

Plain Markdown (GitHub-flavoured). The file name is the lesson id given in your assignment (e.g. `q-percents.md`). Structure:

```markdown
# <Lesson title>

<1-3 sentence hook: why this matters, how often it shows up on the GMAT Focus.>

## <Concept section>
... explanation, analogies, small tables ...

> [!TIP]
> A tip or shortcut.

> [!TRAP]
> A common trap answer or mistake and how to dodge it.

> [!REMEMBER]
> Must-memorise fact or formula.

> [!NOTE]
> Side note / nuance.

### Worked example 1 (Medium)
<problem text, in exam style>

<details><summary>Show solution</summary>

Step-by-step solution. Then "Faster way:" if one exists. Then "Trap:" naming the tempting wrong answer.

</details>

## Quick check
1. Short question ... 
<details><summary>Answer</summary>... </details>

## Key takeaways
- 4-8 bullets

## Go deeper
- [Resource title](URL) — one-line reason. ONLY use URLs you are certain exist (domain roots or well-known stable pages, e.g. https://www.khanacademy.org/math/algebra, https://gmatclub.com/forum/, https://www.mba.com/exams/gmat-exam). Never invent deep links.
```

Rules for lessons:
- Length: 1,500-3,000 words for core topics. Aim to teach the topic COMPLETELY from zero to GMAT-hard (difficulty 5).
- At least 4 worked examples spanning easy to hard, each with a full solution in `<details>`.
- Allowed callouts: `[!TIP]`, `[!TRAP]`, `[!REMEMBER]`, `[!NOTE]`, `[!SHORTCUT]`, `[!EXAMPLE]`. Callout lines must all start with `> `.
- Math notation: plain Unicode, no LaTeX. Use x², x³, √, ∛, ≤, ≥, ≠, ×, ÷, −, π, |x|, ½, ¼, ¾. For general fractions write `3/8` or `(a + b)/c`. Use `<sup>` for complex exponents: `2<sup>n+1</sup>`. Leave a blank line before and after `<details>` blocks' inner Markdown.
- Tables in GFM syntax are welcome (e.g., fraction-decimal-percent conversion tables, squares 1-25).
- Use H2 (`##`) for main sections, H3 for sub-sections / worked examples. Exactly one H1.

## Question files — `content/questions/<file>.json`

Every question file is a JSON object:

```json
{
  "stimuli": [ ...Stimulus objects... ],
  "questions": [ ...Question objects... ]
}
```

`stimuli` may be an empty array.

### Question object

| field | type | required | notes |
|---|---|---|---|
| `id` | string | yes | globally unique, lowercase, pattern `<topic>-<group>-<pool initial>-<nnn>` where `<group>` is the 2-3 letter group code in your assignment, e.g. `q-percents-qa-p-001`, `d-ds-da-m-004`. `p` = practice, `m` = mock |
| `section` | `"quant"` \| `"verbal"` \| `"di"` | yes | |
| `type` | `"PS"` \| `"CR"` \| `"RC"` \| `"DS"` \| `"TA"` \| `"GI"` \| `"TPA"` \| `"MSR"` | yes | |
| `topic` | string | yes | a topic id from the list below |
| `pool` | `"practice"` \| `"mock"` | yes | mock-pool questions are reserved for full-length mocks |
| `difficulty` | integer 1-5 | yes | 1 ≈ below 555 level, 2 ≈ 555-605, 3 ≈ 605-655, 4 ≈ 655-705, 5 ≈ 705+ |
| `format` | `"mc"` \| `"yesno"` \| `"dropdown"` \| `"tpa"` | yes | see formats below |
| `stimulusId` | string | for RC, MSR, TA, GI | references a stimulus in the same file |
| `prompt` | markdown string | yes | the question stem |
| `choices` | string[] | mc, tpa | mc: exactly 5 choices, no "A)" prefixes. DS: omit `choices` entirely (the app inserts the standard five) |
| `answer` | see formats | yes | |
| `statements` | string[] | yesno | 3 statements |
| `labels` | [string, string] | yesno, tpa | yesno e.g. `["Yes","No"]`, `["True","False"]`, `["Would help","Would not help"]`. tpa column headers e.g. `["Speed of A","Speed of B"]` |
| `blanks` | string[][] | dropdown | options for each blank, in order |
| `explanation` | markdown string | yes | full solution, 80-300 words. Verbal: explain why the right answer is right AND why each wrong choice is wrong (one line each) |
| `tip` | string | yes | one-sentence transferable takeaway |
| `trap` | string | yes | the tempting wrong answer and why people fall for it |
| `timeTarget` | integer seconds | yes | realistic target: PS 90-150, CR 90-120, RC 60-120 per question (+ reading time on the first question of a passage counted separately), DS 90-150, TA 120-180, GI 90-150, TPA 120-180, MSR 120-180 |
| `skills` | string[] | optional | sub-skills, e.g. `["backsolving","percent-change"]` |

### Formats

- **mc**: `choices` has 5 strings; `answer` is the 0-based index of the correct choice (0 = A ... 4 = E).
- **DS** questions are `format: "mc"` with NO `choices`. The `prompt` contains the question, then the two statements on separate lines formatted exactly as:
  ```
  <question stem>

  (1) <statement one>

  (2) <statement two>
  ```
  `answer` index: 0 = A (1 alone sufficient, 2 alone not), 1 = B (2 alone sufficient, 1 alone not), 2 = C (together sufficient, neither alone), 3 = D (each alone sufficient), 4 = E (not sufficient even together).
- **yesno** (used by TA and some MSR): `statements` (exactly 3), `labels` (2 strings), `answer` is an array of 3 integers each 0 or 1 (index into `labels`). The question is correct only if all 3 are right.
- **dropdown** (GI): `prompt` contains `[[1]]` and `[[2]]` placeholders where the drop-downs appear. `blanks` is an array of 2 option arrays (3-5 options each). `answer` is an array of 2 integers (index into each blank's options).
- **tpa**: `labels` = the 2 column headers, `choices` = 5 or 6 shared options (rows), `answer` = `[rowIndexForColumn1, rowIndexForColumn2]` (they may be the same row if the scenario allows).

### Stimulus object

```json
{ "id": "rc-p-01", "kind": "passage", "title": "Optional title", "body": "markdown text, paragraphs separated by \\n\\n" }
{ "id": "ta-p-01", "kind": "table", "title": "...", "intro": "markdown sentence explaining the table", "table": { "columns": ["Region","Sales 2025 ($m)","Growth (%)"], "rows": [["North", 12.4, 5.1], ["South", 9.8, -2.3]] } }
{ "id": "gi-p-01", "kind": "chart", "title": "...", "intro": "markdown", "chart": <Chart spec> }
{ "id": "msr-p-01", "kind": "msr", "title": "...", "tabs": [ { "title": "Email 1", "body": "markdown" }, { "title": "Data", "table": {..} }, { "title": "Graph", "chart": {..} } ] }
```

Table cells may be strings or numbers. Tables are sortable in the app; keep 6-15 rows, 4-7 columns for TA.

Chart spec (rendered as SVG by the app):
```json
{ "type": "bar" | "line" | "stacked" | "scatter" | "pie",
  "xLabel": "Year", "yLabel": "Revenue ($m)",
  "categories": ["2021","2022","2023"],              // bar, line, stacked
  "series": [ { "name": "Product A", "values": [10, 12, 15] } ],   // bar, line, stacked
  "points": [ { "name": "Store 1", "x": 3.2, "y": 41 } ],          // scatter only
  "slices": [ { "label": "Rent", "value": 35 } ]                  // pie only
}
```
Stimulus ids: `<type>-<group>-<pool initial>-<nn>`, e.g. `rc-vc1-p-01`, `msr-dc-m-03`. RC passages: 200-350 words (short) or 350-450 (long), 3-4 questions each. MSR: 2-3 tabs, 3 questions per set (mix of mc and yesno).

## Topic ids

Quant: `q-arith`, `q-fractions`, `q-percents`, `q-ratios`, `q-exponents`, `q-numprops`, `q-divisibility`, `q-remainders`, `q-linear`, `q-quadratics`, `q-inequalities`, `q-functions`, `q-wordprob`, `q-rates`, `q-mixtures`, `q-stats`, `q-sets`, `q-counting`, `q-probability`.

Verbal: `v-cr-assumption`, `v-cr-strengthen`, `v-cr-weaken`, `v-cr-evaluate`, `v-cr-inference`, `v-cr-paradox`, `v-cr-role`, `v-cr-flaw`, `v-cr-complete`, `v-rc-main`, `v-rc-detail`, `v-rc-inference`, `v-rc-function`, `v-rc-application`.

Data Insights: `d-ds`, `d-ta`, `d-gi`, `d-tpa`, `d-msr`.

Lesson ids (curriculum) also include non-question lessons such as `q-strategy`, `v-cr-structure`, `v-rc-reading`, `d-intro`, `d-ds-method`, `d-ds-yesno`, `d-ds-traps`, `d-ds-verbal`, `d-data-literacy`, `d-strategy`, plus strategy (`s-*`) and admissions (`a-*`) lessons.

## Quality bar (reviewers will check all of this)

1. **Correctness first.** Every quant/DI answer must be verified. Solve each problem twice by different methods, and for anything computable, check with a quick script (`node -e` or `python3 -c`). Exactly one correct choice. Wrong choices should be the results of realistic mistakes.
2. **Verbal**: exactly one defensible answer; wrong answers must be wrong for a clear, explainable reason (out of scope, opposite, irrelevant comparison, too strong, half-right).
3. **Realistic difficulty spread** as assigned. Hard questions must be genuinely hard (multi-step, subtle), not just ugly arithmetic.
4. **No calculator needed** for Quant (nice numbers). DI may use messier numbers.
5. Explanations teach: method, shortcut, trap.
6. JSON must parse; ids unique; validator clean.
