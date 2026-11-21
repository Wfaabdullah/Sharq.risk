import { describe, expect, it } from 'vitest';
import { aggregate, demoDataset, demoRecords, filterRecords, segmentSummary } from './demo';
import { generateDemoDataset } from './generateDemoDataset';
import { messages, t } from '../i18n';

describe('SHARQ.RISK synthetic data foundation', () => {
  it('keeps English and Arabic translation catalogs structurally complete', () => {
    expect(Object.keys(messages.en).sort()).toEqual(Object.keys(messages.ar).sort());
    expect(t('ar', 'portfolioInsights')).not.toBe(t('en', 'portfolioInsights'));
    expect(t('ar', 'mLossFormula')).not.toBe(t('en', 'mLossFormula'));
  });

  it('reproduces the fixed-seed synthetic dataset', () => {
    const first = generateDemoDataset(7);
    const second = generateDemoDataset(7);
    expect(first.policies).toEqual(second.policies);
    expect(first.claims).toEqual(second.claims);
  });

  it('maintains primary and foreign-key relationships across core entities', () => {
    const customerIds = new Set(demoDataset.customers.map((row) => row.customerId));
    const policyIds = new Set(demoDataset.policies.map((row) => row.policyId));
    expect(customerIds.size).toBe(demoDataset.customers.length);
    expect(policyIds.size).toBe(demoDataset.policies.length);
    expect(demoDataset.policies.every((row) => customerIds.has(row.customerId))).toBe(true);
    expect(demoDataset.claims.every((row) => policyIds.has(row.policyId))).toBe(true);
    expect(demoDataset.vehicles.every((row) => policyIds.has(row.policyId))).toBe(true);
    expect(demoDataset.properties.every((row) => policyIds.has(row.policyId))).toBe(true);
    expect(demoDataset.healthClaims.every((row) => policyIds.has(row.policyId))).toBe(true);
  });

  it('reconciles incurred claims as paid plus outstanding reserves', () => {
    expect(demoDataset.claims.every((row) => Math.abs(row.incurredAmount - row.paidAmount - row.outstandingReserve) < 0.02)).toBe(true);
    expect(demoDataset.claims.every((row) => row.paidAmount <= row.incurredAmount + 0.01)).toBe(true);
    expect(demoDataset.claims.every((row) => row.claimStatus === 'Open' ? row.outstandingReserve > 0 : row.outstandingReserve === 0)).toBe(true);
  });

  it('calculates ratios from the selected data instead of fixed UI values', () => {
    const selected = filterRecords(demoRecords, 12, 'Motor', 'all');
    const result = aggregate(selected);
    expect(result.lossRatio).toBeCloseTo(result.incurred / result.earned, 10);
    expect(result.expenseRatio).toBeCloseTo(result.expenses / result.earned, 10);
    expect(result.combinedRatio).toBeCloseTo(result.lossRatio + result.expenseRatio, 10);
    expect(result.underwritingResult).toBeCloseTo(result.earned - result.incurred - result.expenses, 5);
    expect(result.frequency).toBeCloseTo(result.claims / result.exposure, 10);
    expect(result.severity).toBeCloseTo(result.incurred / result.claims, 10);
  });

  it('keeps paid and outstanding claims distinct and reconciled in aggregates', () => {
    const result = aggregate(demoRecords);
    expect(result.paid + result.outstanding).toBeCloseTo(result.incurred, 2);
  });

  it('filters periods, lines, and regions and returns segment calculations', () => {
    const selected = filterRecords(demoRecords, 3, 'Health', 'South');
    expect(selected.every((row) => row.month >= 9 && row.line === 'Health' && row.region === 'South')).toBe(true);
    const segments = segmentSummary(12, 'all', 'all');
    expect(segments.map((row) => row.segment)).toEqual(['Retail', 'SME', 'Corporate']);
    expect(segments.reduce((sum, row) => sum + row.exposureShare, 0)).toBeCloseTo(1, 8);
    const allPeriod = aggregate(filterRecords(demoRecords, 12, 'all', 'all'));
    expect(segments.reduce((sum, row) => sum + row.expenses, 0)).toBeCloseTo(allPeriod.expenses, 2);
    expect(segments.reduce((sum, row) => sum + row.earned, 0)).toBeCloseTo(allPeriod.earned, 2);
  });
});
