import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, BookOpen, BriefcaseBusiness, Building2, ChartNoAxesCombined,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardList, CloudLightning, Database, Download, FileChartColumnIncreasing,
  FileText, Gauge, Globe2, Layers3, Menu, Network, PanelLeftClose, PanelLeftOpen, Search, ShieldAlert, Sparkles,
  X,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, Pie, PieChart,
  LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { aggregate, byClaimPosition, byLine, byMonth, byRegion, dataCatalog, demoDataset, demoRecords, filterRecords, getDatasetTable, segmentSummary, type Line as InsuranceLine, type Region } from './data/demo';
import { messages, t, type Language, type MessageKey } from './i18n';
import BrandMark from './components/BrandMark';

type PageKey = 'overview' | 'analytics' | 'claimsPage' | 'underwriting' | 'segmentation' | 'actuarial' | 'reinsurance' | 'catastrophe' | 'investment' | 'dataExplorer' | 'documents' | 'reports' | 'methodologyPage';
type FilterLine = InsuranceLine | 'all';
type FilterRegion = Region | 'all';
type MetricKey = 'gwp' | 'nwp' | 'earned' | 'incurred' | 'lossRatio' | 'expenseRatio' | 'combinedRatio' | 'underwritingResult';

const pageMeta: Record<PageKey, { title: MessageKey; description: MessageKey; planned?: boolean }> = {
  overview: { title: 'overviewTitle', description: 'overviewSub' },
  analytics: { title: 'analyticsTitle', description: 'analyticsSub' },
  claimsPage: { title: 'claimsTitle', description: 'claimsSub' },
  underwriting: { title: 'underwritingTitle', description: 'underwritingSub' },
  segmentation: { title: 'segmentationTitle', description: 'segmentationSub' },
  actuarial: { title: 'actuarial', description: 'plannedBody', planned: true },
  reinsurance: { title: 'reinsurance', description: 'plannedBody', planned: true },
  catastrophe: { title: 'catastrophe', description: 'catastropheSub', planned: true },
  investment: { title: 'investment', description: 'plannedBody', planned: true },
  dataExplorer: { title: 'dataExplorerTitle', description: 'dataExplorerSub' },
  documents: { title: 'documents', description: 'documentsSub', planned: true },
  reports: { title: 'reports', description: 'plannedBody', planned: true },
  methodologyPage: { title: 'methodologyTitle', description: 'methodologySub' },
};

const navGroups: { title: MessageKey; items: { key: PageKey; label: MessageKey; icon: typeof Gauge }[] }[] = [
  { title: 'portfolio', items: [{ key: 'overview', label: 'overview', icon: Gauge }, { key: 'analytics', label: 'analytics', icon: ChartNoAxesCombined }] },
  { title: 'analysis', items: [{ key: 'claimsPage', label: 'claimsNav', icon: ClipboardList }, { key: 'underwriting', label: 'underwriting', icon: BriefcaseBusiness }, { key: 'segmentation', label: 'segmentation', icon: Layers3 }] },
  { title: 'tools', items: [{ key: 'actuarial', label: 'actuarial', icon: Activity }, { key: 'reinsurance', label: 'reinsurance', icon: Network }, { key: 'catastrophe', label: 'catastrophe', icon: CloudLightning }, { key: 'investment', label: 'investment', icon: Building2 }, { key: 'dataExplorer', label: 'dataExplorer', icon: Database }, { key: 'documents', label: 'documents', icon: FileText }, { key: 'reports', label: 'reports', icon: FileChartColumnIncreasing }, { key: 'methodologyPage', label: 'methodology', icon: BookOpen }] },
];

const lineColors: Record<InsuranceLine, string> = { Motor: '#6C6CF5', Health: '#00AFA6', Property: '#2B2D6E' };
const statusColor = (value: number) => value > 0.8 ? 'critical' : value >= 0.65 ? 'watch' : 'positive';

function lineLabel(language: Language, line: InsuranceLine) {
  return t(language, line.toLowerCase() as 'motor' | 'health' | 'property');
}
function regionLabel(language: Language, region: Region) {
  const idx = (['North', 'Central', 'West', 'South'] as Region[]).indexOf(region);
  return messages[language].regions[idx];
}
function monthLabel(language: Language, month: number) { return messages[language].months[month]; }
function claimStatusLabel(language: Language, status: string) {
  const keys: Record<string, MessageKey> = { Paid: 'claimPaid', Open: 'claimOpen', Closed: 'claimClosed' };
  return keys[status] ? t(language, keys[status]) : status;
}
function claimCategoryLabel(language: Language, category: string) {
  const keys: Record<string, MessageKey> = {
    'Collision repair': 'catMotorCollision', 'Glass damage': 'catMotorGlass', 'Third-party liability': 'catMotorLiability',
    'Outpatient care': 'catHealthOutpatient', Diagnostics: 'catHealthDiagnostics', 'Inpatient care': 'catHealthInpatient', Pharmacy: 'catHealthPharmacy',
    'Water damage': 'catPropertyWater', Fire: 'catPropertyFire', 'Weather event': 'catPropertyWeather', Theft: 'catPropertyTheft',
  };
  return keys[category] ? t(language, keys[category]) : category;
}
function locale(language: Language) { return language === 'ar' ? 'ar-SA' : 'en-US'; }
function money(language: Language, value: number, compact = true) {
  return new Intl.NumberFormat(locale(language), { style: 'currency', currency: 'USD', notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 1 : 0 }).format(value);
}
function percent(language: Language, value: number) {
  return new Intl.NumberFormat(locale(language), { style: 'percent', maximumFractionDigits: 1 }).format(value);
}
function millions(language: Language, value: number) {
  return new Intl.NumberFormat(locale(language), { maximumFractionDigits: 1 }).format(value);
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <span className="sparkline-empty" />;
  const min = Math.min(...values); const max = Math.max(...values); const span = max - min || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${25 - ((value - min) / span) * 20}`).join(' ');
  return <svg className="sparkline" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ChartFrame({ title, subtitle, children, action }: { title: string; subtitle: string; children: ReactNode; action?: ReactNode }) {
  return <section className="panel chart-panel"><div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div><div className="chart-content">{children}</div></section>;
}

function EmptyChart({ language }: { language: Language }) {
  return <div className="empty-state"><span className="empty-mark"><Search size={17} /></span><span>{t(language, 'noData')}</span></div>;
}

function MetricCard({ metric, value, period, trend, language, onInfo }: { metric: MetricKey; value: number; period: string; trend: number[]; language: Language; onInfo: (key: MetricKey) => void }) {
  const ratio = metric === 'lossRatio' || metric === 'expenseRatio' || metric === 'combinedRatio';
  const isResult = metric === 'underwritingResult';
  const valueText = ratio ? percent(language, value) : money(language, value);
  const color = metric === 'lossRatio' || metric === 'combinedRatio' ? (metric === 'combinedRatio' ? (value > 1 ? '#D15463' : '#16856E') : (statusColor(value) === 'critical' ? '#D15463' : statusColor(value) === 'watch' ? '#B47A1B' : '#16856E')) : '#6C6CF5';
  const trendValues = trend.length ? trend : [0, 0];
  return <article className="metric-card glass-card">
    <div className="metric-top"><span className="metric-name">{t(language, metric)}</span><button className="icon-button metric-info" type="button" aria-label={`${t(language, 'info')}: ${t(language, metric)}`} title={t(language, 'info')} onClick={() => onInfo(metric)}><CircleHelp size={15} /></button></div>
    <div className="metric-value" dir="auto">{isResult && value < 0 ? `−${money(language, Math.abs(value))}` : valueText}</div>
    <div className="metric-bottom"><span>{period}</span><Sparkline values={trendValues} color={color} /></div>
  </article>;
}

function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [page, setPage] = useState<PageKey>('overview');
  const [lineFilter, setLineFilter] = useState<FilterLine>('all');
  const [regionFilter, setRegionFilter] = useState<FilterRegion>('all');
  const [range, setRange] = useState(12);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [metricOpen, setMetricOpen] = useState<MetricKey | null>(null);
  const [exported, setExported] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState('policies');
  const [datasetSearch, setDatasetSearch] = useState('');

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.title = `${t(language, pageMeta[page].title)} — SHARQ.RISK`;
  }, [language, page]);

  const allFiltered = useMemo(() => filterRecords(demoRecords, range, lineFilter, regionFilter), [range, lineFilter, regionFilter]);
  const metrics = useMemo(() => aggregate(allFiltered), [allFiltered]);
  const monthTrend = useMemo(() => byMonth(allFiltered), [allFiltered]);
  const compareLines = useMemo(() => byLine(filterRecords(demoRecords, range, 'all', regionFilter)), [range, regionFilter]);
  const compareRegions = useMemo(() => byRegion(filterRecords(demoRecords, range, lineFilter, 'all')), [range, lineFilter]);
  const claimPosition = useMemo(() => byClaimPosition(allFiltered), [allFiltered]);
  const segmentRows = useMemo(() => segmentSummary(range, lineFilter, regionFilter), [range, lineFilter, regionFilter]);
  const selectedMonths = useMemo(() => new Set(Array.from({ length: range }, (_, index) => 12 - range + index)), [range]);
  const policyById = useMemo(() => new Map(demoDataset.policies.map((policy) => [policy.policyId, policy])), []);
  const selectedClaims = useMemo(() => demoDataset.claims.filter((claim) => { const policy = policyById.get(claim.policyId); return selectedMonths.has(claim.reportingMonth) && policy && (lineFilter === 'all' || policy.productLine === lineFilter) && (regionFilter === 'all' || policy.regionId === `R-${regionFilter.toUpperCase()}`); }), [policyById, selectedMonths, lineFilter, regionFilter]);
  const selectedDatasetRows = getDatasetTable(selectedDataset) as Record<string, unknown>[];
  const selectedDatasetFields = selectedDatasetRows[0] ? Object.keys(selectedDatasetRows[0]) : [];
  const datasetLabelKeys: Record<string, MessageKey> = { policies: 'catalogPolicies', customers: 'catalogCustomers', claims: 'catalogClaims', vehicles: 'catalogVehicles', properties: 'catalogProperties', healthClaims: 'catalogHealth', expenses: 'catalogExpenses', reinsuranceTreaties: 'catalogReinsurance', investments: 'catalogInvestments' };
  const visibleCatalog = dataCatalog.map((entry) => ({ ...entry, localizedLabel: t(language, datasetLabelKeys[entry.key]) })).filter((entry) => `${entry.localizedLabel} ${entry.key} ${entry.fields.join(' ')}`.toLowerCase().includes(datasetSearch.toLowerCase()));
  const datasetChecks = useMemo(() => {
    const policyIds = new Set(demoDataset.policies.map((row) => row.policyId));
    const customerIds = new Set(demoDataset.customers.map((row) => row.customerId));
    const uniquePolicies = new Set(demoDataset.policies.map((row) => row.policyId));
    const uniqueCustomers = new Set(demoDataset.customers.map((row) => row.customerId));
    const uniqueClaims = new Set(demoDataset.claims.map((row) => row.claimId));
    const duplicates = demoDataset.policies.length - uniquePolicies.size + demoDataset.customers.length - uniqueCustomers.size + demoDataset.claims.length - uniqueClaims.size;
    const missing = demoDataset.policies.filter((row) => !row.policyId || !row.customerId || !row.regionId).length + demoDataset.customers.filter((row) => !row.customerId || !row.regionId).length + demoDataset.claims.filter((row) => !row.claimId || !row.policyId).length;
    const unmatched = demoDataset.claims.filter((row) => !policyIds.has(row.policyId)).length + demoDataset.policies.filter((row) => !customerIds.has(row.customerId)).length;
    const dates = [...demoDataset.policies.flatMap((row) => [row.policyStartDate, row.policyEndDate]), ...demoDataset.customers.map((row) => row.relationshipStartDate), ...demoDataset.claims.flatMap((row) => [row.claimDate, row.accidentDate, row.reportingDate]), ...demoDataset.healthClaims.flatMap((row) => [row.serviceDate, row.reportingDate])];
    const invalidDates = dates.filter((value) => Number.isNaN(Date.parse(value))).length;
    const balanceIssues = demoDataset.claims.filter((row) => Math.abs(row.incurredAmount - row.paidAmount - row.outstandingReserve) > 0.02).length;
    const requiredIdentifierCount = demoDataset.policies.length * 3 + demoDataset.customers.length * 2 + demoDataset.claims.length * 2;
    const completeness = requiredIdentifierCount ? 1 - missing / requiredIdentifierCount : 0;
    return { duplicates, missing, unmatched, invalidDates, balanceIssues, completeness };
  }, []);
  const periodText = `${monthLabel(language, 12 - range)}–${monthLabel(language, 11)} 2025`;
  const topLine = [...compareLines].sort((a, b) => b.lossRatio - a.lossRatio)[0];
  const pageInfo = pageMeta[page];
  const topSegment = [...segmentRows].sort((a, b) => b.lossRatio - a.lossRatio)[0];

  const metricTrends: Record<MetricKey, number[]> = {
    gwp: monthTrend.map((m) => m.gwp),
    nwp: monthTrend.map((m) => m.nwp),
    earned: monthTrend.map((m) => m.earned),
    incurred: monthTrend.map((m) => m.incurred),
    lossRatio: monthTrend.map((m) => allFiltered.filter((r) => r.month === m.month).reduce((s, r) => s + r.incurred, 0) / Math.max(1, allFiltered.filter((r) => r.month === m.month).reduce((s, r) => s + r.earned, 0))),
    expenseRatio: monthTrend.map((m) => allFiltered.filter((r) => r.month === m.month).reduce((s, r) => s + r.expenses, 0) / Math.max(1, allFiltered.filter((r) => r.month === m.month).reduce((s, r) => s + r.earned, 0))),
    combinedRatio: monthTrend.map((m) => { const rows = allFiltered.filter((r) => r.month === m.month); const x = aggregate(rows); return x.combinedRatio; }),
    underwritingResult: monthTrend.map((m) => m.underwritingResult),
  };

  const switchPage = (key: PageKey) => { setPage(key); setMobileOpen(false); };
  const downloadCsv = () => {
    const rows = byLine(allFiltered);
    const header = ['insurance_line', 'GWP_USD', 'earned_premium_USD', 'incurred_claims_USD', 'loss_ratio', 'expense_ratio', 'combined_ratio', 'underwriting_result_USD'];
    const body = rows.map((row) => [row.line, row.gwp.toFixed(2), row.earned.toFixed(2), row.incurred.toFixed(2), row.lossRatio.toFixed(4), row.expenseRatio.toFixed(4), row.combinedRatio.toFixed(4), row.underwritingResult.toFixed(2)].join(','));
    const csv = `# Synthetic demo dataset; illustrative USD; period ${periodText}\n${header.join(',')}\n${body.join('\n')}`;
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'sharq-risk-synthetic-portfolio.csv'; link.click(); URL.revokeObjectURL(url);
    setExported(true); window.setTimeout(() => setExported(false), 2200);
  };

  const nav = <>
    <div className="brand-row"><BrandMark /><div className="brand-wordmark"><strong>SHARQ<span>.</span>RISK</strong><small>{t(language, 'brandTagline')}</small></div>{collapsed && <span className="brand-dot">SR</span>}</div>
    <div className="nav-scroll">{navGroups.map((group) => <div className="nav-group" key={group.title}>
      <div className="nav-group-label">{t(language, group.title)}</div>
      {group.items.map(({ key, label, icon: Icon }) => {
        const active = page === key; const planned = pageMeta[key].planned;
        return <button className={`nav-item ${active ? 'active' : ''}`} key={key} type="button" onClick={() => switchPage(key)} title={collapsed ? t(language, label) : undefined} aria-current={active ? 'page' : undefined}>
          <Icon size={18} strokeWidth={1.8} /><span className="nav-label">{t(language, label)}</span>{planned && !collapsed && <span className="planned-dot" aria-label={t(language, 'planned')}>·</span>}
        </button>;
      })}</div>)}</div>
    <div className="sidebar-foot"><div className="source-mark"><span className="source-pulse"/><div><strong>{t(language, 'synthetic')}</strong><small>{t(language, 'statusNoConnection')}</small></div></div><div className="sidebar-version">SHARQ.RISK <span>·</span> DEMO 0.1</div></div>
  </>;

  const filters = <div className="filter-row">
    <label className="select-wrap"><span className="sr-only">{t(language, 'period')}</span><select value={range} onChange={(e) => setRange(Number(e.target.value))}><option value={12}>{t(language, 'last12')}</option><option value={6}>{t(language, 'last6')}</option><option value={3}>{t(language, 'last3')}</option></select><ChevronDown size={14}/></label>
    <label className="select-wrap"><span className="sr-only">{t(language, 'line')}</span><select value={lineFilter} onChange={(e) => setLineFilter(e.target.value as FilterLine)}><option value="all">{t(language, 'allLines')}</option><option value="Motor">{t(language, 'motor')}</option><option value="Health">{t(language, 'health')}</option><option value="Property">{t(language, 'property')}</option></select><ChevronDown size={14}/></label>
    <label className="select-wrap region-select"><span className="sr-only">{t(language, 'region')}</span><select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value as FilterRegion)}><option value="all">{t(language, 'allRegions')}</option>{(['North', 'Central', 'West', 'South'] as Region[]).map((r) => <option key={r} value={r}>{regionLabel(language, r)}</option>)}</select><ChevronDown size={14}/></label>
  </div>;

  const chartTooltip = (value: number | string, name: string) => [typeof value === 'number' ? `${millions(language, value)} ${t(language, 'usd')} M` : value, name];

  const lossChart = (compact = false) => <ChartFrame title={t(language, 'lossByLine')} subtitle={t(language, 'lossByLineSub')}>
    {compareLines.length ? <ResponsiveContainer width="100%" height={compact ? 236 : 280}><BarChart data={compareLines} margin={{ top: 8, right: 8, left: -12, bottom: 2 }} accessibilityLayer>
      <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#E9EAF1"/><XAxis dataKey="line" tickFormatter={(v) => lineLabel(language, v as InsuranceLine)} tickLine={false} axisLine={false} tick={{ fill: '#7E8394', fontSize: 11 }}/><YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} domain={[0, 'dataMax + 0.15']} tickLine={false} axisLine={false} tick={{ fill: '#7E8394', fontSize: 11 }} width={42}/><Tooltip formatter={(v) => [percent(language, Number(v)), t(language, 'lossRatio')]} labelFormatter={(v) => lineLabel(language, v as InsuranceLine)} contentStyle={{ border: '1px solid #E7E8F0', borderRadius: 12, boxShadow: '0 12px 30px #18182a14', fontFamily: 'inherit' }}/><Bar dataKey="lossRatio" radius={[7, 7, 2, 2]} barSize={42} cursor="pointer" onClick={(entry: any) => { if (entry?.line) setLineFilter(entry.line); switchPage('analytics'); }}>
        {compareLines.map((entry) => <Cell key={entry.line} fill={lineColors[entry.line]} />)}
      </Bar>
    </BarChart></ResponsiveContainer> : <EmptyChart language={language} />}
  </ChartFrame>;

  const premiumChart = <ChartFrame title={t(language, 'premiumClaims')} subtitle={t(language, 'premiumClaimsSub')}><ResponsiveContainer width="100%" height={260}><AreaChart data={monthTrend.map((m) => ({ ...m, label: monthLabel(language, m.month) }))} margin={{ top: 8, right: 6, left: -12, bottom: 0 }} accessibilityLayer>
    <defs><linearGradient id="earnedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6C6CF5" stopOpacity={0.18}/><stop offset="100%" stopColor="#6C6CF5" stopOpacity={0}/></linearGradient><linearGradient id="incurredFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00D2C6" stopOpacity={0.13}/><stop offset="100%" stopColor="#00D2C6" stopOpacity={0}/></linearGradient></defs>
    <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#E9EAF1"/><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#7E8394', fontSize: 11 }}/><YAxis tickFormatter={(v) => millions(language, v)} tickLine={false} axisLine={false} tick={{ fill: '#7E8394', fontSize: 11 }} width={40}/><Tooltip formatter={(v, name) => chartTooltip(Number(v), name === 'earned' ? t(language, 'earned') : t(language, 'incurred'))} labelFormatter={(label) => `${t(language, 'periodLabel')}: ${label}`} contentStyle={{ border: '1px solid #E7E8F0', borderRadius: 12, boxShadow: '0 12px 30px #18182a14', fontFamily: 'inherit' }}/><Legend iconType="circle" iconSize={7} formatter={(v) => v === 'earned' ? t(language, 'earned') : t(language, 'incurred')} wrapperStyle={{ fontSize: 11, color: '#626778', paddingTop: 8 }}/><Area type="monotone" dataKey="earned" stroke="#6C6CF5" strokeWidth={2.5} fill="url(#earnedFill)"/><Area type="monotone" dataKey="incurred" stroke="#00AFA6" strokeWidth={2.5} fill="url(#incurredFill)"/>
  </AreaChart></ResponsiveContainer></ChartFrame>;

  const regionChart = <ChartFrame title={t(language, 'regionalResult')} subtitle={t(language, 'regionalResultSub')}><ResponsiveContainer width="100%" height={260}><BarChart data={compareRegions.map((r) => ({ ...r, label: regionLabel(language, r.region), result: r.underwritingResult / 1_000_000 }))} margin={{ top: 6, right: 8, left: -6, bottom: 0 }} layout="vertical" accessibilityLayer>
    <CartesianGrid strokeDasharray="3 5" horizontal={false} stroke="#E9EAF1"/><XAxis type="number" tickFormatter={(v) => millions(language, v)} tickLine={false} axisLine={false} tick={{ fill: '#7E8394', fontSize: 10 }}/><YAxis dataKey="label" type="category" width={68} tickLine={false} axisLine={false} tick={{ fill: '#626778', fontSize: 11 }}/><Tooltip formatter={(v) => chartTooltip(Number(v), t(language, 'underwritingResult'))} contentStyle={{ border: '1px solid #E7E8F0', borderRadius: 12, boxShadow: '0 12px 30px #18182a14', fontFamily: 'inherit' }}/><Bar dataKey="result" fill="#2B2D6E" radius={[0, 6, 6, 0]} barSize={22}/>
  </BarChart></ResponsiveContainer></ChartFrame>;

  const statusChart = <ChartFrame title={t(language, 'claimsStatus')} subtitle={t(language, 'claimsStatusSub')}><div className="donut-wrap"><ResponsiveContainer width="100%" height={196}><PieChart accessibilityLayer><Pie data={claimPosition} dataKey="value" nameKey="name" innerRadius={59} outerRadius={82} paddingAngle={3} stroke="none"><Cell fill="#6C6CF5"/><Cell fill="#00D2C6"/></Pie><Tooltip formatter={(v) => chartTooltip(Number(v), '')} contentStyle={{ border: '1px solid #E7E8F0', borderRadius: 12, boxShadow: '0 12px 30px #18182a14', fontFamily: 'inherit' }}/></PieChart></ResponsiveContainer><div className="donut-center"><span>{t(language, 'incurred')}</span><strong>{money(language, metrics.incurred)}</strong></div></div><div className="chart-legend"><span><i style={{ background: '#6C6CF5' }}/>{t(language, 'paid')}<strong>{money(language, metrics.paid)}</strong></span><span><i style={{ background: '#00D2C6' }}/>{t(language, 'outstanding')}<strong>{money(language, metrics.outstanding)}</strong></span></div></ChartFrame>;

  const metricKeys: MetricKey[] = ['gwp', 'nwp', 'earned', 'incurred', 'lossRatio', 'expenseRatio', 'combinedRatio', 'underwritingResult'];
  const displayValue = (metric: MetricKey) => {
    if (metric === 'gwp') return metrics.gwp;
    if (metric === 'nwp') return metrics.nwp;
    if (metric === 'earned') return metrics.earned;
    if (metric === 'incurred') return metrics.incurred;
    if (metric === 'lossRatio') return metrics.lossRatio;
    if (metric === 'expenseRatio') return metrics.expenseRatio;
    if (metric === 'combinedRatio') return metrics.combinedRatio;
    return metrics.underwritingResult;
  };

  const portfolioTable = <div className="table-scroll"><table><thead><tr><th>{t(language, 'tableLine')}</th><th>{t(language, 'tableGwp')}</th><th>{t(language, 'tableEarned')}</th><th>{t(language, 'tableIncurred')}</th><th>{t(language, 'tableLoss')}</th><th>{t(language, 'tableExpense')}</th><th>{t(language, 'tableCombined')}</th><th>{t(language, 'tableResult')}</th></tr></thead><tbody>{compareLines.map((row) => <tr key={row.line} className={lineFilter === row.line ? 'selected-row' : ''}><td><span className="line-cell"><i style={{ background: lineColors[row.line] }}/>{lineLabel(language, row.line)}</span></td><td>{money(language, row.gwp)}</td><td>{money(language, row.earned)}</td><td>{money(language, row.incurred)}</td><td><span className={`status-text ${statusColor(row.lossRatio)}`}>{percent(language, row.lossRatio)}</span></td><td>{percent(language, row.expenseRatio)}</td><td>{percent(language, row.combinedRatio)}</td><td>{money(language, row.underwritingResult)}</td></tr>)}</tbody></table></div>;

  const claimsLineData = compareLines.map((row) => ({ ...row, label: lineLabel(language, row.line), frequencyPerThousand: row.frequency * 1000, severityK: row.severity / 1000 }));
  const claimsTrend = <ChartFrame title={t(language, 'claimsTrend')} subtitle={t(language, 'claimsStatusSub')}><ResponsiveContainer width="100%" height={260}><AreaChart data={monthTrend.map((m) => ({ ...m, label: monthLabel(language, m.month) }))} margin={{ top: 8, right: 6, left: -12, bottom: 0 }} accessibilityLayer><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#E9EAF1"/><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#7E8394', fontSize: 11 }}/><YAxis tickFormatter={(v) => millions(language, v)} tickLine={false} axisLine={false} tick={{ fill: '#7E8394', fontSize: 11 }} width={40}/><Tooltip formatter={(v) => chartTooltip(Number(v), t(language, 'incurred'))} contentStyle={{ border: '1px solid #E7E8F0', borderRadius: 12, fontFamily: 'inherit' }}/><Area dataKey="incurred" stroke="#6C6CF5" strokeWidth={2.5} fill="#E6E7FB"/></AreaChart></ResponsiveContainer></ChartFrame>;

  const frequencySeverityChart = <ChartFrame title={t(language, 'frequencySeverity')} subtitle={`${t(language, 'frequency')} · ${t(language, 'severity')}`}><ResponsiveContainer width="100%" height={260}><BarChart data={claimsLineData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} accessibilityLayer><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#E9EAF1"/><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#7E8394', fontSize: 11 }}/><YAxis yAxisId="left" tickFormatter={(v) => `${millions(language, v)}`} tickLine={false} axisLine={false} tick={{ fill: '#7E8394', fontSize: 10 }} width={38}/><YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${v}k`} tickLine={false} axisLine={false} tick={{ fill: '#7E8394', fontSize: 10 }} width={38}/><Tooltip formatter={(v, name) => name === 'frequencyPerThousand' ? [`${millions(language, Number(v))} / 1k`, t(language, 'frequency')] : [`$${millions(language, Number(v))}k`, t(language, 'severity')]} contentStyle={{ border: '1px solid #E7E8F0', borderRadius: 12, fontFamily: 'inherit' }}/><Legend iconType="circle" iconSize={7} formatter={(v) => v === 'frequencyPerThousand' ? `${t(language, 'frequency')} / 1k` : t(language, 'severity')} wrapperStyle={{ fontSize: 11, color: '#626778', paddingTop: 8 }}/><Bar yAxisId="left" dataKey="frequencyPerThousand" fill="#6C6CF5" radius={[6, 6, 0, 0]} barSize={28}/><Line yAxisId="right" dataKey="severityK" type="monotone" stroke="#E17591" strokeWidth={2.3} dot={{ r: 3 }}/></BarChart></ResponsiveContainer></ChartFrame>;

  const segmentChartData = segmentRows.map((row) => ({ ...row, label: t(language, row.segment.toLowerCase() as 'retail' | 'sme' | 'corporate') }));
  const segmentExposureChart = <ChartFrame title={t(language, 'segmentExposure')} subtitle={t(language, 'noRiskScore')}><ResponsiveContainer width="100%" height={245}><BarChart data={segmentChartData} margin={{ top: 10, right: 8, left: -8, bottom: 0 }} accessibilityLayer><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#E9EAF1"/><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#7E8394', fontSize: 11 }}/><YAxis tickFormatter={(v) => `${Math.round(v)}%`} tickLine={false} axisLine={false} tick={{ fill: '#7E8394', fontSize: 10 }} width={38}/><Tooltip formatter={(v) => [`${millions(language, Number(v))}%`, t(language, 'exposureShare')]} contentStyle={{ border: '1px solid #E7E8F0', borderRadius: 12, fontFamily: 'inherit' }}/><Bar dataKey={(row: any) => row.exposureShare * 100} name={t(language, 'exposureShare')} fill="#6C6CF5" radius={[7, 7, 2, 2]} barSize={40}/></BarChart></ResponsiveContainer></ChartFrame>;
  const segmentLossChart = <ChartFrame title={t(language, 'segmentLoss')} subtitle={t(language, 'reviewRule')}><ResponsiveContainer width="100%" height={245}><BarChart data={segmentChartData} margin={{ top: 10, right: 8, left: -8, bottom: 0 }} accessibilityLayer><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#E9EAF1"/><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#7E8394', fontSize: 11 }}/><YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} domain={[0, 'dataMax + 0.15']} tickLine={false} axisLine={false} tick={{ fill: '#7E8394', fontSize: 10 }} width={42}/><Tooltip formatter={(v) => [percent(language, Number(v)), t(language, 'lossRatio')]} contentStyle={{ border: '1px solid #E7E8F0', borderRadius: 12, fontFamily: 'inherit' }}/><Bar dataKey="lossRatio" name={t(language, 'lossRatio')} radius={[7, 7, 2, 2]} barSize={40}>{segmentChartData.map((row, index) => <Cell key={row.segment} fill={['#6C6CF5', '#00AFA6', '#2B2D6E'][index]} />)}</Bar></BarChart></ResponsiveContainer></ChartFrame>;
  const compositionChart = <ChartFrame title={t(language, 'portfolioMix')} subtitle={t(language, 'gwp')}><ResponsiveContainer width="100%" height={245}><PieChart accessibilityLayer><Pie data={compareLines.map((row) => ({ label: lineLabel(language, row.line), value: row.gwp }))} dataKey="value" nameKey="label" innerRadius={53} outerRadius={82} paddingAngle={3} stroke="none">{compareLines.map((row) => <Cell key={row.line} fill={lineColors[row.line]} />)}</Pie><Tooltip formatter={(v) => [money(language, Number(v)), t(language, 'gwp')]} contentStyle={{ border: '1px solid #E7E8F0', borderRadius: 12, fontFamily: 'inherit' }}/><Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, color: '#626778' }}/></PieChart></ResponsiveContainer></ChartFrame>;
  const underwritingTrendChart = <ChartFrame title={t(language, 'resultTrend')} subtitle={t(language, 'underwritingResult')}><ResponsiveContainer width="100%" height={245}><LineChart data={monthTrend.map((row) => ({ ...row, label: monthLabel(language, row.month) }))} margin={{ top: 10, right: 8, left: -8, bottom: 0 }} accessibilityLayer><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#E9EAF1"/><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#7E8394', fontSize: 10 }}/><YAxis tickFormatter={(v) => millions(language, v)} tickLine={false} axisLine={false} tick={{ fill: '#7E8394', fontSize: 10 }} width={38}/><Tooltip formatter={(v) => [`${millions(language, Number(v))} ${t(language, 'usd')} M`, t(language, 'underwritingResult')]} contentStyle={{ border: '1px solid #E7E8F0', borderRadius: 12, fontFamily: 'inherit' }}/><Line dataKey="underwritingResult" type="monotone" stroke="#2B2D6E" strokeWidth={2.5} dot={{ r: 3, fill: '#2B2D6E' }}/></LineChart></ResponsiveContainer></ChartFrame>;
  const topClaims = [...selectedClaims].sort((a, b) => b.incurredAmount - a.incurredAmount).slice(0, 5);
  const selectedCatalog = dataCatalog.find((item) => item.key === selectedDataset);
  const methods: { key: MetricKey; formula: MessageKey; fields: MessageKey; interpretation: MessageKey }[] = [
    { key: 'gwp', formula: 'mGwpFormula', fields: 'mGwpFields', interpretation: 'mGwpInterpretation' },
    { key: 'nwp', formula: 'mNwpFormula', fields: 'mNwpFields', interpretation: 'mNwpInterpretation' },
    { key: 'earned', formula: 'mEarnedFormula', fields: 'mEarnedFields', interpretation: 'mEarnedInterpretation' },
    { key: 'incurred', formula: 'mIncurredFormula', fields: 'mIncurredFields', interpretation: 'mIncurredInterpretation' },
    { key: 'lossRatio', formula: 'mLossFormula', fields: 'mLossFields', interpretation: 'mLossInterpretation' },
    { key: 'expenseRatio', formula: 'mExpenseFormula', fields: 'mExpenseFields', interpretation: 'mExpenseInterpretation' },
    { key: 'combinedRatio', formula: 'mCombinedFormula', fields: 'mCombinedFields', interpretation: 'mCombinedInterpretation' },
    { key: 'underwritingResult', formula: 'mResultFormula', fields: 'mResultFields', interpretation: 'mResultInterpretation' },
  ];
  const metricDefinition = (metric: MetricKey) => metric === 'lossRatio' ? t(language, 'lrDefinition') : metric === 'expenseRatio' ? t(language, 'erDefinition') : metric === 'combinedRatio' ? t(language, 'crDefinition') : metric === 'underwritingResult' ? t(language, 'resultDefinition') : metric === 'nwp' ? t(language, 'nwpDefinition') : t(language, 'methodologyNote');

  return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} aria-label={t(language, 'overview')}>
      {nav}
      <button className="mobile-close icon-button" type="button" aria-label={t(language, 'navClose')} onClick={() => setMobileOpen(false)}><X size={19}/></button>
    </aside>
    {mobileOpen && <button className="mobile-scrim" type="button" aria-label={t(language, 'navClose')} onClick={() => setMobileOpen(false)} />}
    <main className="main-area">
      <header className="topbar">
        <div className="topbar-leading"><button className="icon-button mobile-menu-button" type="button" aria-label={t(language, 'navOpen')} onClick={() => setMobileOpen(true)}><Menu size={20}/></button><button className="icon-button collapse-button" type="button" aria-label={collapsed ? t(language, 'expand') : t(language, 'collapse')} onClick={() => setCollapsed((v) => !v)}>{collapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}</button><div className="breadcrumb"><span>SHARQ.RISK</span><ChevronRight size={13}/><strong>{t(language, pageMeta[page].title)}</strong></div></div>
        <div className="topbar-actions"><div className="data-status"><span className="status-indicator"/><span>{t(language, 'synthetic')}</span></div><div className="language-toggle" role="group" aria-label={t(language, 'languageLabel')}><button type="button" className={language === 'en' ? 'selected' : ''} onClick={() => setLanguage('en')}>EN</button><span/><button type="button" className={language === 'ar' ? 'selected' : ''} onClick={() => setLanguage('ar')}>ع</button></div></div>
      </header>
      <div className="content-area">
        <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>{t(language, 'productEyebrow')}</div><h1>{t(language, pageInfo.title)}</h1><p>{t(language, pageInfo.description)}</p></div><div className="heading-right"><div className="period-chip"><span>{t(language, 'period')}</span><strong>{periodText}</strong></div><Globe2 className="heading-globe" size={22}/></div></div>
        {pageInfo.planned ? <section className="planned-page panel"><div className="planned-icon"><Layers3 size={24}/></div><span className="status-badge neutral">{t(language, 'planned')}</span><h2>{t(language, 'plannedTitle')}</h2><p>{t(language, 'plannedBody')}</p><div className="planned-meta"><ShieldAlert size={15}/>{t(language, 'plannedMeta')}</div></section> : <>
          <div className="toolbar"><div className="filter-row-label"><span className="filter-dot"/>{t(language, 'currentSelection')}</div>{filters}<button className={`button button-secondary export-button ${exported ? 'exported' : ''}`} type="button" onClick={downloadCsv}><Download size={15}/>{exported ? t(language, 'exportDone') : t(language, 'exportCsv')}</button></div>
          {page === 'overview' && <>
            <section className="metric-grid" aria-label={t(language, 'keyMeasures')}>{metricKeys.map((key) => <MetricCard key={key} metric={key} value={displayValue(key)} period={periodText} trend={metricTrends[key]} language={language} onInfo={setMetricOpen}/>)}</section>
            <div className="charts-grid charts-top">{premiumChart}{lossChart(true)}</div>
            <div className="charts-grid charts-bottom">{regionChart}{statusChart}</div>
            <div className="charts-grid charts-bottom">{compositionChart}{underwritingTrendChart}</div>
            <section className="insight-panel"><div className="insight-icon"><Sparkles size={18}/></div><div className="insight-main"><div className="insight-title-row"><h2>{t(language, 'portfolioInsights')}</h2><span className="status-badge calculated">{t(language, 'calculated')}</span></div><p className="insight-lead">{t(language, 'highestLoss')}: <strong>{lineLabel(language, topLine.line)} · {percent(language, topLine.lossRatio)}</strong></p><div className="insight-evidence"><span>{t(language, 'support')}</span><strong>{money(language, topLine.incurred)} {t(language, 'incurred').toLocaleLowerCase(language === 'ar' ? 'ar' : 'en')} / {money(language, topLine.earned)} {t(language, 'earned').toLocaleLowerCase(language === 'ar' ? 'ar' : 'en')}</strong><i>·</i><span>{periodText}</span></div><div className="insight-note"><ArrowDownRight size={14}/>{t(language, 'reviewAction')}: {t(language, 'reviewCopy')}</div></div><div className="insight-side"><span>{t(language, 'illustrative')}</span><p>{t(language, 'noInference')}</p></div></section>
          </>}
          {page === 'analytics' && <><div className="charts-grid charts-top">{lossChart()}{regionChart}</div><section className="panel table-panel"><div className="panel-heading"><div><h2>{t(language, 'linePerformance')}</h2><p>{t(language, 'currentSelection')} · {periodText}</p></div><button className="button button-secondary" type="button" onClick={downloadCsv}><Download size={15}/>{exported ? t(language, 'exportDone') : t(language, 'exportCsv')}</button></div>{portfolioTable}</section><div className="method-note"><CircleHelp size={15}/><span>{t(language, 'noInference')}</span><button type="button" onClick={() => switchPage('methodologyPage')}>{t(language, 'methodology')} <ChevronLeft size={13}/></button></div></>}
          {page === 'claimsPage' && <><section className="metric-grid claims-metrics"><article className="metric-card glass-card"><div className="metric-top"><span className="metric-name">{t(language, 'claimCount')}</span><CircleHelp size={15}/></div><div className="metric-value">{new Intl.NumberFormat(locale(language)).format(metrics.claims)}</div><div className="metric-bottom"><span>{t(language, 'periodLabel')}</span><Activity size={16} className="metric-icon"/></div></article><article className="metric-card glass-card"><div className="metric-top"><span className="metric-name">{t(language, 'frequency')}</span><CircleHelp size={15}/></div><div className="metric-value">{new Intl.NumberFormat(locale(language), { maximumFractionDigits: 1 }).format(metrics.frequency * 1000)}<small className="metric-unit">/ 1k</small></div><div className="metric-bottom"><span>{t(language, 'policies')}</span><Activity size={16} className="metric-icon"/></div></article><article className="metric-card glass-card"><div className="metric-top"><span className="metric-name">{t(language, 'severity')}</span><CircleHelp size={15}/></div><div className="metric-value">{money(language, metrics.severity, false)}</div><div className="metric-bottom"><span>{t(language, 'avgCost')}</span><Activity size={16} className="metric-icon"/></div></article><article className="metric-card glass-card"><div className="metric-top"><span className="metric-name">{t(language, 'paid')}</span><CircleHelp size={15}/></div><div className="metric-value">{money(language, metrics.paid)}</div><div className="metric-bottom"><span>{t(language, 'incurred')}</span><ArrowUpRight size={16} className="metric-icon"/></div></article><article className="metric-card glass-card"><div className="metric-top"><span className="metric-name">{t(language, 'outstanding')}</span><CircleHelp size={15}/></div><div className="metric-value">{money(language, metrics.outstanding)}</div><div className="metric-bottom"><span>{t(language, 'incurred')}</span><ArrowDownRight size={16} className="metric-icon"/></div></article></section><div className="charts-grid charts-top">{claimsTrend}{statusChart}</div><div className="charts-grid charts-bottom">{frequencySeverityChart}{lossChart(true)}</div><section className="panel table-panel"><div className="panel-heading"><div><h2>{t(language, 'topClaims')}</h2><p>{t(language, 'topClaimsNote')}</p></div></div><div className="table-scroll"><table><thead><tr><th>{t(language, 'claimDate')}</th><th>{t(language, 'line')}</th><th>{t(language, 'claimCategory')}</th><th>{t(language, 'claimStatus')}</th><th>{t(language, 'paid')}</th><th>{t(language, 'outstanding')}</th><th>{t(language, 'claimAmount')}</th></tr></thead><tbody>{topClaims.map((claim) => { const policy = policyById.get(claim.policyId); return <tr key={claim.claimId}><td>{claim.reportingDate}</td><td>{policy ? lineLabel(language, policy.productLine) : '—'}</td><td>{claimCategoryLabel(language, claim.claimCategory)}</td><td>{claimStatusLabel(language, claim.claimStatus)}</td><td>{money(language, claim.paidAmount)}</td><td>{money(language, claim.outstandingReserve)}</td><td>{money(language, claim.incurredAmount)}</td></tr>; })}</tbody></table></div></section><div className="method-note"><ShieldAlert size={15}/><span>{t(language, 'developmentUnavailable')}</span></div></>}
          {page === 'underwriting' && <><div className="underwriting-banner"><div className="underwriting-banner-icon"><Gauge size={18}/></div><div><strong>{t(language, 'reviewRule')}</strong><p>{t(language, 'noInference')}</p></div><span className="status-badge neutral">{t(language, 'illustrative')}</span></div><section className="metric-grid underwriting-metrics">{(['lossRatio', 'expenseRatio', 'combinedRatio', 'underwritingResult'] as MetricKey[]).map((key) => <MetricCard key={key} metric={key} value={displayValue(key)} period={periodText} trend={metricTrends[key]} language={language} onInfo={setMetricOpen}/>)}</section><div className="charts-grid charts-top">{lossChart()}{regionChart}</div><section className="panel table-panel"><div className="panel-heading"><div><h2>{t(language, 'underwritingReview')}</h2><p>{t(language, 'reviewRule')}</p></div></div><div className="table-scroll"><table><thead><tr><th>{t(language, 'line')}</th><th>{t(language, 'earned')}</th><th>{t(language, 'incurred')}</th><th>{t(language, 'lossRatio')}</th><th>{t(language, 'frequency')}</th><th>{t(language, 'severity')}</th><th>{t(language, 'statusSource')}</th></tr></thead><tbody>{compareLines.map((row) => <tr key={row.line}><td><span className="line-cell"><i style={{ background: lineColors[row.line] }}/>{lineLabel(language, row.line)}</span></td><td>{money(language, row.earned)}</td><td>{money(language, row.incurred)}</td><td>{percent(language, row.lossRatio)}</td><td>{new Intl.NumberFormat(locale(language), { maximumFractionDigits: 1 }).format(row.frequency * 1000)} / 1k</td><td>{money(language, row.severity, false)}</td><td><span className={`status-badge ${row.lossRatio > 0.8 ? 'critical' : row.lossRatio >= 0.65 ? 'watch' : 'positive'}`}>{row.lossRatio > 0.8 ? t(language, 'statusReview') : row.lossRatio >= 0.65 ? t(language, 'statusMonitor') : t(language, 'statusFavorable')}</span></td></tr>)}</tbody></table></div></section></>}
          {page === 'segmentation' && <><div className="segment-finding panel"><div className="insight-icon"><Layers3 size={18}/></div><div><span className="status-badge calculated">{t(language, 'calculated')}</span><h2>{t(language, 'segmentFinding')}: {t(language, topSegment.segment.toLowerCase() as 'retail' | 'sme' | 'corporate')} · {percent(language, topSegment.lossRatio)}</h2><p>{t(language, 'noRiskScore')} {t(language, 'noInference')}</p></div></div><div className="charts-grid charts-top">{segmentExposureChart}{segmentLossChart}</div><section className="panel table-panel"><div className="panel-heading"><div><h2>{t(language, 'segmentTable')}</h2><p>{t(language, 'currentSelection')} · {periodText}</p></div></div><div className="table-scroll"><table><thead><tr><th>{t(language, 'segment')}</th><th>{t(language, 'policyCount')}</th><th>{t(language, 'exposureShare')}</th><th>{t(language, 'claimsShare')}</th><th>{t(language, 'frequency')}</th><th>{t(language, 'severity')}</th><th>{t(language, 'lossRatio')}</th><th>{t(language, 'underwritingResult')}</th></tr></thead><tbody>{segmentRows.map((row) => <tr key={row.segment}><td>{t(language, row.segment.toLowerCase() as 'retail' | 'sme' | 'corporate')}</td><td>{new Intl.NumberFormat(locale(language)).format(row.policyCount)}</td><td>{percent(language, row.exposureShare)}</td><td>{percent(language, row.claimsShare)}</td><td>{new Intl.NumberFormat(locale(language), { maximumFractionDigits: 1 }).format(row.frequency * 1000)} / 1k</td><td>{money(language, row.severity, false)}</td><td>{percent(language, row.lossRatio)}</td><td>{money(language, row.underwritingResult)}</td></tr>)}</tbody></table></div><div className="method-note"><CircleHelp size={15}/><span>{t(language, 'methodologyNote')}</span><button type="button" onClick={() => switchPage('methodologyPage')}>{t(language, 'methodology')} <ChevronLeft size={13}/></button></div></section></>}
          {page === 'dataExplorer' && <><div className="data-quality-grid"><article className="quality-card panel"><span>{t(language, 'dataRecords')}</span><strong>{new Intl.NumberFormat(locale(language)).format(demoDataset.policies.length + demoDataset.customers.length + demoDataset.claims.length)}</strong><small>{t(language, 'synthetic')}</small></article><article className="quality-card panel"><span>{t(language, 'duplicateIds')}</span><strong className={datasetChecks.duplicates ? 'quality-warn' : 'quality-good'}>{new Intl.NumberFormat(locale(language)).format(datasetChecks.duplicates)}</strong><small>{datasetChecks.duplicates === 0 ? t(language, 'allClear') : t(language, 'dataQuality')}</small></article><article className="quality-card panel"><span>{t(language, 'unmatchedPolicies')}</span><strong className={datasetChecks.unmatched ? 'quality-warn' : 'quality-good'}>{new Intl.NumberFormat(locale(language)).format(datasetChecks.unmatched)}</strong><small>{t(language, 'identifierIntegrity')}</small></article><article className="quality-card panel"><span>{t(language, 'missingIdentifiers')}</span><strong className={datasetChecks.missing ? 'quality-warn' : 'quality-good'}>{new Intl.NumberFormat(locale(language)).format(datasetChecks.missing)}</strong><small>{t(language, 'dataCoverage')}: 2025</small></article><article className="quality-card panel"><span>{t(language, 'invalidDates')}</span><strong className={datasetChecks.invalidDates ? 'quality-warn' : 'quality-good'}>{new Intl.NumberFormat(locale(language)).format(datasetChecks.invalidDates)}</strong><small>{t(language, 'dataQuality')}</small></article><article className="quality-card panel"><span>{t(language, 'balanceIssues')}</span><strong className={datasetChecks.balanceIssues ? 'quality-warn' : 'quality-good'}>{new Intl.NumberFormat(locale(language)).format(datasetChecks.balanceIssues)}</strong><small>{t(language, 'identifierIntegrity')}</small></article><article className="quality-card panel"><span>{t(language, 'identifierCompleteness')}</span><strong className={datasetChecks.missing ? 'quality-warn' : 'quality-good'}>{percent(language, datasetChecks.completeness)}</strong><small>{t(language, 'completeFields')}</small></article></div><section className="dataset-browser panel"><aside className="dataset-list"><div className="dataset-list-head"><h2>{t(language, 'datasetCatalog')}</h2><label className="dataset-search"><Search size={14}/><input value={datasetSearch} onChange={(e) => setDatasetSearch(e.target.value)} placeholder={t(language, 'searchDatasets')} aria-label={t(language, 'searchDatasets')}/></label></div><div className="dataset-options">{visibleCatalog.map((item) => <button type="button" key={item.key} className={`dataset-option ${selectedDataset === item.key ? 'selected' : ''}`} onClick={() => setSelectedDataset(item.key)}><Database size={15}/><span>{item.localizedLabel}</span><small>{new Intl.NumberFormat(locale(language)).format(getDatasetTable(item.key).length)}</small></button>)}</div></aside><div className="dataset-detail"><div className="dataset-detail-head"><div><span className="eyebrow"><span className="eyebrow-line"/>{t(language, 'synthetic')}</span><h2>{selectedCatalog ? t(language, datasetLabelKeys[selectedCatalog.key]) : t(language, 'datasetCatalog')}</h2><p>{selectedCatalog?.coverage ?? t(language, 'dataCoverage')}</p></div><span className="status-badge neutral">{new Intl.NumberFormat(locale(language)).format(selectedDatasetRows.length)} {t(language, 'dataRecords')}</span></div><div className="field-chips"><span>{t(language, 'dataFields')}</span>{selectedDatasetFields.map((field) => <code key={field}>{field}</code>)}</div><div className="catalog-note"><CircleHelp size={15}/>{t(language, 'catalogueNote')}</div><div className="table-scroll dataset-preview"><table><thead><tr>{selectedDatasetFields.map((field) => <th key={field}>{field}</th>)}</tr></thead><tbody>{selectedDatasetRows.slice(0, 12).map((record, index) => <tr key={String(record.policyId ?? record.claimId ?? record.customerId ?? record.assetId ?? record.expenseId ?? index)}>{selectedDatasetFields.map((field) => <td key={field} dir="auto">{typeof record[field] === 'number' ? new Intl.NumberFormat(locale(language), { maximumFractionDigits: 2 }).format(record[field] as number) : String(record[field] ?? '—')}</td>)}</tr>)}</tbody></table></div><div className="dataset-footnote"><ShieldAlert size={14}/>{t(language, 'syntheticCaution')}</div></div></section></>}
          {page === 'methodologyPage' && <><section className="methodology-intro panel"><div className="methodology-icon"><BookOpen size={20}/></div><div><h2>{t(language, 'dataBasis')}</h2><p>{t(language, 'methodologyNote')}</p></div></section><div className="methodology-grid">{methods.map((item, index) => <article className="method-card panel" key={item.key}><div className="method-index">{String(index + 1).padStart(2, '0')}</div><div className="method-head"><h2>{t(language, item.key)}</h2><span className="status-badge neutral">{t(language, 'synthetic')}</span></div><div className="method-field"><span>{t(language, 'formula')}</span><strong>{t(language, item.formula)}</strong></div><div className="method-field"><span>{t(language, 'requiredData')}</span><p>{t(language, item.fields)}</p></div><div className="method-field"><span>{t(language, 'interpretation')}</span><p>{t(language, item.interpretation)}</p></div><div className="method-limit"><ShieldAlert size={14}/><span>{t(language, 'limitations')}: {metricDefinition(item.key)}</span></div></article>)}</div></>}
        </>}
        <footer className="page-footer"><span>SHARQ.RISK <i/> {t(language, 'synthetic')}</span><span>{t(language, 'statusNoConnection')}</span></footer>
      </div>
    </main>
    {metricOpen && <div className="dialog-backdrop" role="presentation" onClick={() => setMetricOpen(null)}><section className="metric-dialog panel" role="dialog" aria-modal="true" aria-labelledby="metric-dialog-title" onClick={(e) => e.stopPropagation()}><button className="icon-button dialog-close" type="button" aria-label={t(language, 'close')} onClick={() => setMetricOpen(null)}><X size={18}/></button><span className="eyebrow"><span className="eyebrow-line"/>{t(language, 'info')}</span><h2 id="metric-dialog-title">{t(language, metricOpen)}</h2><p>{metricDefinition(metricOpen)}</p><div className="dialog-detail"><strong>{t(language, 'periodLabel')}</strong><span>{periodText}</span></div><div className="dialog-detail"><strong>{t(language, 'dataBasis')}</strong><span>{t(language, 'synthetic')}</span></div></section></div>}
  </div>;
}

export default App;
