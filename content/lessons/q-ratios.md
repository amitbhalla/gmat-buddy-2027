# Ratios & Proportions

Ratios sit underneath a huge share of GMAT Quant: mixtures, rates, percents, work problems and even number properties. On the Focus Edition you'll see a few questions that are openly about ratios, and several more that are secretly ratios in disguise. The good news is that one tool, the "multiplier" or unit method, solves almost all of them.

## What a ratio actually says

A ratio compares sizes. If the ratio of tea drinkers to coffee drinkers in your office is 3:2, that doesn't tell you there are 3 and 2 people. It says that for every 3 tea drinkers there are 2 coffee drinkers. The real numbers could be 3 and 2, or 30 and 20, or 300 and 200.

That's the key idea. **A ratio fixes the shape, not the size.** To get real numbers you need one extra piece of information (a total, a difference, or one actual count).

### Part-to-part vs part-to-whole

Say the ratio of boys to girls in a class is 3:2. That's **part-to-part**. The whole class is 3 + 2 = 5 "units", so boys are 3/5 of the class and girls are 2/5. Those fractions are **part-to-whole**.

> [!REMEMBER]
> Part-to-part ratio a:b means the whole is a + b units. Fraction of the whole for the first part = a/(a + b). Always add before you take a fraction.

> [!TRAP]
> "The ratio of men to women is 3:5" does NOT mean 3/5 of the group are men. Men are 3/8 of the group. GMAT answer choices nearly always include the tempting 3/5.

## The multiplier (unit) method

Write the ratio parts as multiples of one unknown: if the ratio is 3:2, then boys = 3k and girls = 2k, where k is the size of one "unit". Every ratio problem then becomes one equation in k.

### Worked example 1 (Easy)
The ratio of red to blue marbles in a jar is 5:7. If there are 84 marbles in total, how many are blue?

<details><summary>Show solution</summary>

Red = 5k, blue = 7k, total = 12k = 84, so k = 7. Blue = 7 × 7 = 49.

Faster way: blue is 7/12 of the total, and 84 ÷ 12 = 7, so 7 × 7 = 49.

Trap: answering 84 × 7/5 or 84 × 5/12 (red instead of blue). Always say out loud which part the question asks for.

</details>

### Worked example 2 (Medium)
In a company the ratio of managers to non-managers is 2:13. If 9 more managers are hired and no one else joins, the ratio becomes 1:5. How many non-managers are there?

<details><summary>Show solution</summary>

Managers = 2k, non-managers = 13k. After hiring: (2k + 9) / 13k = 1/5.

Cross-multiply: 5(2k + 9) = 13k, so 10k + 45 = 13k, so k = 15. Non-managers = 13 × 15 = 195.

Check: managers 30 → 39, and 39:195 = 1:5. ✓

Trap: Answering 15 (k itself) or 30 (the number of managers). k is just the size of one unit, never the final answer unless the question asks for it.

</details>

## Combining ratios with a common term

If a:b = 2:3 and b:c = 4:5, you can't just glue them together, because b is 3 in one ratio and 4 in the other. Scale both so b matches. The common multiple of 3 and 4 is 12:

- a:b = 2:3 = 8:12
- b:c = 4:5 = 12:15

So a:b:c = 8:12:15.

> [!TIP]
> To link two ratios through the shared term, multiply each ratio by the OTHER ratio's value of the shared term. Here: a:b × 4 and b:c × 3. That gives 8:12 and 12:15 straight away.

### Worked example 3 (Medium)
The ratio of Anil's savings to Bela's is 3:4, and the ratio of Bela's to Chitra's is 6:5. Together the three have ₹ 3,10,000. How much does Chitra have?

<details><summary>Show solution</summary>

Make Bela's term equal. The two ratios give Bela 4 and 6; the common multiple is 12. Multiply the first ratio by 3 and the second by 2: A:B = 9:12 and B:C = 12:10. So A:B:C = 9:12:10, a total of 31 units.

One unit = 3,10,000 ÷ 31 = 10,000. Chitra = 10 × 10,000 = ₹ 1,00,000.

Check: Anil 90,000, Bela 1,20,000, Chitra 1,00,000. Bela to Chitra is 12:10 = 6:5 ✓.

Trap: Writing A:B:C = 3:4:5 by sticking the first ratio and the second ratio's "5" together without matching Bela's term. That would give 3:4:5 with Chitra at 5/12 of the total, which is wrong.

</details>

> [!NOTE]
> Real GMAT numbers are chosen so totals divide cleanly. If your unit value comes out as an awkward fraction, re-check the matching step before you trust the result.

## Changing ratios: add, remove, or transfer

When items are added or removed, the **actual numbers** change but the **unit k does not**. So set up with k first, apply the change to the real quantities, then use the new ratio as an equation (as in example 2).

Two sub-cases show up often:

1. **Something is added to or removed from only one part.** The total changes. Use the new ratio equation.
2. **Items move from one part to the other.** The total stays the same. It is often easiest to work with the fixed total.

### Worked example 4 (Hard)
Two jars hold juice and water in the ratio 3:1 (jar P) and 2:3 (jar Q). They each hold the same amount of liquid. If both are poured into one container, what fraction of the mixture is juice?

<details><summary>Show solution</summary>

Equal volumes, so pick the same amount for each. Jar P: juice is 3/4. Jar Q: juice is 2/5. Take 20 litres from each (LCM of 4 and 5): P has 15 juice, Q has 8 juice. Total juice = 23 out of 40 litres. Fraction = 23/40.

Check by averaging fractions: (3/4 + 2/5) ÷ 2 = (15/20 + 8/20) ÷ 2 = 23/40. ✓ 

Trap: Adding the ratios 3:1 + 2:3 = 5:4 and answering 5/9. You can only add part-to-part ratios if the totals of the two sources are the same, and here 4 and 5 are not. Convert to part-to-whole fractions first.

</details>

## Direct and inverse proportion

Two quantities are in **direct proportion** when they rise together at a fixed ratio: y/x is constant. If 4 kg of rice costs ₹ 360, then 10 kg costs ₹ 900, because the price per kilo is fixed.

Two quantities are in **inverse proportion** when their product is constant: x × y = k. If 6 workers finish a job in 10 days, the work is 60 worker-days. So 15 workers need 60 ÷ 15 = 4 days. More people, fewer days.

| Relationship | What stays constant | Setup |
|---|---|---|
| Direct | y ÷ x | x₁/y₁ = x₂/y₂ |
| Inverse | x × y | x₁ × y₁ = x₂ × y₂ |

> [!TIP]
> Before calculating, ask: "If one goes up, does the other go up or down?" That one sentence decides direct vs inverse and kills half the wrong answer choices instantly.

> [!TRAP]
> If the answer choices contain both 4 and 25 (say), one of them is the "wrong-direction" answer. Sense-check: if you added workers and the time went up, you used the wrong proportion.

### Worked example 5 (Medium)
A map uses the scale 1 cm : 12 km. Two towns are 7.5 cm apart on the map. A second map of the same region has the scale 1 cm : 30 km. How far apart, in cm, are the towns on the second map?

<details><summary>Show solution</summary>

Real distance = 7.5 × 12 = 90 km. On the second map: 90 ÷ 30 = 3 cm.

Faster way: map length and "km per cm" are inversely related. Bigger km-per-cm means a smaller picture: 7.5 × 12/30 = 3.

Trap: Multiplying 7.5 by 30/12 = 18.75. That moves the wrong way. A map that squeezes more kilometres into each centimetre must make the towns look closer.

</details>

## Scaling recipes

Recipes and "scale up" problems are just direct proportion. If 5 cups of flour make 24 rotis, then 8 cups make 24 × 8/5 = 38.4, so you'd round down to 38 whole rotis. When the answer must be a whole number, think about whether the question wants "at most" or "at least".

Another habit: when a problem scales **one ingredient** and tells you the total, treat it as a ratio problem with units. For a punch of juice : soda : ice = 4 : 3 : 1, a batch with 6 litres of soda has 8 litres of juice and 2 litres of ice.

## Ratios and percents

A ratio of 3:5 means the first is 60% of the second (3/5), and the second is about 166.7% of the first (5/3). A ratio a:b, written as a fraction a/b, is also "a is (a/b × 100)% of b". Percent increases are ratios too: a 25% increase means new : old = 5 : 4.

### Worked example 6 (Hard)
At a school, the ratio of boys to girls is 4:5. After 18 new girls join and 6 boys leave, the ratio becomes 3:4. How many students were there originally?

<details><summary>Show solution</summary>

Boys = 4k, girls = 5k. After changes: boys = 4k − 6, girls = 5k + 18.

(4k − 6)/(5k + 18) = 3/4. Cross-multiply: 16k − 24 = 15k + 54, so k = 78. Originally 9k = 702 students.

Check: boys 312, girls 390. After: 306 and 408. 306/408 = 0.75 = 3/4 ✓.

Method two (backsolve): the answer must be a multiple of 9. Test 702: boys 312 → 306, girls 390 → 408. Ratio 3:4 ✓.

Trap: Forgetting that the ratio of the NEW numbers is what gets 3:4. People set up (4k)/(5k) = 3/4, which is obviously inconsistent. Always apply the change to the actual counts first.

</details>

### Worked example 7 (Hard)
x, y and z are positive. x/y = 2/3 and z/y = 5/6. What is the ratio of (x + z) to (y − x)?

<details><summary>Show solution</summary>

Pick y = 6 (the LCM of the denominators). Then x = 4 and z = 5. So x + z = 9 and y − x = 2, ratio 9:2.

Algebra check: x = 2y/3, z = 5y/6. x + z = 4y/6 + 5y/6 = 9y/6. y − x = y/3 = 2y/6. Ratio = 9y/6 ÷ 2y/6 = 9/2 ✓.

Trap: Using y = 3 for the first ratio and y = 6 for the second, which makes the numbers inconsistent. Pick ONE value of the shared variable.

</details>

> [!SHORTCUT]
> Ratio-only problems can be solved by picking convenient actual numbers (here y = 6). The answer is a ratio, so any consistent choice works.

## Quick check

1. The ratio of cats to dogs is 7:4. What fraction of the animals are dogs?
<details><summary>Answer</summary>

4/11. The whole is 7 + 4 = 11 units.

</details>

2. If a:b = 3:5 and b:c = 10:7, find a:b:c.
<details><summary>Answer</summary>

Match b: 5 and 10 have LCM 10. a:b = 6:10. So a:b:c = 6:10:7.

</details>

3. 12 workers can build a wall in 15 days. How many workers are needed to build it in 9 days?
<details><summary>Answer</summary>

Inverse proportion: 12 × 15 = 180 worker-days. 180 ÷ 9 = 20 workers.

</details>

4. The ratio of A to B is 2:3. After adding 10 to A and nothing to B, the ratio is 1:1. What is B?
<details><summary>Answer</summary>

A = 2k, B = 3k. 2k + 10 = 3k, so k = 10 and B = 30.

</details>

## Key takeaways
- A ratio fixes the shape, never the size. You need one real number (total, difference, or one part) to get real values.
- Write parts as 3k and 2k. Solve for k, then answer exactly the question asked.
- Part-to-part ratio a:b gives a/(a + b) of the whole. Add before you fraction.
- To chain a:b and b:c, scale each so the shared term matches.
- When items are added or removed, apply the change to real counts first, then use the new ratio as an equation.
- Direct proportion keeps y/x fixed; inverse keeps x × y fixed. Always sanity-check the direction.
- When the problem only asks for a ratio, pick convenient numbers for the variables.

## Go deeper
- [Khan Academy: Math](https://www.khanacademy.org/math) — extra practice from the very basics.
- [Khan Academy: Algebra](https://www.khanacademy.org/math/algebra) — for the equation-solving behind ratio problems.
- [GMAT Club forum](https://gmatclub.com/forum/) — search "ratio" for discussion of problem types.
- [Official GMAT exam page](https://www.mba.com/exams/gmat-exam) — the format and question types for the Focus Edition.
