# Non-Numerical and Logic Data Sufficiency

Not every DS question has an x in it. A real share of them (often one or two per Data Insights section) are about schedules, rankings, company rules or business situations, with few or no calculations. They look easy because there is no algebra, and they are the questions where careful readers gain easy points while hurried ones lose them.

## Same game, different material

The method is exactly the one you've already learned: judge (1) alone, then (2) alone, then both. The word "sufficient" means the same thing. For a yes/no question, "always yes" or "always no" is sufficient. For a "who", "which" or "how many" question, you need one definite answer.

What changes is the tool. In algebra you manipulate equations. In logic DS you list possibilities. The question to ask on each statement is: **"Given everything I now know, is there only one possible answer, or could it be more than one?"**

## Four reasoning tools

### 1. Make a tiny diagram

Words are slippery, so draw. For orderings (who finished first, who sits where), write the people in a line and put the known relationships as arrows. For schedules, draw a row of days or slots. For groups, draw circles.

Ranking example: "Asha finished before Bala" becomes A < B (A on the left means faster). "Chitra finished after Bala" becomes B < C. Together A < B < C, a full order.

### 2. Translate rules into if/then, then flip them

Policies and rules are almost always conditionals. Write them as "If P, then Q." The statement is true in two forms and false in two others.

| Form | Name | Always true when the original is true? |
|---|---|---|
| If P then Q | Original | Yes |
| If not Q then not P | Contrapositive | **Yes, always** |
| If Q then P | Converse | No |
| If not P then not Q | Inverse | No |

> [!REMEMBER]
> The contrapositive of "If P then Q" is "If not Q then not P", and it is logically identical. The converse ("If Q then P") is a trap: it is not guaranteed.

Example: "Every manager who approves a refund must complete training." Anyone who approved a refund has completed training (original). Anyone who hasn't completed training did not approve a refund (contrapositive). But someone who completed training may or may not have approved a refund (converse, not guaranteed).

### 3. Spot "only if" and "no ... unless"

Words matter. "A is allowed only if B" means: if A, then B. B is required for A, but B alone doesn't guarantee A. "No employee with fewer than two years of service gets a bonus" is a ban: if fewer than two years, then no bonus. It says nothing about what happens with two or more years.

### 4. Test with a concrete scenario

If you can't see the answer, invent a small world that fits the information. Then try to invent a second world that also fits but gives a different answer. Two worlds that disagree mean insufficient, just like two test numbers in yes/no questions.

> [!TIP]
> Keep a short scratch list of people or items and fill in what each statement forces. After each statement, ask yourself: "If I had to name all the possible full arrangements, how many are left?" One arrangement (or all arrangements agreeing on the thing asked) means sufficient.

## What not to do

- **Don't import real-world assumptions.** If the problem doesn't say that a person can't be in two groups, or that rooms are used once, don't assume it unless it is stated or clearly implied. The answer must come from the given facts.
- **Don't treat "not stated" as "false".** If a rule says nothing about a case, the case is open.
- **Don't confuse "possible" with "certain".** In DS, "she might have attended" is not sufficient. You need "she did" or "she didn't".
- **Don't skip the stem's constraints.** "No ties", "each used once", "exactly one per day": these cut down the possibilities drastically.

> [!TRAP]
> A statement that adds a fact but doesn't change the possibilities for the thing asked is not sufficient, however relevant it sounds. Always ask: "Does this narrow down what the question is about?"

## How math sneaks in

Some "business context" DS questions are secretly arithmetic: "Did the campaign meet its target?" might need only a rough comparison, such as "(1) Revenue grew 30% and (2) the target was 25%". Treat them like any value or yes/no question. Rephrase, test, decide. The business story is wrapping paper.

## Worked examples

### Worked example 1 (Easy)
Asha, Bala and Chitra ran a race with no ties. Who finished first?

(1) Asha finished ahead of Bala.

(2) Chitra finished behind Bala.

<details><summary>Show solution</summary>

Statement (1): A is ahead of B. The orders (fastest to slowest) A B C, A C B and C A B all fit. First place is A or C. Not sufficient.

Statement (2): B is ahead of C. The orders A B C, B A C and B C A all fit. First place is A or B. Not sufficient.

Together: A is ahead of B and B is ahead of C, so only A B C fits. Asha is first. Sufficient.

Answer: C.

Trap: stopping at (1) because "Asha beat Bala, so Asha probably won". Chitra could still have won.

</details>

### Worked example 2 (Medium)
A company rule says: "No employee with fewer than two years of service receives a bonus." Did Rohan receive a bonus?

(1) Rohan has 18 months of service.

(2) Rohan received an "Outstanding" performance rating.

<details><summary>Show solution</summary>

Statement (1): 18 months is 1.5 years, which is fewer than two years, so the rule says no bonus. The answer is always no, which is sufficient.

Statement (2): an Outstanding rating doesn't tell us how long he has worked. If he has fewer than two years, the rule bars the bonus; if more, the rule is silent, so he may or may not have got one. Not sufficient.

Answer: A.

Trap: marking (1) as "not sufficient because the rule doesn't say who gets a bonus". The rule says who doesn't, and "definitely no" is a full answer.

</details>

### Worked example 3 (Medium)
Four doctors (W, X, Y and Z) are each assigned to exactly one of the four weekdays Monday to Thursday, one doctor per day. Is Y assigned to Wednesday?

(1) W is on Monday and Z is on Tuesday.

(2) X is on Thursday.

<details><summary>Show solution</summary>

Statement (1): W is Monday and Z is Tuesday, so X and Y share Wednesday and Thursday in either order. Y could be on Wednesday (yes) or Thursday (no). Not sufficient.

Statement (2): X is on Thursday. W, Y and Z fill Monday to Wednesday in any order, so Y could be Wednesday (yes) or Monday (no). Not sufficient.

Together: W Monday, Z Tuesday, X Thursday leaves only Wednesday for Y. Always yes. Sufficient.

Answer: C.

Faster way: count slots. Each statement fills only some of the four slots, but together they fill three, so the fourth is forced.

</details>

### Worked example 4 (Hard)
A university has these booking rules for its rooms: (i) every team that books Room A also books Room B; (ii) no team books both Room B and Room C. Did the Sales team book Room C?

(1) Sales booked Room A.

(2) Sales did not book Room B.

<details><summary>Show solution</summary>

Statement (1): rule (i) says A leads to B, so Sales booked B. Rule (ii) says B and C are never both booked, so Sales did not book C. Always no. Sufficient.

Statement (2): no Room B. By the contrapositive of rule (i), no B means no A. But nothing in the rules prevents a team from booking only C. Sales may or may not have booked C. Not sufficient.

Answer: A.

Trap: reading (2) as "no B, so the rule (ii) says C is allowed, so probably yes". "Allowed" is not "certain". The rule only forbids B and C together; it does not require C.

</details>

## Quick check

1. "If a customer is a member, the delivery is free." Is "If delivery is free, the customer is a member" guaranteed?

<details><summary>Answer</summary>

No. That is the converse, which is not guaranteed. Non-members might also get free delivery for another reason.

</details>

2. What is the contrapositive of "If a ticket is a Gold ticket, then it allows lounge access"?

<details><summary>Answer</summary>

"If a ticket doesn't allow lounge access, then it is not a Gold ticket."

</details>

3. A statement tells you a person "may have" attended a meeting. Is it sufficient for "Did she attend?"

<details><summary>Answer</summary>

No. "May have" leaves both outcomes open.

</details>

## Key takeaways

- Logic DS uses the same A to E system. Sufficient still means one definite answer.
- Draw a quick diagram: a line for rankings, slots for schedules, circles for groups.
- Write rules as if/then. The contrapositive is always valid; the converse is not.
- "Only if" and "no ... unless" set requirements, not guarantees.
- A firm "no" counts as sufficient.
- Build two different worlds that fit the information to prove insufficiency.
- Use only the facts given: no outside assumptions, and "not mentioned" means "open".

## Go deeper
- [Official GMAT exam page](https://www.mba.com/exams/gmat-exam) for official Data Insights practice, including non-numerical DS.
- [GMAT Club forums](https://gmatclub.com/forum/) for logic-based DS examples and discussion.
- [Khan Academy: Algebra](https://www.khanacademy.org/math/algebra) for the maths side of mixed questions.
