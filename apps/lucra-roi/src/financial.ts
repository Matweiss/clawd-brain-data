export type SeasonalityProfile = 'flat' | 'venue' | 'golf' | 'multi';

export interface CoreInputs {
  dailyVisitors: number;
  arpu: number;
  monthlyFee: number;
  optInPct: number;
  liftPct: number;
  locations: number;
}

export interface CashFlowPoint {
  month: number;
  multiplier: number;
  grossLift: number;
  netCashFlow: number;
  cumulative: number;
}

export interface SensitivityPoint {
  key: keyof Pick<CoreInputs, 'dailyVisitors' | 'arpu' | 'optInPct' | 'liftPct'>;
  label: string;
  low: number;
  base: number;
  high: number;
  swing: number;
}

const PROFILES: Record<SeasonalityProfile, readonly number[]> = {
  flat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  venue: [0.82, 0.86, 0.94, 1.02, 1.08, 1.12, 1.16, 1.12, 1.04, 0.98, 0.9, 0.96],
  golf: [0.78, 0.82, 0.96, 1.08, 1.16, 1.2, 1.14, 1.1, 1.02, 0.96, 0.9, 0.88],
  multi: [0.9, 0.92, 0.96, 1, 1.04, 1.08, 1.1, 1.08, 1.04, 1, 0.96, 0.92]
};

export function monthlyGrossLift(inputs: CoreInputs): number {
  return inputs.dailyVisitors * 30 * (inputs.optInPct / 100) * inputs.arpu * (inputs.liftPct / 100) * inputs.locations;
}

export function normalizedProfile(profile: SeasonalityProfile): number[] {
  const values = [...PROFILES[profile]];
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.map((value) => value / mean);
}

export function buildCashFlow(
  inputs: CoreInputs,
  profile: SeasonalityProfile,
  upfrontInvestment = 0
): CashFlowPoint[] {
  const baseGross = monthlyGrossLift(inputs);
  const monthlyFee = inputs.monthlyFee * inputs.locations;
  let cumulative = -Math.max(0, upfrontInvestment);
  return normalizedProfile(profile).map((multiplier, index) => {
    const grossLift = baseGross * multiplier;
    const netCashFlow = grossLift - monthlyFee;
    cumulative += netCashFlow;
    return { month: index + 1, multiplier, grossLift, netCashFlow, cumulative };
  });
}

export function buildSensitivity(inputs: CoreInputs, variance = 0.2): SensitivityPoint[] {
  const base = monthlyGrossLift(inputs);
  const definitions: Array<[SensitivityPoint['key'], string]> = [
    ['dailyVisitors', 'Daily visitors'],
    ['optInPct', 'Opt-in rate'],
    ['liftPct', 'ARPU lift'],
    ['arpu', 'Current ARPU']
  ];
  return definitions.map(([key, label]) => {
    const low = monthlyGrossLift({ ...inputs, [key]: inputs[key] * (1 - variance) });
    const high = monthlyGrossLift({ ...inputs, [key]: inputs[key] * (1 + variance) });
    return { key, label, low, base, high, swing: high - low };
  }).sort((a, b) => b.swing - a.swing);
}
