# Linear Equations

Linear equations are the engine under almost every GMAT word problem. Even when the question looks like it's about rates or percents, you usually end up writing one or two linear equations and solving them. The good news: the GMAT rarely asks you to grind. It rewards the person who spots a shortcut, like adding two equations to get x + y in one step.

## Expressions vs equations

An **expression** is a phrase with no equals sign, like 3x + 5. You can simplify it, but you can't "solve" it. An **equation** says two expressions are equal, like 3x + 5 = 20. Now you can solve for x.

Why does this matter? Because on the GMAT, "simplify" and "solve" are different jobs. If a question asks for the value of 3x + 5 and tells you 3x + 5 = 20, you're done in one second. Don't solve for x first.

> [!REMEMBER]
> An equation is a balanced scale. Whatever you do to one side (add, subtract, multiply, divide), you must do to the other side. Do the same thing to both sides and the balance holds.

## Solving one equation in one variable

The plan never changes: get x alone. Work in this order.

1. Clear fractions by multiplying every term by the common denominator.
2. Expand brackets.
3. Collect the x terms on one side and the plain numbers on the other.
4. Divide by the coefficient of x.

Take 3(x − 2) + 4 = 2x + 9. Expand: 3x − 6 + 4 = 2x + 9, so 3x − 2 = 2x + 9. Move x terms: x = 11. Check: 3(9) + 4 = 31 and 2(11) + 9 = 31. 

Always plug back in when the numbers are small. It takes five seconds and catches sign slips.

### Fractions

For x/3 + x/4 = 14, multiply everything by 12: 4x + 3x = 168, so 7x = 168 and x = 24. Multiplying by the common denominator is cleaner than adding fractions.

> [!TIP]
> If an equation has fractions, multiply through by the least common multiple of the denominators right away. Your arithmetic stays in whole numbers.

### Equations where x is in a denominator

For 12/x = 3/5, cross-multiply: 3x = 60, so x = 20. Cross-multiplying is just multiplying both sides by both denominators. It only works when you have one fraction equal to one fraction.

## Translating words into equations

Most GMAT algebra starts as English. Build a small dictionary in your head.

| English | Math |
|---|---|
| "is", "was", "equals", "gives" | = |
| "5 more than x" | x + 5 |
| "5 less than x" | x − 5 (not 5 − x) |
| "x is 5 less than y" | x = y − 5 |
| "twice the sum of x and 3" | 2(x + 3) |
| "x percent of y" | (x/100) × y |
| "the ratio of x to y is 3 to 4" | x/y = 3/4 |
| "x exceeds y by 7" | x = y + 7 |

> [!TRAP]
> "5 less than x" is x − 5. "x less than 5" is 5 − x. Test with real numbers: 5 less than 12 is 7, so it's 12 − 5. Reversing the order is the single most common translation error.

### Worked example 1 (Easy)
Anaya buys 4 notebooks and a pen. The pen costs ₹30 and the total bill is ₹210. What is the cost of one notebook?

(A) ₹30  (B) ₹40  (C) ₹45  (D) ₹52.50  (E) ₹60

<details><summary>Show solution</summary>

Let n be the price of a notebook. Then 4n + 30 = 210, so 4n = 180 and n = 45. The answer is **(C)**.

Faster way: take the pen out first. ₹210 − ₹30 = ₹180 is spent on notebooks, and 180 ÷ 4 = 45.

Trap: (E) ₹60 comes from dividing 210 by 4 and ignoring the pen, or from 180/3 if you miscount notebooks.

</details>

## Literal equations: solving for one letter in terms of others

A literal equation has several letters, and you're asked to isolate one. The method is identical to ordinary solving, you just treat the other letters as if they were numbers.

Solve 2a + 3b = c for a. Subtract 3b: 2a = c − 3b. Divide by 2: a = (c − 3b)/2.

A harder one: solve (x + y)/(x − y) = 3 for x in terms of y. Multiply: x + y = 3(x − y) = 3x − 3y. Collect x terms: y + 3y = 3x − x, so 4y = 2x and x = 2y. That also tells you the ratio x : y = 2 : 1 straight away.

> [!NOTE]
> When the variable you want appears on both sides, collect it all on one side first, then factor it out. For example, ax + b = cx + d gives ax − cx = d − b, so x(a − c) = d − b and x = (d − b)/(a − c).

## Two equations, two unknowns

When there are two unknowns, you need two independent equations. There are two standard ways to solve a system.

**Substitution.** Solve one equation for one variable, then plug into the other. Use it when one equation already has a lone variable, like y = 2x − 1.

**Elimination.** Line up the equations, multiply so one variable has matching coefficients, then add or subtract to make it vanish. Use it when both equations look like ax + by = c.

Example: x + y = 10 and x − y = 4. Add them: 2x = 14, so x = 7, then y = 3. Check: 7 + 3 = 10 and 7 − 3 = 4.

> [!SHORTCUT]
> If the question asks for x + y (or x − y, or 2x + 2y), don't solve for each variable. Add or subtract the two equations and look at what you get. The GMAT builds these questions so the combined equation is neat.

### Worked example 2 (Medium)
If 3x + 5y = 23 and 5x + 3y = 25, what is the value of x + y?

(A) 4  (B) 5  (C) 6  (D) 7  (E) 8

<details><summary>Show solution</summary>

Add the equations: 8x + 8y = 48. Divide by 8: x + y = 6. The answer is **(C)**.

Check with the full solution: subtracting gives 2x − 2y = 2, so x − y = 1. With x + y = 6, x = 3.5 and y = 2.5. Then 3(3.5) + 5(2.5) = 10.5 + 12.5 = 23 and 5(3.5) + 3(2.5) = 17.5 + 7.5 = 25. Both hold.

Faster way: the coefficients are mirror images (3 and 5, then 5 and 3). Whenever you see that symmetry, add the equations.

Trap: (D) 7 might come from solving for x as 3.5 and doubling, which is just a slip. Solving for each variable separately here wastes a minute and invites arithmetic errors.

</details>

## When a system has no solution, or infinitely many

Two lines in a plane can do three things: cross at one point (one solution), run parallel (no solution), or lie on top of each other (infinitely many solutions). In equation language:

| Situation | What you see |
|---|---|
| One solution | The equations are not multiples of each other |
| No solution | Left sides are proportional, right sides are not |
| Infinitely many | The equations are exact multiples of each other |

For example, 2x + 3y = 7 and 4x + 6y = 14 are the same line (second is double the first), so infinitely many solutions. But 2x + 3y = 7 and 4x + 6y = 15 are parallel: if 2x + 3y were 7, then 4x + 6y would have to be 14, not 15. No solution.

> [!REMEMBER]
> Match the coefficients first. If the left sides become identical, compare the right sides: equal means infinitely many solutions, different means none.

### Worked example 3 (Medium-Hard)
For what value of k does the system 2x + 3y = 7 and 6x + ky = 20 have no solution?

(A) 3  (B) 6  (C) 9  (D) 18  (E) 21

<details><summary>Show solution</summary>

Multiply the first equation by 3 so the x-coefficients match: 6x + 9y = 21. For the second equation to be parallel to this line, its left side must be the same: k = 9. The right sides are then 21 and 20, which differ, so there's no solution. The answer is **(C)**.

Check: with k = 9, the second equation is 6x + 9y = 20 while the first says 6x + 9y = 21. Contradiction, so no solution.

Trap: (E) 21 is the right-hand side of the scaled equation, not the coefficient. Also note that k = 9 gives "no solution" only because 20 ≠ 21. If the second right side had been 21, k = 9 would give infinitely many.

</details>

## Three equations, three unknowns

You rarely need the full machinery. The GMAT versions are almost always symmetric, so add everything.

### Worked example 4 (Hard)
If a + b = 11, b + c = 14 and a + c = 17, what is the value of abc?

(A) 140  (B) 210  (C) 252  (D) 280  (E) 336

<details><summary>Show solution</summary>

Add all three equations: 2a + 2b + 2c = 42, so a + b + c = 21. Now each variable is the total minus the pair that doesn't include it.

- c = 21 − 11 = 10
- a = 21 − 14 = 7
- b = 21 − 17 = 4

Check: 7 + 4 = 11, 4 + 10 = 14, 7 + 10 = 17. Then abc = 7 × 4 × 10 = 280. The answer is **(D)**.

Trap: (B) 210 is 21 × 10, mixing the total with one value. Always finish by computing exactly what the question asks for.

</details>

> [!TIP]
> Counting unknowns versus equations is a good sanity check, but it isn't the whole story. Three equations can still fail to pin down three unknowns if one of them is just a combination of the others, such as x + y = 5, 2x + 2y = 10 and x − y = 1. Here the first two are the same line.

## Setting up from words

Word problems often hide two equations. Write each fact as its own equation before you start solving.

"A cricket club sells adult tickets at ₹300 and child tickets at ₹150. It sold 120 tickets for ₹27,000." Let a be adults and c children. Then a + c = 120 and 300a + 150c = 27,000. Divide the second by 150: 2a + c = 180. Subtract the first: a = 60, c = 60.

### Worked example 5 (Hard)
A shop sells pens at a fixed price and notebooks at a fixed price. Three pens and two notebooks cost ₹130. Two pens and three notebooks cost ₹120. What is the cost of one pen and one notebook together?

(A) ₹40  (B) ₹46  (C) ₹50  (D) ₹52  (E) ₹60

<details><summary>Show solution</summary>

Let p and n be the prices. Then 3p + 2n = 130 and 2p + 3n = 120. Add: 5p + 5n = 250, so p + n = 50. The answer is **(C)**.

Full check: subtract to get p − n = 10, so p = 30 and n = 20. Then 3(30) + 2(20) = 130 and 2(30) + 3(20) = 120.

Trap: (D) 52 is what you get if you average carelessly, or divide 260 by 5. The two bills add to ₹250, not ₹260.

</details>

## Quick check

1. Solve (2x − 1)/3 = (x + 4)/2.
<details><summary>Answer</summary>

Multiply by 6: 2(2x − 1) = 3(x + 4), so 4x − 2 = 3x + 12 and x = 14.

</details>

2. If 7x + 2y = 31 and 3x + 8y = 29... what is x + y? (Hint: don't solve for each.)
<details><summary>Answer</summary>

Add: 10x + 10y = 60, so x + y = 6.

</details>

3. Does 5x − 2y = 8 and 15x − 6y = 25 have a solution?
<details><summary>Answer</summary>

Triple the first: 15x − 6y = 24, but the second says 25. Parallel lines, so no solution.

</details>

4. Solve for t in terms of the other letters: d = rt + s.
<details><summary>Answer</summary>

d − s = rt, so t = (d − s)/r.

</details>

## Key takeaways
- An equation is a balance: do the same thing to both sides.
- Clear fractions early by multiplying by the common denominator.
- "A less than B" means B − A. Test with real numbers.
- For two equations asking about a sum or difference (x + y, x − y), add or subtract the equations before solving anything.
- For no solution or infinitely many solutions, make the coefficients match, then compare the right sides.
- Symmetric systems of three equations: add all three to get the total, then subtract.
- Finish by answering what was asked, not the last variable you found.

## Go deeper
- [Khan Academy: Algebra 1](https://www.khanacademy.org/math/algebra) — free practice on one-variable equations and systems.
- [GMAT Club forum](https://gmatclub.com/forum/) — search "system of equations" for worked discussions.
- [GMAT official site](https://www.mba.com/exams/gmat-exam) — format and official practice information.
