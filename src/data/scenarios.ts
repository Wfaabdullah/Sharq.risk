import type { Metrics } from './demo';

export type ScenarioAssumptions = { frequencyIncreasePct: number; severityIncreasePct: number };
export type ScenarioResult = {
  baseline: { incurred: number; lossRatio: number; combinedRatio: number; underwritingResult: number };
  stressed: { incurred: number; lossRatio: number; combinedRatio: number; underwritingResult: number };
  differences: { incurred: number; lossRatio: number; combinedRatio: number; underwritingResult: number };
};

/**
 * Transparent one-period arithmetic stress, not a forecast. The baseline claim amount is
 * multiplied by (1 + frequency change) and (1 + severity change); premium and expenses are
 * held constant. No claim-level distributions, probability, correlation, or management action
 * are modeled.
 */
export function calculateScenario(metrics: Metrics, assumptions: ScenarioAssumptions): ScenarioResult {
  const frequency = assumptions.frequencyIncreasePct / 100;
  const severity = assumptions.severityIncreasePct / 100;
  const stressedIncurred = metrics.incurred * (1 + frequency) * (1 + severity);
  const baselineLossRatio = metrics.earned > 0 ? metrics.incurred / metrics.earned : 0;
  const stressedLossRatio = metrics.earned > 0 ? stressedIncurred / metrics.earned : 0;
  const baselineExpenseRatio = metrics.earned > 0 ? metrics.expenses / metrics.earned : 0;
  const stressedExpenseRatio = baselineExpenseRatio;
  const baselineResult = metrics.earned - metrics.incurred - metrics.expenses;
  const stressedResult = metrics.earned - stressedIncurred - metrics.expenses;
  const baseline = { incurred: metrics.incurred, lossRatio: baselineLossRatio, combinedRatio: baselineLossRatio + baselineExpenseRatio, underwritingResult: baselineResult };
  const stressed = { incurred: stressedIncurred, lossRatio: stressedLossRatio, combinedRatio: stressedLossRatio + stressedExpenseRatio, underwritingResult: stressedResult };
  return { baseline, stressed, differences: { incurred: stressed.incurred - baseline.incurred, lossRatio: stressed.lossRatio - baseline.lossRatio, combinedRatio: stressed.combinedRatio - baseline.combinedRatio, underwritingResult: stressed.underwritingResult - baseline.underwritingResult } };
}
