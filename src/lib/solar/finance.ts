import type { SiteConfig } from './types';

export interface FinancingResult {
  principal: number;
  months: number;
  monthlyPaymentUsd: number;
  totalRepaymentUsd: number;
  totalInterestUsd: number;
  monthlyCashFlowUsd: number;
  gridCostOverTermUsd: number;
  netPositionOverTermUsd: number;
}

/** Standard amortizing-loan payment against system cost, compared with staying on the grid for the same term. */
export function computeFinancing(totalUsd: number, estMonthlySavingsUsd: number, site: SiteConfig): FinancingResult {
  const principal = Math.max(0, totalUsd - site.downPaymentUsd);
  const months = Math.max(1, Math.round(site.loanTermYears * 12));
  const monthlyRate = site.loanInterestRatePct / 100 / 12;

  let monthlyPaymentUsd: number;
  if (monthlyRate <= 0) {
    monthlyPaymentUsd = principal / months;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    monthlyPaymentUsd = (principal * monthlyRate * factor) / (factor - 1);
  }
  if (!Number.isFinite(monthlyPaymentUsd)) monthlyPaymentUsd = 0;

  const totalRepaymentUsd = monthlyPaymentUsd * months;
  const totalInterestUsd = Math.max(0, totalRepaymentUsd - principal);
  const monthlyCashFlowUsd = estMonthlySavingsUsd - monthlyPaymentUsd;
  const gridCostOverTermUsd = site.monthlyGridBillUsd * months;
  const netPositionOverTermUsd = gridCostOverTermUsd - (site.downPaymentUsd + totalRepaymentUsd);

  return { principal, months, monthlyPaymentUsd, totalRepaymentUsd, totalInterestUsd, monthlyCashFlowUsd, gridCostOverTermUsd, netPositionOverTermUsd };
}
