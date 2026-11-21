import { useMemo, useState, type ChangeEvent, type DragEvent } from 'react';
import { AlertTriangle, Check, Download, FileSpreadsheet, FileUp, ShieldAlert, Table2, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ambiguousMappingFields, analyzeUpload, inferColumnType, inferMapping, readUploadFile, uploadFields, type FieldMapping, type RawRow, type UploadField, type UploadSupports } from '../data/uploadAnalysis';
import type { DemoRecord } from '../data/demo';
import { t, type Language, type MessageKey } from '../i18n';

type ActivatedUpload = { records: DemoRecord[]; supports: UploadSupports; yearLabel: string; fileName: string; invalidCount: number };
type Props = { language: Language; activeFileName: string | null; onActivate: (upload: ActivatedUpload | null) => void };

const fieldMessages: Record<UploadField, MessageKey> = { id: 'upId', line: 'upLine', region: 'upRegion', period: 'upPeriod', gwp: 'upGwp', ceded: 'upCeded', earned: 'upEarned', incurred: 'upIncurred', paid: 'upPaid', outstanding: 'upOutstanding', expenses: 'upExpenses', claims: 'upClaims', exposure: 'upExposure' };

function downloadBlob(filename: string, content: Blob) {
  const url = URL.createObjectURL(content); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

export default function UploadWorkspace({ language, activeFileName, onActivate }: Props) {
  const [rows, setRows] = useState<RawRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const analysis = useMemo(() => rows.length ? analyzeUpload(rows, mapping) : null, [rows, mapping]);

  async function readFile(file: File) {
    setError(''); setBusy(true); setFileName(file.name);
    if (file.size > 15 * 1024 * 1024) { setError(t(language, 'upMaxSize')); setBusy(false); return; }
    try {
      const parsed = await readUploadFile(file);
      if (!parsed.length) throw new Error(t(language, 'upNoRows'));
      const columns = Object.keys(parsed[0]);
      setRows(parsed); setHeaders(columns); setMapping(inferMapping(columns));
    } catch (cause) {
      setRows([]); setHeaders([]); setMapping({}); setError(cause instanceof Error ? cause.message : t(language, 'upReadError'));
    } finally { setBusy(false); }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (file) await readFile(file);
    event.target.value = '';
  }

  function clearFile() {
    setRows([]); setHeaders([]); setMapping({}); setFileName(''); setError('');
    if (activeFileName === fileName) onActivate(null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault(); setDragging(false);
    const file = event.dataTransfer.files?.[0]; if (file) void readFile(file);
  }

  function activate() {
    if (!analysis || analysis.records.length === 0 || analysis.issues.some((issue) => issue.row === 0 && issue.kind === 'error')) return;
    onActivate({ records: analysis.records, supports: analysis.supports, yearLabel: analysis.yearLabel, fileName, invalidCount: analysis.invalidCount });
  }

  function exportTransformed(format: 'csv' | 'xlsx') {
    if (!analysis?.records.length) return;
    const transformed = analysis.records.map((row) => ({ reporting_month: row.month + 1, insurance_line: row.line, ...(analysis.supports.region ? { region: row.region } : {}), ...(analysis.supports.gwp ? { gross_written_premium: row.gwp } : {}), ...(analysis.supports.nwp ? { net_written_premium: row.nwp } : {}), earned_premium: row.earned, incurred_claims: row.incurred, ...(analysis.supports.paid ? { paid_claims: row.paid } : {}), ...(analysis.supports.outstanding ? { outstanding_reserves: row.outstanding } : {}), ...(analysis.supports.expenses ? { underwriting_expenses: row.expenses } : {}), ...(analysis.supports.claims ? { claim_count: row.claims } : {}), ...(analysis.supports.exposure ? { exposure_units: row.exposure } : {}) }));
    if (format === 'csv') {
      const keys = Object.keys(transformed[0]);
      const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const csv = [keys.map(csvCell).join(','), ...transformed.map((record) => keys.map((key) => csvCell(record[key as keyof typeof record])).join(','))].join('\r\n');
      downloadBlob('sharq-risk-transformed-valid-rows.csv', new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    } else {
      const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(transformed), 'Transformed valid rows');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(analysis.issues.map((issue) => ({ row: issue.row || 'Mapping', severity: issue.kind, code: issue.code, fields: issue.fields.join(', '), message: issue.message }))), 'Quality findings');
      XLSX.writeFile(workbook, 'sharq-risk-transformed-valid-rows.xlsx');
    }
  }

  const errorCount = analysis?.issues.filter((issue) => issue.kind === 'error').length ?? 0;
  const warningCount = analysis?.issues.filter((issue) => issue.kind === 'warning').length ?? 0;
  const mappingBlocked = analysis?.issues.some((issue) => issue.row === 0 && issue.kind === 'error') ?? true;
  const isActive = activeFileName === fileName && Boolean(fileName);
  const ambiguousFields = ambiguousMappingFields(headers);

  return <div className="upload-workspace">
    <section className="upload-intro panel"><div className="upload-intro-icon"><FileUp size={19}/></div><div><span className="status-badge neutral">{t(language, 'upLocal')}</span><h2>{t(language, 'upTitle')}</h2><p>{t(language, 'upPrivacy')}</p></div></section>
    <section className="upload-step panel"><div className="upload-step-heading"><span className="step-index">01</span><div><h2>{t(language, 'upChooseFile')}</h2><p>{t(language, 'upFormatHint')}</p></div></div><label className={`upload-drop ${dragging ? 'dragging' : ''}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={handleDrop}><input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFile}/><FileSpreadsheet size={19}/><strong>{busy ? t(language, 'upReading') : t(language, 'upBrowse')}</strong><span>{fileName || t(language, 'upAcceptedFormats')}</span></label>{fileName && <button className="button button-secondary upload-remove" type="button" onClick={clearFile}><Trash2 size={13}/>{t(language, 'upRemoveFile')}</button>}{error && <div className="upload-alert error"><AlertTriangle size={15}/>{error}</div>}</section>
    {rows.length > 0 && <>
      <section className="upload-step panel"><div className="upload-step-heading"><span className="step-index">02</span><div><h2>{t(language, 'upMapColumns')}</h2><p>{t(language, 'upMappingHint')}</p></div></div>{ambiguousFields.length > 0 && <div className="upload-alert ambiguous"><AlertTriangle size={15}/><span>{t(language, 'ambiguousMapping')} {ambiguousFields.map((field) => t(language, fieldMessages[field])).join(', ')}</span></div>}<div className="mapping-grid">{uploadFields.map((field) => <label className="mapping-field" key={field.key}><span>{t(language, fieldMessages[field.key])}{field.required && <b> · {t(language, 'upRequired')}</b>}</span><select value={mapping[field.key] ?? ''} onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value || undefined }))}><option value="">{t(language, 'upUnmapped')}</option>{headers.map((header) => <option key={header} value={header}>{header}</option>)}</select></label>)}</div><div className="upload-support-note"><ShieldAlert size={15}/><span>{t(language, 'upOptionalNote')} {t(language, 'dataMethodLimit')}</span></div></section>
      <section className="upload-step panel"><div className="upload-step-heading"><span className="step-index">03</span><div><h2>{t(language, 'upQuality')}</h2><p>{t(language, 'upQualityHint')}</p></div></div><div className="upload-summary-grid"><article><span>{t(language, 'upOriginalRows')}</span><strong>{rows.length.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</strong></article><article><span>{t(language, 'upValidRows')}</span><strong className="quality-good">{analysis?.validCount.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</strong></article><article><span>{t(language, 'upExcludedRows')}</span><strong className={analysis?.invalidCount ? 'quality-warn' : 'quality-good'}>{analysis?.invalidCount.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</strong></article><article><span>{t(language, 'upFindings')}</span><strong className={errorCount ? 'quality-warn' : 'quality-good'}>{errorCount} / {warningCount}</strong></article></div>
        <div className="upload-note-row"><span className="status-badge calculated">{t(language, 'upOriginalPreserved')}</span><span>{t(language, 'upExcludedExplanation')}</span></div>
        {analysis?.issues.length ? <div className="issue-list">{analysis.issues.slice(0, 30).map((issue, index) => <div className={`upload-issue ${issue.kind}`} key={`${issue.code}-${issue.row}-${index}`}><span>{issue.kind === 'error' ? <AlertTriangle size={14}/> : <ShieldAlert size={14}/>}</span><p>{issue.message}</p></div>)}{analysis.issues.length > 30 && <small>{t(language, 'upMoreFindings').replace('{count}', String(analysis.issues.length - 30))}</small>}</div> : <div className="upload-clear"><Check size={15}/>{t(language, 'upNoFindings')}</div>}
      </section>
      <section className="upload-step panel"><div className="upload-step-heading"><span className="step-index">04</span><div><h2>{t(language, 'upPreview')}</h2><p>{t(language, 'upRawPreview')}</p></div></div><div className="table-scroll upload-preview"><table><thead><tr>{headers.map((header) => <th key={header}>{header}<small className="column-type">{inferColumnType(rows.map((row) => row[header] ?? ''))}</small></th>)}</tr></thead><tbody>{rows.slice(0, 8).map((row, index) => <tr key={`raw-${index}`}>{headers.map((header) => <td key={header} dir="auto">{row[header] || '—'}</td>)}</tr>)}</tbody></table></div><p className="upload-footnote">{t(language, 'upPreviewLimit').replace('{count}', String(rows.length))}</p></section>
      <section className="upload-step analysis-output panel"><div className="upload-step-heading"><span className="step-index">05</span><div><h2>{t(language, 'upAnalysis')}</h2><p>{t(language, 'upAnalysisHint')}</p></div></div>
        <div className="support-chips">{(['gwp','nwp','earned','incurred','expenses','paid','outstanding','claims','frequency','region'] as const).map((key) => <span className={`support-chip ${(analysis?.supports[key] ?? false) ? 'available' : 'unavailable'}`} key={key}>{t(language, `upSupport_${key}` as MessageKey)} · {analysis?.supports[key] ? t(language, 'upAvailable') : t(language, 'upUnavailable')}</span>)}</div>
        {analysis?.records.length ? <div className="table-scroll"><table><thead><tr><th>{t(language, 'line')}</th><th>{t(language, 'periodLabel')}</th>{analysis.supports.gwp && <th>{t(language, 'gwp')}</th>}<th>{t(language, 'earned')}</th><th>{t(language, 'incurred')}</th>{analysis.supports.expenses && <th>{t(language, 'expenses')}</th>}</tr></thead><tbody>{analysis.records.slice(0, 8).map((record, index) => <tr key={`calc-${index}`}><td>{record.line}</td><td>{record.month + 1}</td>{analysis.supports.gwp && <td>{record.gwp.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', { maximumFractionDigits: 2 })}</td>}<td>{record.earned.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', { maximumFractionDigits: 2 })}</td><td>{record.incurred.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', { maximumFractionDigits: 2 })}</td>{analysis.supports.expenses && <td>{record.expenses.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', { maximumFractionDigits: 2 })}</td>}</tr>)}</tbody></table></div> : <div className="upload-alert error"><AlertTriangle size={15}/>{t(language, 'upNoValidRows')}</div>}
        <div className="upload-action-row"><button className="button button-primary" type="button" onClick={activate} disabled={!analysis?.records.length || mappingBlocked}>{isActive ? <Check size={15}/> : <Table2 size={15}/>} {isActive ? t(language, 'upActive') : t(language, 'upUseDataset')}</button><button className="button button-secondary" type="button" disabled={!analysis?.records.length} onClick={() => exportTransformed('csv')}><Download size={14}/>CSV</button><button className="button button-secondary" type="button" disabled={!analysis?.records.length} onClick={() => exportTransformed('xlsx')}><Download size={14}/>Excel</button>{activeFileName && <button className="button button-secondary" type="button" onClick={() => onActivate(null)}>{t(language, 'upSwitchDemo')}</button>}</div>
        <div className="upload-support-note"><ShieldAlert size={15}/><span>{t(language, 'upMethodLimit')}</span></div>
      </section>
    </>}
  </div>;
}
