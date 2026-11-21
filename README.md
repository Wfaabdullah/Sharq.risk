# SHARQ.RISK

SHARQ.RISK is a bilingual (English/Arabic) insurance analytics demonstration with a fixed-seed synthetic portfolio, browser-local aggregate-file analysis, transparent hypothetical claims stress calculations, KPI methodology, professional reference context, and report exports. It is not connected to an insurer, live source, or backend service, and its synthetic portfolio does not represent the Saudi market.

## Run locally

Requirements: Node.js 22 or newer and pnpm 11.25.0.

```bash
pnpm install
pnpm dev
```

Useful checks:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm build:pages
```

`pnpm build` creates the root-hosted static site in `dist/`. `pnpm build:pages` builds for GitHub Pages at `/Sharq.risk/`.

## Product areas

- **Executive Overview and Insurance Analytics:** portfolio totals, supported ratios, trends, line/region summaries, filters, evidence notes, and CSV export.
- **Data Workspace:** upload one aggregate portfolio CSV or `.xlsx` (first worksheet only; max 15 MB), preview original rows, map columns, validate supported fields, inspect findings, activate valid rows, and export transformed valid rows as CSV/XLSX. Files are parsed in the browser and are not sent to SHARQ.RISK servers. Activation is explicit; missing measures remain unavailable.
- **Scenario Lab:** hypothetical aggregate claims arithmetic, `incurred × (1 + frequency change) × (1 + severity change)`, with earned premium and expenses held fixed. This is not a forecast, probability estimate, solvency assessment, or actuarial model.
- **Reports & exports:** active-dataset reports can be downloaded as CSV or XLSX; browser print-to-PDF includes context, period, identity/status, results, definitions, assumptions, limitations, and generation date. Unsupported report types are disabled by empty results.
- **Methodology and References:** bilingual formula/field/period/interpretation/limitation notes linked to official and professional sources. The sources give context only and do not validate application formulas, code, outputs, or regulatory compliance.

## Upload scope and limitations

The importer supports a single aggregate portfolio file with insurance line, period, earned premium, and incurred claims as required fields; optional columns enable GWP, ceded premium/NWP, paid and outstanding amounts, expenses, claim count, exposure, and region analysis. It accepts CSV and `.xlsx` only. Legacy `.xls`, macros, multi-sheet joins, multi-file datasets, persistent dataset management, and any upload to a server are not implemented. Multiple calendar years are accepted but month-of-year trend charts are suppressed to avoid mixing years.

The upload path does not classify or join separate policies, claims, customers, expenses, reinsurance, investments, Motor/Health/Property detail files, and does not check cross-file referential integrity or provide claim-level/customer-segment analysis. These requirements remain incomplete. Invalid rows remain visible in the original preview and are excluded only from the calculated view; duplicate detection needs a mapped identifier. Validation is limited to implemented row-level checks and is not an accounting, actuarial, regulatory, or underwriting audit.

## Synthetic data and calculations

The demo generator uses fixed seed `20251121` and creates fictional customers, policies, claims, line-specific examples, expenses, reinsurance assumptions, and investment assets. See [`docs/data-model.md`](docs/data-model.md). Money is illustrative USD. The dashboard does not represent a real company or Saudi market results. Ratios use aggregated amounts; simplified earning and exposure conventions are not production accounting or actuarial methods. Zero-denominator handling and other application conventions are documented, not validated by the reference library.

Actuarial reserving, IBNR, catastrophe modeling, treaty/reinsurance outcomes, investment risk/ALM, document extraction, and claim-level uploaded-data analysis remain unavailable or marked planned.

## GitHub Pages

The Pages workflow at `.github/workflows/deploy-pages.yml` runs typecheck, tests, and `pnpm build:pages` after pushes to `main` or `feat/sharq-risk-foundation`, then deploys the static artifact. The public URL is `https://wfaabdullah.github.io/Sharq.risk/`; a code push alone does not prove deployment success, so verify the Actions run and public site after changes.

## Stack

React 18, TypeScript, Vite, Recharts, Lucide, SheetJS, and Vitest. The application is a client-side static frontend with no authentication, backend, persistent user data, or real-time ingestion.
