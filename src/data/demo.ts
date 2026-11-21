import { syntheticDataset as dataset } from './generateDemoDataset';
import type { DemoDataset, InsuranceLine, RegionId } from './schema';
import { regionIds } from './schema';

export type Line = InsuranceLine;
export type Region = 'North' | 'Central' | 'West' | 'South';
const lines: Line[] = ['Motor', 'Health', 'Property'];
const regions: Region[] = ['North', 'Central', 'West', 'South'];
const regionToId: Record<Region, RegionId> = { North: 'R-NORTH', Central: 'R-CENTRAL', West: 'R-WEST', South: 'R-SOUTH' };

export type DemoRecord = {
  month: number; line: Line; region: Region; gwp: number; nwp: number; earned: number; incurred: number;
  paid: number; outstanding: number; expenses: number; claims: number; exposure: number;
};

function activeMonths(startMonth: number, month: number) { return month >= startMonth && month < 12; }
export const demoDataset: DemoDataset = dataset;

export const demoRecords: DemoRecord[] = [];
for (let month = 0; month < 12; month += 1) {
  for (const line of lines) {
    for (const region of regions) {
      const regionId = regionToId[region];
      const policies = dataset.policies.filter((p) => p.productLine === line && p.regionId === regionId);
      const written = policies.filter((p) => p.startMonth === month);
      const inForce = policies.filter((p) => activeMonths(p.startMonth, month));
      const claims = dataset.claims.filter((c) => c.reportingMonth === month && policies.some((p) => p.policyId === c.policyId));
      const expenses = dataset.expenses.filter((e) => e.month === month && e.productLine === line && e.regionId === regionId).reduce((sum, e) => sum + e.amount, 0);
      const gwp = written.reduce((sum, p) => sum + p.writtenPremium, 0);
      const nwp = written.reduce((sum, p) => sum + p.writtenPremium - p.cededWrittenPremium, 0);
      const earned = inForce.reduce((sum, p) => sum + p.writtenPremium / 12, 0);
      demoRecords.push({
        month, line, region, gwp, nwp, earned,
        incurred: claims.reduce((sum, c) => sum + c.incurredAmount, 0),
        paid: claims.reduce((sum, c) => sum + c.paidAmount, 0),
        outstanding: claims.reduce((sum, c) => sum + c.outstandingReserve, 0),
        expenses,
        claims: claims.length,
        exposure: inForce.length / 12,
      });
    }
  }
}

export type Metrics = {
  gwp: number; nwp: number; earned: number; incurred: number; paid: number; outstanding: number;
  expenses: number; claims: number; exposure: number; lossRatio: number; expenseRatio: number;
  combinedRatio: number; underwritingResult: number; frequency: number; severity: number;
};

export function aggregate(records: DemoRecord[]): Metrics {
  const totals = records.reduce((sum, row) => ({
    gwp: sum.gwp + row.gwp, nwp: sum.nwp + row.nwp, earned: sum.earned + row.earned,
    incurred: sum.incurred + row.incurred, paid: sum.paid + row.paid, outstanding: sum.outstanding + row.outstanding,
    expenses: sum.expenses + row.expenses, claims: sum.claims + row.claims, exposure: sum.exposure + row.exposure,
  }), { gwp: 0, nwp: 0, earned: 0, incurred: 0, paid: 0, outstanding: 0, expenses: 0, claims: 0, exposure: 0 });
  const lossRatio = totals.earned ? totals.incurred / totals.earned : 0;
  const expenseRatio = totals.earned ? totals.expenses / totals.earned : 0;
  return {
    ...totals, lossRatio, expenseRatio, combinedRatio: lossRatio + expenseRatio,
    underwritingResult: totals.earned - totals.incurred - totals.expenses,
    frequency: totals.exposure ? totals.claims / totals.exposure : 0,
    severity: totals.claims ? totals.incurred / totals.claims : 0,
  };
}

export function filterRecords(records: DemoRecord[], range: number, line: Line | 'all', region: Region | 'all') {
  return records.filter((row) => row.month >= 12 - range && (line === 'all' || row.line === line) && (region === 'all' || row.region === region));
}
export function byLine(records: DemoRecord[]) { return lines.filter((line) => records.some((row) => row.line === line)).map((line) => ({ line, ...aggregate(records.filter((row) => row.line === line)) })); }
export function byRegion(records: DemoRecord[]) { return regions.filter((region) => records.some((row) => row.region === region)).map((region) => ({ region, ...aggregate(records.filter((row) => row.region === region)) })); }
export function byMonth(records: DemoRecord[]) {
  return Array.from(new Set(records.map((row) => row.month))).sort((a, b) => a - b).map((month) => {
    const m = aggregate(records.filter((row) => row.month === month));
    return { month, gwp: m.gwp / 1_000_000, nwp: m.nwp / 1_000_000, earned: m.earned / 1_000_000, incurred: m.incurred / 1_000_000, paid: m.paid / 1_000_000, outstanding: m.outstanding / 1_000_000, underwritingResult: m.underwritingResult / 1_000_000 };
  });
}
export function byClaimPosition(records: DemoRecord[]) {
  const m = aggregate(records);
  return [{ name: 'Paid', value: m.paid / 1_000_000 }, { name: 'Outstanding', value: m.outstanding / 1_000_000 }];
}

export function segmentSummary(range: number, line: Line | 'all', region: Region | 'all') {
  const months = Array.from({ length: range }, (_, index) => 12 - range + index);
  const selectedRegions = region === 'all' ? regions : [region];
  const selectedLines = lines.filter((value) => line === 'all' || value === line);
  const claimByPolicy = new Map<string, typeof dataset.claims>();
  for (const claim of dataset.claims) claimByPolicy.set(claim.policyId, [...(claimByPolicy.get(claim.policyId) ?? []), claim]);
  return (['Retail', 'SME', 'Corporate'] as const).map((segment) => {
    const customers = new Map(dataset.customers.filter((c) => c.customerSegment === segment).map((c) => [c.customerId, c]));
    const policies = dataset.policies.filter((p) => customers.has(p.customerId) && (line === 'all' || p.productLine === line) && (region === 'all' || p.regionId === regionToId[region]));
    const selectedClaims = policies.flatMap((p) => (claimByPolicy.get(p.policyId) ?? []).filter((c) => months.includes(c.reportingMonth)));
    const records: DemoRecord[] = [];
    for (const month of months) {
      for (const productLine of selectedLines) {
        let gwp = 0; let nwp = 0; let earned = 0; let incurred = 0; let paid = 0; let outstanding = 0; let expenses = 0; let claimCount = 0; let exposure = 0;
        for (const selectedRegion of selectedRegions) {
          const regionId = regionToId[selectedRegion];
          const monthPolicies = policies.filter((p) => p.productLine === productLine && p.regionId === regionId);
          const written = monthPolicies.filter((p) => p.startMonth === month);
          const inForce = monthPolicies.filter((p) => activeMonths(p.startMonth, month));
          const segmentEarned = inForce.reduce((sum, p) => sum + p.writtenPremium / 12, 0);
          const totalEarned = dataset.policies.filter((p) => p.productLine === productLine && p.regionId === regionId && activeMonths(p.startMonth, month)).reduce((sum, p) => sum + p.writtenPremium / 12, 0);
          const regionExpenses = dataset.expenses.filter((e) => e.month === month && e.productLine === productLine && e.regionId === regionId).reduce((sum, e) => sum + e.amount, 0);
          const policyIds = new Set(monthPolicies.map((p) => p.policyId));
          const claims = selectedClaims.filter((c) => c.reportingMonth === month && policyIds.has(c.policyId));
          gwp += written.reduce((sum, p) => sum + p.writtenPremium, 0);
          nwp += written.reduce((sum, p) => sum + p.writtenPremium - p.cededWrittenPremium, 0);
          earned += segmentEarned;
          incurred += claims.reduce((sum, c) => sum + c.incurredAmount, 0);
          paid += claims.reduce((sum, c) => sum + c.paidAmount, 0);
          outstanding += claims.reduce((sum, c) => sum + c.outstandingReserve, 0);
          expenses += totalEarned ? regionExpenses * segmentEarned / totalEarned : 0;
          claimCount += claims.length;
          exposure += inForce.length / 12;
        }
        records.push({ month, line: productLine, region: selectedRegions[0], gwp, nwp, earned, incurred, paid, outstanding, expenses, claims: claimCount, exposure });
      }
    }
    const summary = aggregate(records);
    const segmentPolicies = new Set(policies.filter((p) => months.some((month) => activeMonths(p.startMonth, month))).map((p) => p.policyId));
    return { segment, ...summary, policyCount: segmentPolicies.size, claimCount: selectedClaims.length, exposureShare: 0, claimsShare: 0 };
  }).map((row, _, all) => ({ ...row, exposureShare: all.reduce((s, r) => s + r.exposure, 0) ? row.exposure / all.reduce((s, r) => s + r.exposure, 0) : 0, claimsShare: all.reduce((s, r) => s + r.claimCount, 0) ? row.claimCount / all.reduce((s, r) => s + r.claimCount, 0) : 0 }));
}

export const dataCatalog = [
  { key: 'policies', label: 'Policies', fields: ['policyId', 'customerId', 'productLine', 'productType', 'policyType', 'policyStartDate', 'policyEndDate', 'writtenPremium', 'coverageAmount', 'deductible', 'policyStatus', 'regionId'], coverage: '2025-01 to 2025-12' },
  { key: 'customers', label: 'Customers', fields: ['customerId', 'customerSegment', 'regionId', 'customerType', 'relationshipStartDate'], coverage: 'Synthetic customer segments; no personal identifiers' },
  { key: 'claims', label: 'Claims', fields: ['claimId', 'policyId', 'claimDate', 'accidentDate', 'reportingDate', 'claimStatus', 'paidAmount', 'outstandingReserve', 'incurredAmount', 'claimCategory'], coverage: '2025 reporting periods' },
  { key: 'vehicles', label: 'Vehicles · Motor only', fields: ['vehicleId', 'policyId', 'vehicleType', 'modelYear', 'vehicleValue', 'repairCostBand'], coverage: 'Motor policies only' },
  { key: 'properties', label: 'Properties · Property only', fields: ['propertyId', 'policyId', 'propertyType', 'insuredValue', 'constructionType', 'geographicExposure'], coverage: 'Property policies only' },
  { key: 'healthClaims', label: 'Health claim details · Health only', fields: ['claimId', 'policyId', 'treatmentCategory', 'medicalCost', 'serviceDate', 'reportingDate', 'claimStatus'], coverage: 'Health claims only' },
  { key: 'expenses', label: 'Underwriting expenses', fields: ['expenseId', 'expenseType', 'month', 'amount', 'productLine', 'regionId'], coverage: '2025 monthly periods' },
  { key: 'reinsuranceTreaties', label: 'Reinsurance treaties', fields: ['treatyId', 'treatyType', 'productLine', 'retentionShare', 'cededShare', 'treatyLimit', 'coveragePeriod'], coverage: 'Illustrative 2025 quota-share assumptions' },
  { key: 'investments', label: 'Investment assets', fields: ['assetId', 'assetClass', 'marketValue', 'annualReturn', 'valuationDate', 'durationYears', 'creditExposure'], coverage: 'Illustrative valuation date: 2025-12-31' },
] as const;

export function getDatasetTable(key: string): unknown[] {
  const mapping: Record<string, unknown[]> = {
    policies: dataset.policies, customers: dataset.customers, claims: dataset.claims, vehicles: dataset.vehicles,
    properties: dataset.properties, healthClaims: dataset.healthClaims, expenses: dataset.expenses,
    reinsuranceTreaties: dataset.reinsuranceTreaties, investments: dataset.investments,
  };
  return mapping[key] ?? [];
}
export const regionIdOrder = regionIds;
