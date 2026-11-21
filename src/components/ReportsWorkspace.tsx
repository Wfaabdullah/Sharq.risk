import { useMemo, useState } from 'react';
import { Download, FileChartColumnIncreasing, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { byLine, type DemoRecord, type Metrics } from '../data/demo';
import type { ScenarioAssumptions, ScenarioResult } from '../data/scenarios';
import { kpiMethods } from '../content/methodology';
import { t, type Language, type MessageKey } from '../i18n';

export type ReportKind = 'executive' | 'line' | 'claims' | 'underwriting' | 'dataQuality' | 'scenario';
type Props = { language: Language; period: string; datasetName: string; synthetic: boolean; records: DemoRecord[]; metrics: Metrics; supports: { gwp: boolean; nwp: boolean; earned: boolean; incurred: boolean; expenses: boolean; paid: boolean; outstanding: boolean; claims: boolean; frequency: boolean }; scenario: ScenarioResult; assumptions: ScenarioAssumptions; invalidRows: number; totalRows: number };
const reportKeys: { value: ReportKind; label: MessageKey }[] = [{ value: 'executive', label: 'reportExecutive' }, { value: 'line', label: 'reportLine' }, { value: 'claims', label: 'reportClaims' }, { value: 'underwriting', label: 'reportUnderwriting' }, { value: 'dataQuality', label: 'reportDataQuality' }, { value: 'scenario', label: 'reportScenario' }];
const money = (value: number) => value.toFixed(2);
const pct = (value: number) => `${(value * 100).toFixed(2)}%`;
function escapeHtml(text: string) { return text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!); }

export default function ReportsWorkspace(props: Props) {
  const { language, period, datasetName, synthetic, records, metrics, supports, scenario, assumptions, invalidRows, totalRows } = props;
  const [kind, setKind] = useState<ReportKind>('executive');
  const [message, setMessage] = useState('');
  const lineRows = useMemo(() => byLine(records).filter((row) => row.earned > 0), [records]);
  const labels: Record<string, string> = { gwp: t(language, 'gwp'), nwp: t(language, 'nwp'), earned: t(language, 'earned'), incurred: t(language, 'incurred'), paid: t(language, 'paid'), outstanding: t(language, 'outstanding'), lossRatio: t(language, 'lossRatio'), expenseRatio: t(language, 'expenseRatio'), combinedRatio: t(language, 'combinedRatio'), underwritingResult: t(language, 'underwritingResult'), expenses: t(language, 'expenses'), claims: t(language, 'claimCount'), frequency: t(language, 'frequency'), severity: t(language, 'severity') };
  const title = t(language, reportKeys.find((item) => item.value === kind)!.label);
  const generated = new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
  const definition = (id: string) => kpiMethods.find((method) => method.id === id)?.formula[language] ?? '';
  const metricRows = [
    ...(supports.gwp ? [{ metric: labels.gwp, value: money(metrics.gwp), definition: definition('gwp') }] : []),
    ...(supports.nwp ? [{ metric: labels.nwp, value: money(metrics.nwp), definition: definition('nwp') }] : []),
    ...(supports.earned ? [{ metric: labels.earned, value: money(metrics.earned), definition: definition('earned') }] : []),
    ...(supports.incurred ? [{ metric: labels.incurred, value: money(metrics.incurred), definition: definition('incurred') }] : []),
    ...(supports.paid ? [{ metric: labels.paid, value: money(metrics.paid), definition: definition('paid') }] : []), ...(supports.outstanding ? [{ metric: labels.outstanding, value: money(metrics.outstanding), definition: definition('outstanding') }] : []),
    ...(supports.earned && supports.incurred && metrics.earned > 0 ? [{ metric: labels.lossRatio, value: pct(metrics.lossRatio), definition: definition('loss-ratio') }] : []),
    ...(supports.earned && supports.expenses && metrics.earned > 0 ? [{ metric: labels.expenseRatio, value: pct(metrics.expenseRatio), definition: definition('expense-ratio') }, { metric: labels.combinedRatio, value: pct(metrics.combinedRatio), definition: definition('combined-ratio') }, { metric: labels.underwritingResult, value: money(metrics.underwritingResult), definition: definition('underwriting-result') }] : []),
    ...(supports.claims ? [{ metric: labels.claims, value: String(metrics.claims), definition: language === 'ar' ? 'مجموع أعداد المطالبات المبلّغ عنها المقدمة.' : 'Sum of the supplied reported claim counts.' }, ...(metrics.claims > 0 ? [{ metric: labels.severity, value: money(metrics.severity), definition: definition('severity') }] : [])] : []),
    ...(supports.frequency && metrics.exposure > 0 ? [{ metric: labels.frequency, value: metrics.frequency.toFixed(6), definition: language === 'ar' ? 'عدد المطالبات المبلّغ عنها ÷ وحدات التعرض المرتبطة.' : 'Reported claim count ÷ mapped exposure units.' }] : []),
  ];
  let reportRows: Record<string, string>[];
  if (kind === 'line' || kind === 'underwriting') {
    reportRows = lineRows.map((row) => ({ [t(language, 'line')]: row.line, ...(supports.gwp ? { [labels.gwp]: money(row.gwp) } : {}), [labels.earned]: money(row.earned), [labels.incurred]: money(row.incurred), [labels.lossRatio]: pct(row.lossRatio), ...(supports.expenses ? { [labels.expenseRatio]: pct(row.expenseRatio), [labels.combinedRatio]: pct(row.combinedRatio), [labels.underwritingResult]: money(row.underwritingResult) } : {}) }));
    if (kind === 'underwriting' && !supports.expenses) reportRows = [];
  } else if (kind === 'claims') {
    reportRows = supports.claims ? [{ [labels.claims]: String(metrics.claims), [labels.incurred]: money(metrics.incurred), ...(supports.paid ? { [labels.paid]: money(metrics.paid) } : {}), ...(supports.outstanding ? { [labels.outstanding]: money(metrics.outstanding) } : {}), ...(metrics.claims > 0 ? { [labels.severity]: money(metrics.severity) } : {}), ...(supports.frequency && metrics.exposure > 0 ? { [labels.frequency]: metrics.frequency.toFixed(6) } : {}) }] : [];
  } else if (kind === 'dataQuality') {
    reportRows = [{ [t(language, 'upOriginalRows')]: String(totalRows), [t(language, 'upValidRows')]: String(Math.max(0, totalRows - invalidRows)), [t(language, 'upExcludedRows')]: String(invalidRows), [t(language, 'statusSource')]: synthetic ? t(language, 'synthetic') : t(language, 'upActive') }];
  } else if (kind === 'scenario') {
    reportRows = supports.earned && supports.incurred && supports.expenses && metrics.earned > 0 ? [
      { [t(language, 'metric')]: t(language, 'scenarioBaseline'), [labels.incurred]: money(scenario.baseline.incurred), [labels.lossRatio]: pct(scenario.baseline.lossRatio), [labels.combinedRatio]: pct(scenario.baseline.combinedRatio), [labels.underwritingResult]: money(scenario.baseline.underwritingResult) },
      { [t(language, 'metric')]: t(language, 'scenarioStressed'), [labels.incurred]: money(scenario.stressed.incurred), [labels.lossRatio]: pct(scenario.stressed.lossRatio), [labels.combinedRatio]: pct(scenario.stressed.combinedRatio), [labels.underwritingResult]: money(scenario.stressed.underwritingResult) },
      { [t(language, 'metric')]: t(language, 'scenarioDifference'), [labels.incurred]: money(scenario.differences.incurred), [labels.lossRatio]: `${(scenario.differences.lossRatio * 100).toFixed(2)} pp`, [labels.combinedRatio]: `${(scenario.differences.combinedRatio * 100).toFixed(2)} pp`, [labels.underwritingResult]: money(scenario.differences.underwritingResult) },
    ] : [];
  } else reportRows = metricRows.map((row) => ({ [t(language, 'metric')]: row.metric, [t(language, 'value')]: row.value, [t(language, 'formula')]: row.definition }));

  const assumptionsText = kind === 'scenario' ? `${t(language, 'scenarioFrequency')}: +${assumptions.frequencyIncreasePct}% · ${t(language, 'scenarioSeverity')}: +${assumptions.severityIncreasePct}%. ${t(language, 'reportScenarioAssumptions')}` : t(language, 'reportMappedAssumptions');
  const limitationsText = kind === 'scenario' ? t(language, 'scenarioLimit') : t(language, 'reportScopeLimit');
  const metadataRows = [{ field: t(language, 'reportTitleLabel'), value: title }, { field: t(language, 'periodLabel'), value: period }, { field: t(language, 'reportDataset'), value: datasetName }, { field: t(language, 'reportDataStatus'), value: synthetic ? t(language, 'synthetic') : t(language, 'reportUploaded') }, { field: t(language, 'reportGenerated'), value: generated }, { field: t(language, 'reportAssumptions'), value: assumptionsText }, { field: t(language, 'limitations'), value: limitationsText }];

  function exportCsv() {
    if (!reportRows.length) return;
    const headers = Object.keys(reportRows[0]);
    const quote = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map(quote).join(','), ...reportRows.map((row) => headers.map((header) => quote(row[header])).join(','))].join('\r\n');
    const meta = metadataRows.map((row) => `${quote(row.field)},${quote(row.value)}`).join('\r\n');
    const blob = new Blob(['\uFEFF', `${quote(t(language, 'reportContext'))}\r\n${meta}\r\n\r\n${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `sharq-risk-${kind}-report.csv`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 500); setMessage(t(language, 'reportDownloaded'));
  }
  function exportExcel() {
    if (!reportRows.length) return;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(reportRows), 'Results');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(metadataRows), 'Context and limits');
    XLSX.writeFile(workbook, `sharq-risk-${kind}-report.xlsx`); setMessage(t(language, 'reportDownloaded'));
  }
  function exportPdf() {
    if (!reportRows.length) return;
    const popup = window.open('', '_blank');
    if (!popup) { setMessage(t(language, 'reportPopupBlocked')); return; }
    popup.opener = null;
    const metadata = metadataRows.map((row) => `<tr><th>${escapeHtml(row.field)}</th><td>${escapeHtml(row.value)}</td></tr>`).join('');
    const headers = Object.keys(reportRows[0]);
    const head = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
    const body = reportRows.map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header] ?? '')}</td>`).join('')}</tr>`).join('');
    popup.document.write(`<!doctype html><html lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}"><meta charset="utf-8"><title>${escapeHtml(title)} — SHARQ.RISK</title><style>body{font:14px Arial,sans-serif;color:#151623;margin:36px}h1{font-size:24px;color:#2b2d6e}p{line-height:1.6;color:#555}table{border-collapse:collapse;width:100%;margin:18px 0}th,td{border:1px solid #d9dbe6;padding:8px;text-align:start;vertical-align:top}th{background:#f0f0fa}@media print{body{margin:15mm}}</style><body><h1>SHARQ.RISK · ${escapeHtml(title)}</h1><p>${escapeHtml(t(language, 'reportContext'))}</p><table>${metadata}</table><h2>${escapeHtml(t(language, 'reportResults'))}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table><p><b>${escapeHtml(t(language, 'reportAssumptions'))}:</b> ${escapeHtml(assumptionsText)}</p><p><b>${escapeHtml(t(language, 'limitations'))}:</b> ${escapeHtml(limitationsText)}</p></body></html>`);
    popup.document.close(); popup.focus(); window.setTimeout(() => popup.print(), 250); setMessage(t(language, 'reportPrintHint'));
  }

  return <div className="reports-workspace"><section className="upload-intro panel"><div className="upload-intro-icon"><FileChartColumnIncreasing size={19}/></div><div><span className="status-badge calculated">{t(language, 'reportReady')}</span><h2>{t(language, 'reportsTitle')}</h2><p>{t(language, 'reportsSub')}</p></div></section><section className="report-builder panel"><div className="report-form"><label><span>{t(language, 'reportType')}</span><select value={kind} onChange={(event) => { setKind(event.target.value as ReportKind); setMessage(''); }}>{reportKeys.map((item) => <option key={item.value} value={item.value}>{t(language, item.label)}</option>)}</select></label><div className="report-context"><span>{t(language, 'reportDataset')}: <strong>{datasetName}</strong></span><span>{t(language, 'periodLabel')}: <strong>{period}</strong></span><span>{t(language, 'reportDataStatus')}: <strong>{synthetic ? t(language, 'synthetic') : t(language, 'reportUploaded')}</strong></span></div></div><div className="report-section"><h3>{t(language, 'reportResults')}</h3>{reportRows.length ? <div className="table-scroll"><table><thead><tr>{Object.keys(reportRows[0]).map((key) => <th key={key}>{key}</th>)}</tr></thead><tbody>{reportRows.map((row, index) => <tr key={index}>{Object.keys(reportRows[0]).map((key) => <td key={key}>{row[key] ?? '—'}</td>)}</tr>)}</tbody></table></div> : <div className="empty-state">{t(language, 'reportUnavailable')}</div>}</div><div className="report-detail-grid"><article><span>{t(language, 'reportAssumptions')}</span><p>{assumptionsText}</p></article><article><span>{t(language, 'limitations')}</span><p>{limitationsText}</p></article><article><span>{t(language, 'reportDefinitions')}</span><p>{metricRows.map((row) => `${row.metric}: ${row.definition}`).join(' · ') || t(language, 'reportUnavailable')}</p></article></div><div className="report-actions"><button className="button button-primary" disabled={!reportRows.length} onClick={exportCsv}><Download size={14}/>CSV</button><button className="button button-secondary" disabled={!reportRows.length} onClick={exportExcel}><Download size={14}/>Excel</button><button className="button button-secondary" disabled={!reportRows.length} onClick={exportPdf}><Printer size={14}/>{t(language, 'reportPrintPdf')}</button>{message && <span role="status">{message}</span>}</div><p className="report-footnote">{t(language, 'reportMetadataNote')}</p></section></div>;
}
