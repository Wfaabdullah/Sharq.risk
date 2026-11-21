export type InsuranceLine = 'Motor' | 'Health' | 'Property';
export type RegionId = 'R-NORTH' | 'R-CENTRAL' | 'R-WEST' | 'R-SOUTH';

export type Customer = {
  customerId: string;
  customerSegment: 'Retail' | 'SME' | 'Corporate';
  regionId: RegionId;
  customerType: 'Individual' | 'Business';
  relationshipStartDate: string;
};

export type Policy = {
  policyId: string;
  customerId: string;
  productLine: InsuranceLine;
  productType: string;
  policyType: string;
  policyStartDate: string;
  policyEndDate: string;
  startMonth: number;
  regionId: RegionId;
  writtenPremium: number;
  cededWrittenPremium: number;
  coverageAmount: number;
  deductible: number;
  policyStatus: 'In Force' | 'Cancelled';
};

export type Claim = {
  claimId: string;
  policyId: string;
  claimDate: string;
  accidentDate: string;
  reportingDate: string;
  reportingMonth: number;
  claimStatus: 'Paid' | 'Open' | 'Closed';
  paidAmount: number;
  outstandingReserve: number;
  incurredAmount: number;
  claimCategory: string;
};

export type Vehicle = {
  vehicleId: string;
  policyId: string;
  vehicleType: 'Private car' | 'Commercial vehicle';
  modelYear: number;
  vehicleValue: number;
  repairCostBand: 'Standard' | 'Elevated';
};

export type InsuredProperty = {
  propertyId: string;
  policyId: string;
  propertyType: 'Residential' | 'Commercial';
  insuredValue: number;
  constructionType: 'Concrete' | 'Steel' | 'Mixed';
  geographicExposure: 'Low' | 'Moderate' | 'Elevated';
};

export type HealthClaimDetail = {
  claimId: string;
  policyId: string;
  treatmentCategory: string;
  medicalCost: number;
  serviceDate: string;
  reportingDate: string;
  claimStatus: Claim['claimStatus'];
};

export type Expense = {
  expenseId: string;
  expenseType: 'Commission' | 'Administration';
  month: number;
  amount: number;
  productLine: InsuranceLine;
  regionId: RegionId;
};

export type ReinsuranceTreaty = {
  treatyId: string;
  treatyType: 'Quota Share';
  productLine: InsuranceLine;
  retentionShare: number;
  cededShare: number;
  treatyLimit: number;
  coveragePeriod: string;
};

export type InvestmentAsset = {
  assetId: string;
  assetClass: 'Government bonds' | 'Corporate bonds' | 'Cash' | 'Equities';
  marketValue: number;
  annualReturn: number;
  valuationDate: string;
  durationYears?: number;
  creditExposure?: 'High grade' | 'Investment grade' | 'Not applicable';
};

export type DemoDataset = {
  customers: Customer[];
  policies: Policy[];
  claims: Claim[];
  vehicles: Vehicle[];
  properties: InsuredProperty[];
  healthClaims: HealthClaimDetail[];
  expenses: Expense[];
  reinsuranceTreaties: ReinsuranceTreaty[];
  investments: InvestmentAsset[];
};

export const regionIds: RegionId[] = ['R-NORTH', 'R-CENTRAL', 'R-WEST', 'R-SOUTH'];
export const regionLabels: Record<RegionId, string> = { 'R-NORTH': 'North', 'R-CENTRAL': 'Central', 'R-WEST': 'West', 'R-SOUTH': 'South' };
