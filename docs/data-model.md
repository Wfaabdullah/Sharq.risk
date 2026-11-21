# SHARQ.RISK synthetic data model

## Source and reproducibility

`src/data/generateDemoDataset.ts` generates the demo entities from a fixed seed (`20251121`). `generateDemoDataset(seed)` is deterministic for a given seed. All entity names, regions, dates, premiums, claims, expenses, treaties, and assets are fictional examples. No company, policyholder, or Saudi market dataset is represented.

The generated portfolio covers January–December 2025, uses four generic regions, and contains three insurance lines: Motor, Health, and Property. Currency is illustrative USD. There is no real-time source, provider provenance, actuarial validation, or external market-data input.

## Entity relationships

- A customer can hold multiple policies. Each policy references one customer and one generic region.
- A policy has one insurance line, product type, policy type, written premium, ceded premium, coverage amount, and a one-year illustrative coverage term.
- A policy may have zero or one generated claim in this demo. Each claim references an existing policy and includes accident, report, and reporting-month fields, status, paid amount, reserve, incurred amount, and an illustrative claim category.
- Motor policies have a vehicle-detail row. Property policies have an insured-property row. Health claims have a corresponding health-treatment detail row. These line-specific tables intentionally do not populate unrelated insurance lines.
- Underwriting expense rows reference an insurance line, region, and month. Reinsurance treaty assumptions are illustrative quota-share percentages per line. Investment asset rows are standalone examples and are not linked to insurance liabilities.

The Data Explorer exposes synthetic records and schema fields. It runs simple checks for duplicate identifiers, missing required identifiers, unmatched customer/policy references, invalid ISO-formatted dates, and claim-balance reconciliation. These checks validate this generated demo dataset only; they are not a production data-quality framework.

## Period and calculation conventions

Monthly dashboard records are derived from the same generated policies, claims, and expenses. Written premium is recognized once in a policy's start month. Earned premium is approximated as one-twelfth of the annual written premium for each in-force month; exact daily earning, cancellations, endorsements, and exposure weighting are not modeled. A policy starting during a month is treated as exposed for that entire month in the monthly approximation.

Net written premium is gross written premium less ceded written premium. Ceded shares are illustrative by line; the simple treaty records do not calculate limits, recoverables, reinstatements, or treaty-layer outcomes.

Incurred claims are paid amounts plus outstanding case reserves. Paid and closed claims have no outstanding reserve in the generated data; open claims have a positive reserve. Claims are assigned to their synthetic reporting month, which is not a development-period valuation series.

Underwriting expense records allocate illustrative monthly commission and administration expense by line and region. A line-specific expense assumption is applied to earned premium with a deterministic monthly seasonality factor. In customer-segment summaries, those same expense-ledger amounts are allocated in proportion to segment earned premium within each line/region/month, so the displayed segment expenses reconcile to the portfolio ledger.

The displayed ratios are computed from aggregated numerator and denominator amounts, rather than averaging row-level ratios:

- **GWP:** sum of gross written premium for policies starting in the selected reporting period.
- **NWP:** GWP less ceded written premium.
- **Earned premium:** monthly in-force premium allocation described above.
- **Claims incurred:** paid claims plus outstanding case reserves.
- **Loss ratio:** claims incurred divided by earned premium.
- **Expense ratio:** allocated underwriting expenses divided by earned premium.
- **Combined ratio:** loss ratio plus expense ratio on the same period and basis.
- **Underwriting result:** earned premium less incurred claims and underwriting expenses.
- **Claim frequency:** reported claim count divided by exposed policy-years.
- **Claim severity / average claim cost:** incurred claims divided by reported claim count.

Zero-denominator ratios fall back to zero in the aggregation helper; in the current generated filters the selected portfolio has positive earned premium. The 80% loss-ratio review threshold is a clearly labeled illustrative prompt, not an industry benchmark, risk score, pricing rule, or automatic decision.

## Limitations and planned work

The dataset has only one reporting-year window. It cannot support prior-year comparisons, accident-year development triangles, IBNR estimates, reserve adequacy testing, or actuarially validated frequency/severity distributions. It has no customer personally identifiable information, real claims history, external policy or market source, documented underwriting authority, or production accounting basis.

Advanced actuarial models, reinsurance recoverable calculations, catastrophe stresses, investment risk, asset-liability matching, document OCR, and downloadable executive reports are not implemented. Their navigation entries are explicitly marked planned; no unsupported result is shown. The application is decision-support demonstration software, not an underwriting approval/rejection system.
