import type { Claim, Customer, DemoDataset, Expense, InsuranceLine, Policy, RegionId } from './schema';
import { regionIds } from './schema';

const lineProfiles: Record<InsuranceLine, { premium: number; ceded: number; expense: number; claimChance: number }> = {
  Motor: { premium: 9_200, ceded: 0.07, expense: 0.23, claimChance: 0.22 },
  Health: { premium: 12_400, ceded: 0.04, expense: 0.18, claimChance: 0.36 },
  Property: { premium: 15_800, ceded: 0.11, expense: 0.24, claimChance: 0.15 },
};
const lines: InsuranceLine[] = ['Motor', 'Health', 'Property'];
const lineRegions = [1.08, 1.0, 0.92, 0.84];
const segmentWeights = [0.58, 0.29, 0.13];
const segments: Customer['customerSegment'][] = ['Retail', 'SME', 'Corporate'];
const regionById = (id: RegionId) => regionIds.indexOf(id);

export function generateDemoDataset(seed = 20251121): DemoDataset {
  let state = seed >>> 0;
  const random = () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
  const choose = <T,>(items: T[]) => items[Math.floor(random() * items.length)];
  const between = (min: number, max: number) => min + random() * (max - min);
  const date = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const customers: Customer[] = [];
  for (const regionId of regionIds) {
    segments.forEach((customerSegment, segmentIndex) => {
      for (let n = 0; n < 24; n += 1) {
        const customerId = `CUS-${regionId.slice(2, 5)}-${customerSegment.slice(0, 3).toUpperCase()}-${String(n + 1).padStart(3, '0')}`;
        customers.push({ customerId, customerSegment, regionId, customerType: customerSegment === 'Retail' ? 'Individual' : 'Business', relationshipStartDate: date(2020 + (n % 5), n % 12, 1 + (n % 26)) });
      }
      void segmentIndex;
    });
  }

  const customersByRegionSegment = (regionId: RegionId, segment: Customer['customerSegment']) => customers.filter((c) => c.regionId === regionId && c.customerSegment === segment);
  const policies: Policy[] = [];
  const vehicles: DemoDataset['vehicles'] = [];
  const properties: DemoDataset['properties'] = [];
  let policyNumber = 0;
  for (let month = 0; month < 12; month += 1) {
    for (const regionId of regionIds) {
      for (const productLine of lines) {
        for (let n = 0; n < 12; n += 1) {
          policyNumber += 1;
          const pick = random();
          const customerSegment = pick < segmentWeights[0] ? 'Retail' : pick < segmentWeights[0] + segmentWeights[1] ? 'SME' : 'Corporate';
          const customer = choose(customersByRegionSegment(regionId, customerSegment));
          const profile = lineProfiles[productLine];
          const policyId = `POL-${String(policyNumber).padStart(6, '0')}`;
          const startDay = 1 + Math.floor(random() * 25);
          const base = profile.premium * lineRegions[regionById(regionId)] * between(0.68, 1.42);
          const writtenPremium = Math.round(base * 100) / 100;
          const policyType = productLine === 'Motor' ? (customerSegment === 'Retail' ? 'Private motor' : 'Commercial motor') : productLine === 'Health' ? (customerSegment === 'Retail' ? 'Individual health' : 'Group health') : (customerSegment === 'Retail' ? 'Residential property' : 'Commercial property');
          const productType = productLine === 'Motor' ? (customerSegment === 'Retail' ? 'Comprehensive motor' : 'Fleet motor') : productLine === 'Health' ? (customerSegment === 'Retail' ? 'Individual medical' : 'Group medical') : (customerSegment === 'Retail' ? 'Home protection' : 'Commercial property');
          const policy: Policy = {
            policyId, customerId: customer.customerId, productLine, productType, policyType,
            policyStartDate: date(2025, month, startDay), policyEndDate: date(2026, month, startDay), startMonth: month,
            regionId, writtenPremium, cededWrittenPremium: Math.round(writtenPremium * profile.ceded * 100) / 100,
            coverageAmount: Math.round((productLine === 'Motor' ? between(35_000, 170_000) : productLine === 'Health' ? between(60_000, 300_000) : between(180_000, 1_450_000)) / 100) * 100,
            deductible: productLine === 'Health' ? Math.round(between(100, 900)) : Math.round(between(400, 3_500)), policyStatus: 'In Force',
          };
          policies.push(policy);
          if (productLine === 'Motor') vehicles.push({ vehicleId: `VEH-${String(policyNumber).padStart(6, '0')}`, policyId, vehicleType: customerSegment === 'Retail' ? 'Private car' : 'Commercial vehicle', modelYear: 2015 + Math.floor(random() * 11), vehicleValue: Math.round(between(35_000, 170_000)), repairCostBand: random() > 0.74 ? 'Elevated' : 'Standard' });
          if (productLine === 'Property') properties.push({ propertyId: `PRP-${String(policyNumber).padStart(6, '0')}`, policyId, propertyType: customerSegment === 'Retail' ? 'Residential' : 'Commercial', insuredValue: policy.coverageAmount, constructionType: choose(['Concrete', 'Steel', 'Mixed'] as const as unknown as string[]) as 'Concrete' | 'Steel' | 'Mixed', geographicExposure: choose(['Low', 'Moderate', 'Elevated'] as const as unknown as string[]) as 'Low' | 'Moderate' | 'Elevated' });
        }
      }
    }
  }

  const claims: Claim[] = [];
  const healthClaims: DemoDataset['healthClaims'] = [];
  let claimNumber = 0;
  for (const policy of policies) {
    const profile = lineProfiles[policy.productLine];
    if (random() > profile.claimChance) continue;
    claimNumber += 1;
    const month = policy.startMonth + Math.floor(random() * (12 - policy.startMonth));
    const claimDay = 1 + Math.floor(random() * 25);
    const accidentDate = date(2025, month, claimDay);
    const reportingDate = date(2025, month, Math.min(28, claimDay + Math.floor(random() * 4)));
    const severityBase = policy.productLine === 'Motor' ? 7_300 : policy.productLine === 'Health' ? 3_200 : 18_500;
    const incurredAmount = Math.round(severityBase * between(0.32, 3.15) * 100) / 100;
    const status: Claim['claimStatus'] = random() < 0.2 ? 'Paid' : random() < 0.44 ? 'Closed' : 'Open';
    const paidAmount = status === 'Open' ? Math.round(incurredAmount * between(0.43, 0.88) * 100) / 100 : incurredAmount;
    const outstandingReserve = Math.round((incurredAmount - paidAmount) * 100) / 100;
    const claimId = `CLM-${String(claimNumber).padStart(6, '0')}`;
    const categories: Record<InsuranceLine, string[]> = { Motor: ['Collision repair', 'Glass damage', 'Third-party liability'], Health: ['Outpatient care', 'Diagnostics', 'Inpatient care', 'Pharmacy'], Property: ['Water damage', 'Fire', 'Weather event', 'Theft'] };
    const claim: Claim = { claimId, policyId: policy.policyId, claimDate: accidentDate, accidentDate, reportingDate, reportingMonth: month, claimStatus: status, paidAmount, outstandingReserve, incurredAmount: paidAmount + outstandingReserve, claimCategory: choose(categories[policy.productLine]) };
    claims.push(claim);
    if (policy.productLine === 'Health') healthClaims.push({ claimId, policyId: policy.policyId, treatmentCategory: claim.claimCategory, medicalCost: claim.incurredAmount, serviceDate: accidentDate, reportingDate, claimStatus: status });
  }

  const expenses: Expense[] = [];
  const seasonal = [0.97, 0.99, 1.01, 1.0, 1.04, 1.02, 1.0, 1.03, 1.06, 1.03, 0.98, 1.08];
  let expenseNumber = 0;
  for (let month = 0; month < 12; month += 1) {
    for (const regionId of regionIds) {
      for (const productLine of lines) {
        const active = policies.filter((p) => p.productLine === productLine && p.regionId === regionId && p.startMonth <= month);
        const earned = active.reduce((sum, p) => sum + p.writtenPremium / 12, 0) * seasonal[month];
        const totalExpense = earned * lineProfiles[productLine].expense;
        for (const [expenseType, share] of [['Commission', 0.59], ['Administration', 0.41]] as const) {
          expenseNumber += 1;
          expenses.push({ expenseId: `EXP-${String(expenseNumber).padStart(5, '0')}`, expenseType, month, amount: Math.round(totalExpense * share * 100) / 100, productLine, regionId });
        }
      }
    }
  }

  const reinsuranceTreaties: DemoDataset['reinsuranceTreaties'] = lines.map((productLine, index) => ({ treatyId: `TREATY-${productLine.toUpperCase()}`, treatyType: 'Quota Share', productLine, retentionShare: 1 - lineProfiles[productLine].ceded, cededShare: lineProfiles[productLine].ceded, treatyLimit: [2_000_000, 1_500_000, 3_500_000][index], coveragePeriod: '2025-01-01 to 2025-12-31' }));
  const investments: DemoDataset['investments'] = [
    { assetId: 'AST-001', assetClass: 'Government bonds', marketValue: 4_800_000, annualReturn: 0.041, valuationDate: '2025-12-31', durationYears: 4.2, creditExposure: 'High grade' },
    { assetId: 'AST-002', assetClass: 'Corporate bonds', marketValue: 2_100_000, annualReturn: 0.053, valuationDate: '2025-12-31', durationYears: 3.1, creditExposure: 'Investment grade' },
    { assetId: 'AST-003', assetClass: 'Cash', marketValue: 850_000, annualReturn: 0.027, valuationDate: '2025-12-31', creditExposure: 'Not applicable' },
    { assetId: 'AST-004', assetClass: 'Equities', marketValue: 1_250_000, annualReturn: 0.062, valuationDate: '2025-12-31' },
  ];

  return { customers, policies, claims, vehicles, properties, healthClaims, expenses, reinsuranceTreaties, investments };
}

export const syntheticDataset = generateDemoDataset();
