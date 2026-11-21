# SHARQ.RISK data model and calculation conventions

## Synthetic demonstration portfolio

`src/data/generateDemoDataset.ts` generates demo entities from fixed seed `20251121`; `generateDemoDataset(seed)` is deterministic for a given seed. Entity names, regions, dates, premiums, claims, expenses, treaties, and assets are fictional. No company, policyholder, or Saudi market dataset is represented.

The generated portfolio covers January–December 2025, four generic regions, and Motor, Health, and Property insurance lines. Currency is illustrative USD. There is no live source, provider provenance, actuarial validation, or external market-data input.

## Synthetic entity relationships

- A customer can hold multiple policies; each policy references one customer and region.
- A policy has an insurance line, product/policy type, written and ceded premium, coverage amount, and an illustrative one-year term.
- A policy may have zero or one generated claim. A claim references a policy and has accident/reporting fields, status, paid amount, reserve, incurred amount, and illustrative category.
- Motor policies have vehicle detail; Property policies have insured-property detail; Health claims have treatment detail. These line-specific tables intentionally do not populate unrelated insurance lines.
- Expenses reference line, region, and month. Reinsurance treaties use illustrative quota-share percentages. Investment assets are standalone and are not matched to insurance liabilities.

The synthetic Data Explorer checks duplicate identifiers, missing required identifiers, unmatched customer/policy references, invalid ISO dates, and claim balance reconciliation. These checks apply only to this generated dataset and are not a production data-quality framework.

## Period and calculation conventions

Monthly demo records derive from the same generated policies, claims, and expenses. Written premium is recognized in a policy's start month. Earned premium is approximated as one-twelfth of annual written premium for each in-force month; daily earning, cancellations, endorsements, and weighted exposure are not modeled. A policy starting during a month is treated as exposed for that full month.

Net written premium is gross written premium less ceded written premium. Ceded shares are illustrative; limits, recoverables, reinstatements, and treaty-layer outcomes are not calculated. Incurred claims equal paid claims plus outstanding case reserves. The reporting month is not a development-period valuation series. Expense records allocate illustrative commission and administration costs by line, region, and month.

Displayed ratios are calculated from aggregated numerators and denominators, not averages of row ratios:

- **GWP:** sum of gross written premium for policies starting in the selected reporting period.
- **NWP:** GWP less ceded written premium.
- **Earned premium:** monthly in-force premium approximation described above.
- **Claims incurred:** paid claims plus outstanding case reserves.
- **Loss ratio:** incurred claims divided by earned premium.
- **Expense ratio:** underwriting expenses divided by earned premium.
- **Combined ratio:** loss ratio plus expense ratio on the same period and basis.
- **Underwriting result:** earned premium less incurred claims and underwriting expenses.
- **Claim frequency:** reported claim count divided by exposed policy-years.
- **Claim severity:** incurred claims divided by reported claim count.

The demo aggregation helper returns zero for zero-denominator ratios; selected synthetic filters have positive earned premium. The 80% loss-ratio review threshold is an illustrative prompt, not an industry benchmark, risk score, pricing rule, or automatic decision.

## User-uploaded aggregate portfolio file

The Data Workspace accepts one `.csv` or `.xlsx` file (first worksheet only; maximum 15 MB) per import session. Legacy `.xls`, multiple worksheets, multi-file joins, and server upload are not supported. Parsing and calculations occur in the browser; no uploaded file is transmitted to SHARQ.RISK servers or persisted by the application. Upload processing can be activated explicitly after review; before activation, demo results remain active. The source rows are shown read-only and are not modified.

Required mapped fields are insurance line, reporting period, earned premium, and incurred claims. Optional mapped fields are an identifier, region, GWP, ceded premium, paid claims, outstanding reserves, underwriting expenses, claim count, and exposure units. Optional KPIs are available only when their inputs are mapped and valid; absent fields must not be interpreted as zero. GWP/NWP availability depends on mapped inputs; frequency requires both reported claim counts and exposure. Paid and outstanding amounts are independently available; the claims-position chart needs both.

Mappings are suggested only for unique exact alias matches; ambiguous matches are left unmapped for user selection. Supported checks include required mapping, missing/unparseable required values, unrecognized line/region/date, duplicate mapped identifiers, negative mapped numeric amounts, non-integer claim counts, non-positive exposure, ceded written premium greater than gross written premium, and paid-plus-outstanding reconciliation to incurred within USD 0.02. Invalid rows and duplicate rows remain in the source preview and are excluded only from calculations. Without a mapped identifier, duplicate records cannot be reliably detected.

Dates are reduced to calendar month for the current chart model. A single-year upload is labeled by year; uploads with multiple calendar years suppress month-of-year trend charts to prevent cross-year aggregation. The app does not retain full dates in the normalized `DemoRecord` calculation model.

This path accepts aggregate portfolio rows; it does not implement separate policy, claim, customer, expense, reinsurance, investment, or Motor/Health/Property detail dataset classification, multi-file storage, isolated named datasets, cross-file customer/policy/claim relationships, referential-integrity checks, claim-level analysis, or customer segmentation from uploads. It also does not infer liability beyond the source's own mapping or perform currency conversion, accounting reconciliation beyond the specified row check, actuarial validation, or compliance review. These gaps are not represented as completed functionality.

## Limitations

The synthetic dataset contains one reporting-year window and cannot support prior-year comparisons, accident-year development triangles, IBNR estimates, reserve adequacy testing, or validated frequency/severity distributions. There is no real customer PII, real claims history, external policy source, documented underwriting authority, or production accounting basis. Advanced actuarial models, reinsurance recoverable calculations, catastrophe stresses, investment risk, asset-liability matching, document OCR, and claim-level analysis of uploaded files remain unavailable or planned. SHARQ.RISK is demonstration decision-support software, not an underwriting approval/rejection system.
