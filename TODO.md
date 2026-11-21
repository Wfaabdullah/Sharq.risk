# SHARQ.RISK — Implementation Outcomes

The Master Design & Product Experience Brief and the GitHub Pages deployment brief are the governing specifications. The statuses below distinguish delivered foundation work from engines that remain intentionally planned.

## 1. Product identity and design system — implemented
- Product name and wordmark are exactly `SHARQ.RISK`; communicate an Insurance Risk Analytics & Intelligence Platform focused on Motor, Health, and Property insurance, with financial risk, investment analytics, and ALM as supporting focus.
- Use the required palette: primary accent `#6C6CF5`, light violet `#E6E7FB`, dark navy `#12121A`, secondary dark `#1A1B26`, white `#FFFFFF`, off-white `#F5F6FA`, light gray `#D1D5DB`, teal `#00D2C6`, pink `#FF8AA5`, royal blue `#2B2D6E`; semantic green/amber/red/gray must communicate documented meaning, not decoration.
- Establish a recognizable, restrained analytical/risk-network brand mark; do not use generic shield imagery, generic stock illustrations, random icons, or excessive gradients, blur, glow, floating 3D, or decorative cards. Glassmorphism must preserve contrast and readability.
- Apply professional English and Arabic UI typography; keep the product calm, intelligent, enterprise-oriented, and analytically clear rather than resembling a generic finance dashboard, banking app, stock terminal, or admin template.

## 2. Application shell and navigation — implemented
- Provide a coherent application shell with wordmark, page title/context, English/Arabic selector, reporting-period selector, visible dataset status, and appropriate controls; do not invent a user identity or avatar.
- Navigation distinguishes primary analytics, supporting tools, and methodology. Include Overview, Insurance Analytics, Claims Intelligence, Underwriting Intelligence, Customer Segmentation, Actuarial Lab, Reinsurance Center, Investment & ALM, Reports & Insights, and Methodology.
- A section that is incomplete must be labeled Planned, In Development, or Demo Module and must not appear functional. Desktop navigation is collapsible; mobile uses an intentional drawer/menu.

## 3. Executive Overview — implemented
- Show GWP, NWP, Earned Premium, Claims Incurred, Loss Ratio, Expense Ratio, Combined Ratio, and Underwriting Result, with metric name, value/unit, reporting period, supported comparisons only, appropriate trends, and accessible metric explanations.
- Include a focused, business-question-led set of charts for premium vs. claims trend, loss ratio by insurance line, regional profitability, claims frequency/severity, product-line performance, and claims status only where implemented and data-backed; avoid crowding and decorative or nonfunctional charts.
- Include a `Portfolio Insights` area that distinguishes calculated findings, statistical signals, hypotheses, and suggested investigations; never present unsupported conclusions or AI-generated explanations as calculated fact.
- Never invent live results. Clearly label synthetic demo values, dataset status, and reporting period; unavailable data is not zero or a successful result.

## 4. Insurance portfolio analytics — partial
- Support multidimensional analysis by insurance line, product, region, policy type, customer segment, reporting period, and underwriting period where available.
- Where supported, show GWP, NWP, earned premium, incurred claims, loss ratio, expense ratio, combined ratio, underwriting result; claim frequency, severity, average claim cost, paid/outstanding/incurred claims, and large losses; regional/product/customer performance, risk concentration, and portfolio composition.
- Provide a logical summary-to-evidence drill-down so unfavorable metrics can be investigated by line, region, policy type, segment, period, and frequency/severity where the data supports it. Do not style a chart as interactive unless it actually responds.

## 5. Claims and underwriting experiences — partial
- Claims Intelligence distinguishes paid, outstanding, and incurred claims; support volume, frequency, severity, average cost, claims trends/development only when sufficient period data exists, insurance-line/region splits, and large-loss analysis only when supported.
- Never label a customer fraudulent from an anomaly. Use neutral investigation wording such as Unusual Pattern, Requires Review, or Investigation Indicator.
- Underwriting Intelligence covers explainable performance, premium adequacy indicators, risk segmentation/drivers, exposure analysis, loss ratio by segment, and historical claims behavior when data supports it. Any flagged segment must explain why and disclose inputs, weighting, assumptions, interpretation, and limitations; this is decision support, not automatic approval or rejection.

## 6. Bilingual English/Arabic experience — implemented; core pages checked in both languages at mobile and tablet widths
- English uses left-to-right layout and consistent financial number formatting. Arabic uses full right-to-left layout, mirrored navigation/layout where appropriate, correctly aligned charts/tables/labels/filters/controls, readable Arabic UI typography, and correct mixed Arabic/English acronyms (GWP, NWP, IBNR, VaR).
- Language switching preserves the current page; translations are centralized, terminology is consistent, Arabic search is supported where feasible, and date/number formatting is appropriate. Test all implemented pages in both languages, not only the homepage.

## 7. Methodology, metrics, and explainability — implemented
- Provide a Methodology section or metric-information panel with each major metric's definition, formula, required data fields, measurement period, interpretation, limitations, and accounting/data basis.
- Explicitly distinguish gross/net, written/earned premium, paid/incurred claims, actual historical values and simulated values. Example formulas: Loss Ratio = Claims Incurred / Earned Premium; Expense Ratio = Underwriting Expenses / Earned Premium; Combined Ratio = Loss Ratio + Expense Ratio.
- Explain metric changes using evidence and underlying data; expose data limitations and assumptions. Do not claim results where calculation logic or required data is absent.

## 8. Visualization, interactions, and accessibility — partial; key data-backed controls smoke-tested
- Charts have clear titles, units, readable axes, consistent legends, useful tooltips, appropriate number formatting, missing-value handling, distinguishable series, responsive behavior, and consistent semantic colors. Avoid excess pie charts, arbitrary percentages, unexplained abbreviations, unlabeled axes, and misleading truncated scales.
- Implement only meaningful filters, date-range/line/region selection, drill-down, and export options backed by data. Controls must be keyboard-accessible, have visible focus and clear states, use semantic structure, and not rely on color alone to indicate risk.
- Include appropriate loading, empty, error, and no-data states where applicable; tables/charts remain understandable to users with accessibility needs.

## 9. Responsive experience — desktop, tablet, and mobile portrait smoke-tested; landscape review remains open
- Support desktop, laptop, tablet, mobile portrait, and mobile landscape without horizontal overflow, overlapping labels, or a compressed desktop layout.
- Mobile reorganizes KPI cards, keeps charts readable, provides touch-friendly controls and intentional navigation, and handles tables with scrolling or a compact alternative while preserving important information and comfortable spacing.

## 10. Data integrity, future modules, and repository handoff — partial
- Synthetic data is fixed-seed, fictional, and clearly distinguished from uploaded data; no live insurer or Saudi market results are implied.
- A browser-local, one-file aggregate portfolio workflow supports CSV and `.xlsx` (first sheet), mapping, preview, selected row-level quality checks, explicit activation, supported analytics, and CSV/XLSX transformed-row export. Unsupported measures remain unavailable; reports and scenario requirements are checked before output.
- Incomplete: multi-file related datasets for policies, claims, customers, expenses, reinsurance, investments, and Motor/Health/Property detail; classification; named isolated dataset management; upload dates/persistent dataset inventory; cross-file relationship validation; claim-level upload analysis; and customer segmentation from uploads. Do not claim referential integrity or multi-company isolation beyond separate, non-persisted browser sessions.
- The reference library offers context only and does not validate formulas, code, outputs, or regulatory compliance. Actuarial/reserving, reinsurance, catastrophe, investment/ALM, document extraction, and other unimplemented tools remain explicitly unavailable/planned.
- Preserve the existing repository and visual identity. Provide accurate limitations, run instructions, and only verified test/deployment claims.

## 11. GitHub Pages and continuous preview — pending live verification for the current changes
- Inspect the existing GitHub repository and configure GitHub Pages. Build the initial working version and deploy it to GitHub Pages as soon as the basic application is ready; provide the actual public GitHub Pages URL once deployment succeeds.
- After every meaningful development milestone, commit and push changes to the connected repository, trigger a new GitHub Pages deployment, and ensure the live website reflects the latest committed version. Milestones include application structure/identity, dashboard/navigation, data foundation, core analytics, claims/underwriting, additional modules, bilingual/responsive improvements, and final testing/refinements.
- Configure GitHub Pages under the repository's actual project subpath; fix routing and asset-path issues. Use GitHub Actions if appropriate. Do not expose secrets or private data, and do not rely on a backend/local server for essential frontend functionality.
- Keep the live site functional; test the production deployment, not only local builds. Investigate a failed deployment rather than claiming success. Clearly distinguish completed, partial, and planned features.
- Final delivery provides the public Pages URL, repository URL, successful deployment confirmation, latest changes, and known limitations.
