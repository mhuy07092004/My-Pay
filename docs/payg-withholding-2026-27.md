# PAYG Withholding Calculation Spec — 2026-27 (Australia)

This document describes how to **estimate the tax an employer withholds from a pay (PAYG withholding)**, using the ATO's official formulas. It contains only the rules, formulas, tables and worked examples. Implement it in whatever language the project uses.

- Applies to payments made **on or after 1 July 2026** (income year 2026-27).
- Sources (ato.gov.au, published 17 June 2026):
  - Schedule 1, Statement of formulas for calculating amounts to be withheld (NAT 1004): https://www.ato.gov.au/tax-rates-and-codes/payg-withholding-schedule-1-statement-of-formulas-for-calculating-amounts-to-be-withheld
  - Schedule 8, Study and training support loans component (NAT 3539): https://www.ato.gov.au/tax-rates-and-codes/schedule-8-statement-of-formulas-for-calculating-study-and-training-support-loans-components
  - Official sample data to test against: https://www.ato.gov.au/tax-rates-and-codes/payg-withholding-schedule-1-statement-of-formulas-for-calculating-amounts-to-be-withheld/sample-data
- The method below was checked against the ATO's official sample data (720 of 720 weekly, fortnightly and monthly values matched) and all ATO worked examples.

Withholding is **not** the final tax. It is only what is taken out of each pay. In the UI, label it "estimated tax withheld".

---

## 1. The basic idea

The ATO does not publish one giant lookup table for the formulas. It publishes a straight-line formula per earnings range:

```
y = a × x − b
```

- **x** = the **weekly-equivalent earnings, as whole dollars plus $0.99**. Example: weekly earnings of $477.00 to $477.99 all give x = 477.99.
- **a** and **b** = coefficients that depend on the **scale** (section 2) and on which range x falls in (section 3).
- **y** = the weekly tax to withhold.

Fortnightly, monthly and quarterly pays are first converted to a weekly equivalent, run through the weekly formula, and the answer is converted back (section 4).

### Choosing the row

Each table row says "x less than N". Use the **first row** whose limit is greater than x. Since x always ends in .99, this is the same as comparing the whole-dollar weekly earnings to N: earnings of $361 use the row "less than 362", earnings of $362 use the next row.

### Rounding (important, the most common source of error)

- Round the final weekly result **to the nearest whole dollar; exactly 50 cents rounds up**.
- Round **once**, from the exact value of `a × x − b`. Never round to cents first.
- Use exact decimal or integer arithmetic (for example work in cents). Binary floating point can turn an exact .50 into .4999 and give a result $1 too low.
- If a computed result is below 0, use 0.

## 2. Choosing the scale

| Scale | Use when | Notes |
|---|---|---|
| 1 | Resident, **tax-free threshold NOT claimed** | Typical for a second job |
| 2 | Resident, **tax-free threshold claimed** | Most common. Includes Medicare levy. Allows tax offsets and Medicare levy adjustment |
| 3 | **Foreign resident** | No tax-free threshold, no Medicare levy |
| 4 | Payee gave **no TFN** | Flat rate, no coefficients (section 3) |
| 5 | **Full** Medicare levy exemption | From a Medicare levy variation declaration. Allows tax offsets |
| 6 | **Half** Medicare levy exemption | From a Medicare levy variation declaration. Allows tax offsets and Medicare levy adjustment |

Rules:
- Scales 1, 2, 3, 5, 6 require the payee to have given a TFN.
- Tax offsets are only allowed for scales 2, 5, 6.
- Medicare levy adjustment is only allowed for scales 2 and 6.
- Scales 1 and 2 apply whether or not the payee has leave loading.
- Default for a typical resident employee with one job: **scale 2**.

## 3. Coefficient tables (2026-27)

### Scale 1: tax-free threshold not claimed

| x less than | a | b |
|---|---|---|
| 188 | 0.1500 | 0.1500 |
| 371 | 0.2084 | 11.0185 |
| 515 | 0.1790 | 0.1066 |
| 932 | 0.3227 | 74.1674 |
| 2,246 | 0.3200 | 71.6508 |
| 3,303 | 0.3900 | 228.8816 |
| 3,303 and over | 0.4700 | 493.1893 |

### Scale 2: tax-free threshold claimed

| x less than | a | b |
|---|---|---|
| 362 | y = 0 (no tax) | |
| 538 | 0.1500 | 54.3462 |
| 673 | 0.2500 | 108.2135 |
| 721 | 0.1700 | 54.3473 |
| 865 | 0.1790 | 60.8377 |
| 1,282 | 0.3227 | 185.1935 |
| 2,596 | 0.3200 | 181.7319 |
| 3,653 | 0.3900 | 363.4627 |
| 3,653 and over | 0.4700 | 655.7704 |

### Scale 3: foreign residents

| x less than | a | b |
|---|---|---|
| 2,596 | 0.3000 | 0.3000 |
| 3,653 | 0.3700 | 181.7308 |
| 3,653 and over | 0.4500 | 474.0385 |

### Scale 4: no TFN

No coefficients. Rate is **47%** for a resident, **45%** for a foreign resident. Take the pay amount, drop the cents, multiply by the rate, drop the cents of the result. No weekly conversion: apply it to the pay amount directly, whatever the pay cycle.

### Scale 5: full Medicare levy exemption

| x less than | a | b |
|---|---|---|
| 362 | y = 0 (no tax) | |
| 721 | 0.1500 | 54.3462 |
| 865 | 0.1590 | 60.8365 |
| 1,282 | 0.3027 | 185.1923 |
| 2,596 | 0.3000 | 181.7308 |
| 3,653 | 0.3700 | 363.4615 |
| 3,653 and over | 0.4500 | 655.7692 |

### Scale 6: half Medicare levy exemption

| x less than | a | b |
|---|---|---|
| 362 | y = 0 (no tax) | |
| 721 | 0.1500 | 54.3462 |
| 865 | 0.1590 | 60.8365 |
| 908 | 0.3027 | 185.1923 |
| 1,135 | 0.3527 | 230.6135 |
| 1,282 | 0.3127 | 185.1923 |
| 2,596 | 0.3100 | 181.7308 |
| 3,653 | 0.3800 | 363.4615 |
| 3,653 and over | 0.4600 | 655.7692 |

## 4. Working out x for each pay cycle

**earnings** = the gross pay for the period **plus any allowances subject to withholding** (taxable allowances, bonuses and commissions are included).

| Pay cycle | Weekly-equivalent whole dollars | Convert the rounded weekly tax `w` back to the cycle |
|---|---|---|
| Weekly | earnings, drop cents | w |
| Fortnightly | earnings ÷ 2, drop cents | w × 2 |
| Monthly | (earnings × 3) ÷ 13, drop cents. **First, if earnings end in exactly 33 cents, add 1 cent** | w × 13 ÷ 3, round to nearest dollar |
| Quarterly | earnings ÷ 13, drop cents | w × 13 |
| Bi-monthly | Add the payments of the month, treat as monthly | monthly result ÷ 2 |

Then x = weekly-equivalent whole dollars + 0.99.

**Daily or casual workers** (ATO table NAT 1024; the payee must have claimed the tax-free threshold, so scale 2):
1. Drop the cents of the day's earnings, multiply by 5, add 0.99. This is x.
2. Apply the scale 2 formula, round to the nearest dollar.
3. Divide by 5, round to the nearest dollar. This is the withholding for the day.

## 5. Order of calculation (every pay cycle except scale 4 and daily)

1. Work out **x** (section 4).
2. Compute the weekly tax `y = a × x − b` from the scale table. If the payee has a study and training support loan (section 7), add the loan term to `y` **before** rounding.
3. Round to a whole dollar. Call this `w`.
4. Convert `w` to the pay cycle (section 4 right column).
5. Subtract **tax offsets** (section 6) if the scale allows.
6. Subtract the **Medicare levy adjustment** (section 6) if the scale allows and it applies.
7. If the result is below 0, use 0.

## 6. Tax offsets and Medicare levy adjustment

### Tax offsets (scales 2, 5, 6 only)

The payee writes a total annual tax offset amount on the Withholding declaration. Reduce the pay-cycle withholding by a percentage of that annual amount, rounded to the nearest dollar:

| Pay cycle | Percentage of annual offset amount |
|---|---|
| Weekly | 1.9% |
| Fortnightly | 3.8% |
| Monthly | 8.3% |
| Quarterly | 25% |

### Medicare levy adjustment (scales 2 and 6 only, optional feature)

Applies only if the payee lodged a Medicare levy variation declaration for a spouse and/or dependent children with a low family income. If the app does not collect this, skip it. Compute a **weekly levy adjustment (WLA)**, round it to the nearest dollar, convert it to the pay cycle exactly like the withholding (fortnightly ×2, monthly ×13÷3 rounded, quarterly ×13) and subtract it.

Parameters:

| Parameter | Scale 2 | Scale 6 |
|---|---|---|
| Lower threshold (weekly earnings) | 538 | 908 |
| Shade-in threshold | 673 | 1,135 |
| Levy-adjustment factor | 538.67 | 908.42 |
| Shade-in slope | 0.10 | 0.05 |
| Medicare levy rate | 0.02 | 0.01 |
| Shade-out rate | 0.08 | 0.04 |

Derived values (from the number of dependent children, `n`, at question 12 of the declaration; `n = 0` if only a spouse):
- **WFT** (weekly family threshold) = (47,238 + 4,338 × n) ÷ 52, rounded to the nearest cent. For n = 0 this is 908.42.
- **SOP** (shading-out point) = WFT × 0.1 ÷ 0.08, drop the cents.

WLA by weekly earnings x:
- Weekly earnings (whole dollars) below the lower threshold → WLA = 0.
- x below the shade-in threshold → WLA = (x − factor) × slope.
- x from the shade-in threshold up to (not including) WFT → WLA = x × levy rate.
- x from WFT up to (not including) SOP → WLA = WFT × levy rate − (x − WFT) × shade-out rate.
- x at or above SOP → WLA = 0.

## 7. Study and training support loans (HELP, VSL, Financial Supplement, SSL, AASL)

Since 2025-26 loan repayments are **marginal**. The repayment is a second straight-line formula, `y = a × x − b`, using the **same x**, and it is **added to the weekly tax before rounding** (step 2 in section 5).

It applies when **all** of these are true: the payee gave a TFN, answered yes to having a study or training loan debt, and has **not** claimed a Medicare levy reduction for a spouse/dependants (section 6 family adjustment). It also applies to bonuses, commissions and taxable allowances, but **not** to lump-sum termination payments. Scale 4 (no TFN) never includes it.

**Table A**: use for scales 2, 3, 5, 6 (tax-free threshold claimed, or foreign resident)

| x less than | a | b |
|---|---|---|
| 1,337 | 0.00 | 0.0000 |
| 2,494 | 0.15 | 200.5615 |
| 3,577 | 0.17 | 250.4527 |
| 3,577 and over | 0.10 | 0.0000 |

**Table B**: use for scale 1 (tax-free threshold not claimed)

| x less than | a | b |
|---|---|---|
| 987 | 0.00 | 0.0000 |
| 2,144 | 0.15 | 148.0615 |
| 2,727 | 0.17 | 190.9527 |
| 2,727 and over | 0.10 | 0.0000 |

The ATO also publishes pre-combined coefficient tables (tax + loan summed). Adding the two formulas before rounding, as described here, gives the same result. If the tax and the loan term were each rounded separately, the total can occasionally differ by $1; the ATO accepts either.

## 8. Worked examples (all from the ATO unless marked)

**A. Weekly, scale 2, with loan.** Weekly earnings $2,608.36 and tax-free threshold claimed.
- x = 2,608.99
- Tax row "less than 3,653": 0.39 × 2,608.99 − 363.4627 = 654.04
- Loan component (table A, row "less than 3,577"): 0.17 × 2,608.99 − 250.4527 = 193.0756, which rounds to **$193** on its own (ATO example)
- Total before rounding = 847.12, so **withhold $847** (derived by adding the ATO's two formulas; the loan part alone is the ATO figure)

**B. Fortnightly, scale 5, with offsets.** Earnings $1,299.30 fortnightly, full Medicare exemption, annual offsets claimed $1,645.
- Weekly equivalent = 1,299.30 ÷ 2 = 649.65, drop cents = 649, so x = 649.99
- y = 0.1500 × 649.99 − 54.3462 = 43.15, rounds to 43
- Fortnightly = 43 × 2 = 86
- Offset = 3.8% × 1,645 = 62.51, rounds to 63
- **Withhold 86 − 63 = $23**

**C. Monthly, scale 2, with offsets.** Earnings $5,400.33 monthly, annual offsets $1,365.
- Ends in 33 cents, so use 5,400.34. × 3 ÷ 13 = 1,246.23, drop cents = 1,246, so x = 1,246.99
- y = 0.3227 × 1,246.99 − 185.1935 = 217.21, rounds to 217
- Monthly = 217 × 13 ÷ 3 = 940.33, rounds to 940
- Offset = 8.3% × 1,365 = 113.295, rounds to 113
- **Withhold 940 − 113 = $827**

**D. Weekly, scale 2, Medicare levy adjustment.** Earnings $1,333.45 weekly, 5 children.
- x = 1,333.99. Tax = 0.3200 × 1,333.99 − 181.7319 = 245.14, rounds to 245
- WFT = (47,238 + 4,338 × 5) ÷ 52 = 1,325.54. SOP = 1,325.54 × 0.1 ÷ 0.08 = 1,656.9, drop cents = 1,656
- x is between WFT and SOP: WLA = 1,325.54 × 0.02 − (1,333.99 − 1,325.54) × 0.08 = 25.83, rounds to 26
- **Withhold 245 − 26 = $219**

**E. Fortnightly Medicare adjustment.** Earnings $2,026.77 fortnightly, scale 2, 1 child.
- Weekly equivalent 1,013.39 → x = 1,013.99. WFT = 991.85, SOP = 1,239
- WLA = 991.85 × 0.02 − (1,013.99 − 991.85) × 0.08 = 18.07, rounds to 18
- Fortnightly adjustment = 18 × 2 = **$36**

**F. Loan, monthly, scale 1.** Earnings $10,627.88 monthly, tax-free threshold not claimed.
- × 3 ÷ 13 = 2,452.59, drop cents = 2,452, so x = 2,452.99
- Loan (table B, row "less than 2,727") = 0.17 × 2,452.99 − 190.9527 = 226.06, rounds to 226
- Monthly = 226 × 13 ÷ 3 = 979.33, rounds to **$979**

**G. No TFN.** Weekly pay $1,000.99, resident: drop cents → 1,000 × 47% = **$470**.

## 9. Test values (from the ATO sample data)

Expected withholding in whole dollars, no offsets, no loan.

### Weekly

| Earnings | Scale 1 | Scale 2 | Scale 3 | Scale 5 | Scale 6 |
|---|---|---|---|---|---|
| 116 | 17 | 0 | 35 | 0 | 0 |
| 362 | 65 | 0 | 109 | 0 | 0 |
| 370 | 66 | 1 | 111 | 1 | 1 |
| 538 | 100 | 27 | 161 | 27 | 27 |
| 672 | 143 | 60 | 202 | 47 | 47 |
| 931 | 227 | 116 | 279 | 97 | 98 |
| 1,135 | 292 | 181 | 340 | 159 | 170 |
| 1,845 | 519 | 409 | 553 | 372 | 391 |
| 2,246 | 647 | 537 | 674 | 492 | 515 |
| 2,596 | 784 | 649 | 779 | 597 | 623 |
| 3,303 | 1,060 | 925 | 1,041 | 859 | 892 |
| 3,653 | 1,224 | 1,062 | 1,170 | 989 | 1,025 |

### Fortnightly

| Earnings | Scale 1 | Scale 2 | Scale 3 | Scale 5 | Scale 6 |
|---|---|---|---|---|---|
| 232 | 34 | 0 | 70 | 0 | 0 |
| 740 | 132 | 2 | 222 | 2 | 2 |
| 1,344 | 286 | 120 | 404 | 94 | 94 |
| 2,268 | 584 | 362 | 680 | 316 | 340 |
| 4,238 | 1,214 | 994 | 1,272 | 908 | 950 |
| 7,304 | 2,448 | 2,122 | 2,340 | 1,976 | 2,050 |

### Monthly

| Earnings | Scale 1 | Scale 2 | Scale 3 | Scale 5 | Scale 6 |
|---|---|---|---|---|---|
| 502.67 | 74 | 0 | 152 | 0 | 0 |
| 810.33 | 121 | 0 | 243 | 0 | 0 |
| 1,603.33 | 286 | 4 | 481 | 4 | 4 |
| 4,034.33 | 984 | 503 | 1,209 | 420 | 425 |
| 9,732.67 | 2,804 | 2,327 | 2,921 | 2,132 | 2,232 |
| 15,829.67 | 5,304 | 4,602 | 5,070 | 4,286 | 4,442 |

Also: weekly $1,000 on scale 2 gives **$138**, which matches an independent third-party calculator. The full ATO sample data is at the sample-data link in the header and is worth turning into a complete regression test.

## 10. Notes for the app

1. **Pick the table by payment date, not work date.** A pay dated 1 July 2026 or later uses these 2026-27 numbers even if it covers June work.
2. **Keep the coefficients as data, not hardcoded in the calculation.** Store each year's tables with an effective-from date, and choose by payment date. The ATO changes them every 1 July, so a new year then means adding one data entry and no code change.
3. **These numbers are for 2026-27 only.** For older years use the ATO's previous-years tax tables page. Do not reuse earlier coefficients for pays after 1 July 2026, because the tables were reissued.
4. **Per-user settings to collect once**: tax-free threshold claimed or not, resident or foreign resident, TFN given or not, study/training loan yes or no, optional annual tax offsets, optional Medicare levy family variation.
5. **Gross pay** should include taxable allowances. Employer super is paid on top and is not part of withholding.
6. **Show whole dollars.** Net pay = gross pay − withholding (the loan repayment is already inside the withholding when the loan setting is on).
7. **Yearly checklist (each June)**: open the ATO tax tables overview, read "Important information", update the coefficient tables, and re-run the ATO sample data as a test.

## 11. Not covered

- **Working holiday makers** have different rates (ATO Schedule 15).
- Special schedules: seniors and pensioners (9), horticulture and shearing (2), actors and entertainers (3), back pay/bonus special rates (5), unused leave and termination payments (7, 11), superannuation payments (12, 13), voluntary agreements (10).
- The ATO notes the formula results can differ slightly from the printed tax tables when weekly earnings exceed about $3,400 or fortnightly earnings exceed about $6,800. **Either method is accepted.**
- Years with 53 weekly pays or 27 fortnightly pays: the schedule assumes 52 or 26. A payee worried about a shortfall can ask for extra withholding per pay:

  | Weekly earnings | Extra per pay (53 pays) | Fortnightly earnings | Extra per pay (27 pays) |
  |---|---|---|---|
  | 875 to 2,574 | $3 | 1,700 to 5,199 | $12 |
  | 2,575 to 3,649 | $7 | 5,200 to 7,249 | $27 |
  | 3,650 and over | $12 | 7,250 and over | $48 |

- This is an estimate of employer withholding, not tax advice. The real tax is settled when a tax return is lodged.
