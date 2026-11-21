# SHARQ.RISK

SHARQ.RISK is a bilingual (English/Arabic) insurance risk analytics portfolio application. It demonstrates an insurance-focused interface and transparent calculations using a deterministic synthetic dataset. It is not connected to an insurer, a live data source, or a backend service.

## Run locally

Requirements: Node.js 22 or newer and pnpm 11.25.0.

```bash
pnpm install
pnpm dev
```

The Vite development server prints its local address. Useful checks are:

```bash
pnpm typecheck
pnpm test
pnpm build
```

`pnpm build` creates the normal root-hosted static site in `dist/`.

## Application areas

The working demo includes an Executive Overview with portfolio KPIs, trends, calculated evidence, line/region/period filters, and a summary CSV export; Insurance Analytics with a line-level table and chart drill-in; Claims Intelligence with volume, frequency, severity, paid/outstanding/incurred figures, trends, and a largest-claims list; Underwriting Intelligence with transparent review thresholds; Customer Segmentation with exposure, claim-share, frequency, severity, loss ratio, and result; a Dataset Explorer with schema previews and basic quality checks; and a Methodology page with formulas, inputs, interpretation, and limitations.

Actuarial modeling, catastrophe scenarios, reinsurance calculations, Investment & ALM, financial-document extraction, and report generation are deliberately marked as planned. They do not return simulated analytical results or imply completed engines.

## Synthetic data and methodology

The generator uses a fixed seed to create fictional customers, policies, claims, line-specific exposure records, monthly underwriting expenses, illustrative quota-share assumptions, and investment assets. Details of the model and its limitations are in [`docs/data-model.md`](docs/data-model.md).

All money is illustrative USD. Values are not Saudi market data or actual results from any insurer. Loss ratio is incurred claims divided by earned premium; expense ratio is underwriting expenses divided by earned premium; combined ratio is their sum; underwriting result is earned premium less incurred claims and expenses. Paid claims plus outstanding reserves reconcile to incurred claims. Claim frequency is reported claims divided by exposed policy-years. These are demonstration definitions, not actuarially validated production metrics or accounting advice.

## GitHub Pages

The Pages-specific build uses the repository subpath `/Sharq.risk/` and can be produced with:

```bash
pnpm build:pages
```

The `.github/workflows/deploy-pages.yml` workflow builds and deploys the static site after pushes to `main` or `feat/sharq-risk-foundation`, and supports manual dispatch. It runs typecheck, tests, and the Pages build before uploading the artifact. The published URL is `https://wfaabdullah.github.io/Sharq.risk/` once GitHub Pages is enabled for this repository and its deployment succeeds.

The project-site URL follows GitHub's `owner.github.io/repository` convention. The workflow uses GitHub Actions as the publishing source, following the [official Pages publishing-source guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [custom workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Technical stack

React 18, TypeScript, Vite, Recharts, Lucide, and Vitest. The application is a static client-side frontend; it currently has no authentication, backend, persistent user data, external API keys, or real-time ingestion.
