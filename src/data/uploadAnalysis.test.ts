import { describe, expect, it } from 'vitest';
import { aggregate } from './demo';
import { calculateScenario } from './scenarios';
import { ambiguousMappingFields, analyzeUpload, inferMapping, parseCsv, type RawRow } from './uploadAnalysis';

const headers = ['record_id', 'insurance_line', 'region', 'reporting_date', 'gross_written_premium', 'ceded_written_premium', 'earned_premium', 'incurred_claims', 'paid_claims', 'outstanding_reserves', 'underwriting_expenses', 'claim_count', 'exposure_units'];
const validRow = ['R-1', 'Motor', 'West', '2025-12-31', '200', '20', '100', '60', '40', '20', '10', '2', '10'];
const mapping = inferMapping(headers);
const row = (cells: string[]): RawRow => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));

describe('browser upload analysis', () => {
  it('parses quoted CSV cells, escaped quotes, commas and embedded newlines', () => {
    const parsed = parseCsv('id,description,value\n1,"glass, repair","a ""quote"""\n2,"line one\nline two",3\n');
    expect(parsed).toEqual([{ id: '1', description: 'glass, repair', value: 'a "quote"' }, { id: '2', description: 'line one\nline two', value: '3' }]);
  });

  it('infers only unambiguous field mappings and lets users resolve collisions', () => {
    const ambiguous = ['line', 'reporting_date', 'earned', 'earned_premium', 'incurred_claims'];
    expect(ambiguousMappingFields(ambiguous)).toContain('earned');
    expect(inferMapping(ambiguous).earned).toBeUndefined();
    const result = analyzeUpload([row(validRow)], { ...mapping, earned: undefined });
    expect(result.issues.some((issue) => issue.code === 'mapping_required')).toBe(true);
  });

  it('maps, sums and exposes only supported measures from valid uploaded rows', () => {
    const result = analyzeUpload([row(validRow)], mapping);
    expect(result.records).toHaveLength(1);
    expect(result.yearLabel).toBe('2025');
    expect(result.records[0].month).toBe(11);
    expect(result.records[0].region).toBe('West');
    expect(result.records[0].nwp).toBe(180);
    expect(result.supports).toMatchObject({ gwp: true, nwp: true, earned: true, incurred: true, expenses: true, paid: true, outstanding: true, claims: true, exposure: true, frequency: true, region: true });
    const totals = aggregate(result.records);
    expect(totals.lossRatio).toBeCloseTo(0.6);
    expect(totals.frequency).toBeCloseTo(0.2);
    expect(totals.severity).toBeCloseTo(30);
  });

  it('excludes duplicate identifiers without modifying the original input rows', () => {
    const duplicate = [...validRow]; duplicate[3] = '2025-11-30';
    const source = [row(validRow), row(duplicate)];
    const result = analyzeUpload(source, mapping);
    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBe(1);
    expect(result.duplicateCount).toBe(1);
    expect(source[1].reporting_date).toBe('2025-11-30');
    expect(result.issues.some((issue) => issue.code === 'duplicate_id')).toBe(true);
  });

  it('reports invalid dates, unrecognized lines, and invalid or negative financial values', () => {
    const invalid = [...validRow]; invalid[1] = 'Life'; invalid[3] = 'not-a-date'; invalid[6] = '-1';
    const result = analyzeUpload([row(invalid)], mapping);
    expect(result.validCount).toBe(0);
    expect(result.invalidCount).toBe(1);
    expect(result.issues.some((issue) => issue.fields.includes('line'))).toBe(true);
    expect(result.issues.some((issue) => issue.fields.includes('period'))).toBe(true);
    expect(result.issues.some((issue) => issue.fields.includes('earned:negative'))).toBe(true);
    expect(result.supports.gwp).toBe(false);
  });

  it('checks claim reconciliation and gross-versus-ceded premium consistency', () => {
    const mismatch = [...validRow]; mismatch[9] = '19';
    expect(analyzeUpload([row(mismatch)], mapping).issues.some((issue) => issue.code === 'claim_reconciliation')).toBe(true);
    const cededTooHigh = [...validRow]; cededTooHigh[5] = '250';
    expect(analyzeUpload([row(cededTooHigh)], mapping).issues.some((issue) => issue.code === 'ceded_exceeds_gross')).toBe(true);
  });

  it('warns when multiple calendar years would otherwise be grouped by month', () => {
    const second = [...validRow]; second[0] = 'R-2'; second[3] = '2024-12-31';
    const result = analyzeUpload([row(validRow), row(second)], mapping);
    expect(result.yearLabel).toBe('Multiple years');
    expect(result.issues.some((issue) => issue.code === 'multiple_years' && issue.kind === 'warning')).toBe(true);
  });
});

describe('Scenario Lab arithmetic', () => {
  it('applies frequency and severity stress multipliers while holding earned premium and expenses fixed', () => {
    const baseline = aggregate([{ month: 0, line: 'Motor', region: 'North', gwp: 0, nwp: 0, earned: 1000, incurred: 400, paid: 300, outstanding: 100, expenses: 100, claims: 20, exposure: 100 }]);
    const result = calculateScenario(baseline, { frequencyIncreasePct: 10, severityIncreasePct: 20 });
    expect(result.baseline.lossRatio).toBeCloseTo(0.4);
    expect(result.baseline.combinedRatio).toBeCloseTo(0.5);
    expect(result.stressed.incurred).toBeCloseTo(528);
    expect(result.stressed.lossRatio).toBeCloseTo(0.528);
    expect(result.stressed.combinedRatio).toBeCloseTo(0.628);
    expect(result.stressed.underwritingResult).toBeCloseTo(372);
    expect(result.differences.underwritingResult).toBeCloseTo(-128);
  });
});
