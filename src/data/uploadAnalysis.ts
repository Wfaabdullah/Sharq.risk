import * as XLSX from 'xlsx';
import type { DemoRecord, Line, Region } from './demo';

export type RawRow = Record<string, string>;
export type UploadField = 'id' | 'line' | 'region' | 'period' | 'gwp' | 'ceded' | 'earned' | 'incurred' | 'paid' | 'outstanding' | 'expenses' | 'claims' | 'exposure';
export type FieldMapping = Partial<Record<UploadField, string>>;
export type QualityIssue = { row: number; kind: 'error' | 'warning'; code: string; fields: string[]; message: string };
export type UploadSupports = { gwp: boolean; nwp: boolean; earned: boolean; incurred: boolean; expenses: boolean; paid: boolean; outstanding: boolean; claims: boolean; exposure: boolean; frequency: boolean; region: boolean };
export type UploadAnalysis = { records: DemoRecord[]; issues: QualityIssue[]; validCount: number; invalidCount: number; duplicateCount: number; yearLabel: string; supports: UploadSupports };

export const uploadFields: { key: UploadField; label: string; required: boolean; aliases: string[] }[] = [
  { key: 'id', label: 'Record identifier', required: false, aliases: ['id', 'policyid', 'policy_id', 'claimid', 'claim_id', 'recordid', 'record_id'] },
  { key: 'line', label: 'Insurance line', required: true, aliases: ['line', 'insurance_line', 'product_line', 'productline', 'insurance', 'lob'] },
  { key: 'region', label: 'Region', required: false, aliases: ['region', 'region_name', 'territory'] },
  { key: 'period', label: 'Reporting period', required: true, aliases: ['period', 'reporting_period', 'month', 'date', 'reporting_date', 'as_of_date'] },
  { key: 'gwp', label: 'Gross written premium', required: false, aliases: ['gwp', 'written_premium', 'gross_written_premium', 'premium', 'gross_premium'] },
  { key: 'ceded', label: 'Ceded written premium', required: false, aliases: ['ceded', 'ceded_premium', 'ceded_written_premium', 'reinsurance_premium'] },
  { key: 'earned', label: 'Earned premium', required: true, aliases: ['earned', 'earned_premium', 'earnedpremium'] },
  { key: 'incurred', label: 'Incurred claims', required: true, aliases: ['incurred', 'incurred_claims', 'incurred_amount', 'claims_incurred'] },
  { key: 'paid', label: 'Paid claims', required: false, aliases: ['paid', 'paid_claims', 'paid_amount', 'claims_paid'] },
  { key: 'outstanding', label: 'Outstanding reserves', required: false, aliases: ['outstanding', 'outstanding_reserve', 'outstanding_reserves', 'reserve', 'case_reserve'] },
  { key: 'expenses', label: 'Underwriting expenses', required: false, aliases: ['expenses', 'expense', 'underwriting_expenses', 'acquisition_expenses'] },
  { key: 'claims', label: 'Claim count', required: false, aliases: ['claims', 'claim_count', 'number_of_claims', 'reported_claims'] },
  { key: 'exposure', label: 'Exposure units', required: false, aliases: ['exposure', 'exposure_units', 'policy_years', 'earned_exposure'] },
];

function normalizeHeader(value: string) { return value.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, ''); }

export function parseCsv(text: string): RawRow[] {
  const input = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = []; let cell = ''; let quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (char !== '\r') cell += char;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((header, index) => header.trim() || `Column ${index + 1}`);
  return rows.slice(1).filter((cells) => cells.some((value) => value.trim() !== '')).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ''])));
}

export async function readUploadFile(file: File): Promise<RawRow[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') return parseCsv(await file.text());
  if (extension !== 'xlsx') throw new Error('Unsupported file. Use CSV or .xlsx. Legacy .xls files are not supported.');
  const bytes = await file.arrayBuffer();
  const workbook = XLSX.read(bytes, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error('The workbook has no worksheets.');
  const sheet = workbook.Sheets[firstSheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' });
  if (matrix.length < 2) throw new Error('The first worksheet must contain a header row and at least one data row.');
  const headers = matrix[0].map((value, index) => String(value ?? '').trim() || `Column ${index + 1}`);
  return matrix.slice(1).filter((cells) => cells.some((value) => String(value ?? '').trim() !== '')).map((cells) => Object.fromEntries(headers.map((header, index) => [header, String(cells[index] ?? '')])));
}

export function inferMapping(headers: string[]): FieldMapping {
  const mapping: FieldMapping = {};
  for (const field of uploadFields) {
    const matches = headers.filter((header) => field.aliases.includes(normalizeHeader(header)));
    if (matches.length === 1) mapping[field.key] = matches[0];
  }
  return mapping;
}

export function ambiguousMappingFields(headers: string[]): UploadField[] {
  return uploadFields.filter((field) => headers.filter((header) => field.aliases.includes(normalizeHeader(header))).length > 1).map((field) => field.key);
}

export function inferColumnType(values: string[]): string {
  const nonEmpty = values.filter((value) => value.trim() !== '').slice(0, 40);
  if (!nonEmpty.length) return 'empty';
  const numeric = nonEmpty.filter((value) => parseNumber(value) !== null).length;
  if (numeric / nonEmpty.length >= 0.8) return 'number';
  const dates = nonEmpty.filter((value) => !Number.isNaN(Date.parse(value))).length;
  return dates / nonEmpty.length >= 0.8 ? 'date' : 'text';
}

function parseNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') return null;
  const text = value.trim().replace(/[$€£\s]/g, '').replace(/,/g, '');
  const wrapped = /^\(.*\)$/.test(text);
  const normalized = wrapped ? `-${text.slice(1, -1)}` : text;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseLine(value: string | undefined): Line | null {
  const text = value?.trim().toLowerCase();
  if (text === 'motor' || text === 'auto' || text === 'vehicle') return 'Motor';
  if (text === 'health' || text === 'medical') return 'Health';
  if (text === 'property' || text === 'home' || text === 'commercial property') return 'Property';
  return null;
}
function parseRegion(value: string | undefined): Region | null {
  const text = value?.trim().toLowerCase();
  if (text === 'north' || text === 'northern') return 'North';
  if (text === 'central') return 'Central';
  if (text === 'west' || text === 'western') return 'West';
  if (text === 'south' || text === 'southern') return 'South';
  return null;
}
function parsePeriod(value: string | undefined): { month: number; year: number | null } | null {
  if (!value?.trim()) return null;
  const text = value.trim();
  const monthOnly = /^(0?[1-9]|1[0-2])$/.exec(text);
  if (monthOnly) return { month: Number(monthOnly[1]) - 1, year: null };
  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) return null;
  const date = new Date(parsed);
  return { month: date.getUTCMonth(), year: date.getUTCFullYear() };
}

export function analyzeUpload(rows: RawRow[], mapping: FieldMapping): UploadAnalysis {
  const issues: QualityIssue[] = [];
  const records: DemoRecord[] = [];
  const required = uploadFields.filter((field) => field.required);
  const missingMappings = required.filter((field) => !mapping[field.key]);
  for (const field of missingMappings) issues.push({ row: 0, kind: 'error', code: 'mapping_required', fields: [field.key], message: `Map a column to required field “${field.label}”.` });
  if (rows.length === 0) issues.push({ row: 0, kind: 'error', code: 'empty_file', fields: [], message: 'No data rows were found.' });
  const usedIdentifiers = new Set<string>();
  const years = new Set<number>();
  let duplicates = 0;
  let invalidCount = 0;
  const fieldsPresent: UploadField[] = (Object.keys(mapping) as UploadField[]).filter((key) => Boolean(mapping[key]));
  const supports: UploadSupports = {
    gwp: fieldsPresent.includes('gwp'), nwp: fieldsPresent.includes('gwp') && fieldsPresent.includes('ceded'), earned: fieldsPresent.includes('earned'), incurred: fieldsPresent.includes('incurred'),
    expenses: fieldsPresent.includes('expenses'), paid: fieldsPresent.includes('paid'), outstanding: fieldsPresent.includes('outstanding'),
    claims: fieldsPresent.includes('claims'), exposure: fieldsPresent.includes('exposure'), frequency: fieldsPresent.includes('claims') && fieldsPresent.includes('exposure'), region: fieldsPresent.includes('region'),
  };
  rows.forEach((row, index) => {
    const displayRow = index + 2;
    const line = parseLine(mapping.line ? row[mapping.line] : undefined);
    const period = parsePeriod(mapping.period ? row[mapping.period] : undefined);
    const earned = parseNumber(mapping.earned ? row[mapping.earned] : undefined);
    const incurred = parseNumber(mapping.incurred ? row[mapping.incurred] : undefined);
    const rowProblems: string[] = [];
    if (!line) rowProblems.push('line');
    if (!period) rowProblems.push('period');
    if (earned === null) rowProblems.push('earned');
    if (incurred === null) rowProblems.push('incurred');
    if (earned !== null && earned < 0) rowProblems.push('earned:negative');
    if (incurred !== null && incurred < 0) rowProblems.push('incurred:negative');
    const mappedRegion = mapping.region ? parseRegion(row[mapping.region]) : 'North';
    if (mapping.region && !mappedRegion) rowProblems.push('region:unrecognized');
    const numericValues: Partial<Record<UploadField, number | null>> = {};
    for (const key of ['gwp', 'ceded', 'paid', 'outstanding', 'expenses', 'claims', 'exposure'] as const) {
      if (!mapping[key]) continue;
      const number = parseNumber(row[mapping[key]!]);
      numericValues[key] = number;
      if (number === null) rowProblems.push(key);
      else if (number < 0) rowProblems.push(`${key}:negative`);
    }
    if (period?.year !== null && period?.year !== undefined) years.add(period.year);
    if (rowProblems.length) {
      invalidCount += 1;
      issues.push({ row: displayRow, kind: 'error', code: 'invalid_row', fields: rowProblems, message: `Row ${displayRow} has missing, unrecognized, or invalid required values: ${rowProblems.join(', ')}.` });
      return;
    }
    if (numericValues.gwp !== undefined && numericValues.ceded !== undefined && numericValues.gwp !== null && numericValues.ceded !== null && numericValues.ceded > numericValues.gwp) {
      invalidCount += 1; issues.push({ row: displayRow, kind: 'error', code: 'ceded_exceeds_gross', fields: ['gwp', 'ceded'], message: `Row ${displayRow}: ceded written premium exceeds gross written premium.` }); return;
    }
    const identifier = mapping.id ? row[mapping.id]?.trim() : '';
    if (identifier && usedIdentifiers.has(identifier)) {
      duplicates += 1; invalidCount += 1;
      issues.push({ row: displayRow, kind: 'error', code: 'duplicate_id', fields: ['id'], message: `Duplicate record identifier “${identifier}”; this row is excluded from calculations but retained in the source preview.` });
      return;
    }
    if (identifier) usedIdentifiers.add(identifier);
    const paid = numericValues.paid ?? null;
    const outstanding = numericValues.outstanding ?? null;
    if (paid !== null && outstanding !== null && Math.abs((paid + outstanding) - incurred!) > 0.02) {
      invalidCount += 1;
      issues.push({ row: displayRow, kind: 'error', code: 'claim_reconciliation', fields: ['paid', 'outstanding', 'incurred'], message: `Row ${displayRow}: paid claims plus outstanding reserves do not reconcile to incurred claims within $0.02.` });
      return;
    }
    if (numericValues.claims !== undefined && (!Number.isInteger(numericValues.claims) || numericValues.claims! < 0)) {
      invalidCount += 1; issues.push({ row: displayRow, kind: 'error', code: 'invalid_claim_count', fields: ['claims'], message: `Row ${displayRow}: claim count must be a non-negative whole number.` }); return;
    }
    if (numericValues.exposure !== undefined && numericValues.exposure !== null && numericValues.exposure <= 0) {
      invalidCount += 1; issues.push({ row: displayRow, kind: 'error', code: 'invalid_exposure', fields: ['exposure'], message: `Row ${displayRow}: exposure units must be greater than zero.` }); return;
    }
    records.push({ month: period!.month, line: line!, region: mappedRegion ?? 'North', gwp: numericValues.gwp ?? 0, nwp: numericValues.gwp !== null && numericValues.gwp !== undefined && numericValues.ceded !== null && numericValues.ceded !== undefined ? numericValues.gwp - numericValues.ceded : 0, earned: earned!, incurred: incurred!, paid: paid ?? 0, outstanding: outstanding ?? 0, expenses: numericValues.expenses ?? 0, claims: numericValues.claims ?? 0, exposure: numericValues.exposure ?? 0 });
  });
  if (years.size > 1) {
    issues.push({ row: 0, kind: 'warning', code: 'multiple_years', fields: ['period'], message: 'The mapped date column contains multiple years. The current chart model groups by month-of-year; use one calendar year per upload to avoid combining different years.' });
  }
  const validRows = records.length;
  if (!mapping.id) issues.push({ row: 0, kind: 'warning', code: 'no_identifier', fields: [], message: 'No unique record identifier is mapped. Duplicate rows cannot be reliably identified; records are retained as supplied.' });
  const hasRecords = records.length > 0;
  const available = Object.fromEntries(Object.entries(supports).map(([key, value]) => [key, Boolean(value && hasRecords)])) as UploadSupports;
  return { records, issues, validCount: validRows, invalidCount, duplicateCount: duplicates, yearLabel: years.size === 1 ? String([...years][0]) : years.size ? 'Multiple years' : 'Uploaded period', supports: available };
}

export function activeMetricsAvailability(supports: UploadSupports) {
  return { gwp: supports.gwp, nwp: supports.nwp, earned: supports.earned, incurred: supports.incurred, lossRatio: supports.earned && supports.incurred, expenseRatio: supports.earned && supports.expenses, combinedRatio: supports.earned && supports.incurred && supports.expenses, underwritingResult: supports.earned && supports.incurred && supports.expenses, claimPosition: supports.paid && supports.outstanding, frequency: supports.frequency, severity: supports.claims, region: supports.region };
}
