import { installDealStatePersistence } from './state';
import { buildCashFlow, buildSensitivity, type CoreInputs, type SeasonalityProfile } from './financial';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function readNumber(id: string, fallback = 0): number {
  const element = document.getElementById(id) as HTMLInputElement | null;
  const value = Number(element?.value);
  return Number.isFinite(value) ? value : fallback;
}

function readCoreInputs(): CoreInputs {
  return {
    dailyVisitors: readNumber('i-vis', 1100),
    arpu: readNumber('i-arpu', 45),
    monthlyFee: readNumber('i-fee', 2500),
    optInPct: readNumber('i-opt', 10),
    liftPct: readNumber('i-lift', 15),
    locations: Math.max(1, readNumber('i-loc', 1))
  };
}

function renderFinancialIntelligence(): void {
  const mount = document.getElementById('financial-intelligence');
  if (!mount) return;
  const profile = (document.getElementById('seasonality-profile') as HTMLSelectElement | null)?.value as SeasonalityProfile || 'flat';
  const investment = readNumber('upfront-investment', 0);
  const inputs = readCoreInputs();
  const cashFlow = buildCashFlow(inputs, profile, investment);
  const sensitivity = buildSensitivity(inputs);
  const maxAbs = Math.max(1, ...cashFlow.map((point) => Math.abs(point.cumulative)));
  const maxSwing = Math.max(1, ...sensitivity.map((point) => point.swing));
  const payback = cashFlow.find((point) => point.cumulative >= 0)?.month;

  const chart = cashFlow.map((point) => {
    const height = Math.max(4, Math.round(Math.abs(point.cumulative) / maxAbs * 92));
    const positive = point.cumulative >= 0;
    return `<div class="cash-month"><div class="cash-bar ${positive ? 'positive' : 'negative'}" style="height:${height}px" aria-hidden="true"></div><span>${point.month}</span><output>${money.format(point.cumulative)}</output></div>`;
  }).join('');

  const tornado = sensitivity.map((point) => {
    const width = Math.max(10, Math.round(point.swing / maxSwing * 100));
    return `<div class="sensitivity-row"><div><strong>${point.label}</strong><span>-20% to +20%</span></div><div class="sensitivity-track"><span style="width:${width}%"></span></div><output>${money.format(point.low)} to ${money.format(point.high)}</output></div>`;
  }).join('');

  mount.querySelector<HTMLElement>('[data-cash-chart]')!.innerHTML = chart;
  mount.querySelector<HTMLElement>('[data-sensitivity]')!.innerHTML = tornado;
  mount.querySelector<HTMLElement>('[data-payback]')!.textContent = payback ? `Month ${payback}` : 'Beyond 12 months';
  mount.querySelector<HTMLElement>('[data-year-net]')!.textContent = money.format(cashFlow.at(-1)?.cumulative ?? 0);
}

function installFinancialIntelligence(): void {
  const mount = document.getElementById('financial-intelligence');
  if (!mount) return;
  mount.addEventListener('input', renderFinancialIntelligence);
  document.querySelectorAll('#roi input, #roi select').forEach((control) => control.addEventListener('input', renderFinancialIntelligence));
  renderFinancialIntelligence();
}

function announceReady(): void {
  document.documentElement.dataset.typedClient = 'ready';
  document.dispatchEvent(new CustomEvent('lucra:typed-client-ready'));
}

function boot(): void {
  installDealStatePersistence();
  installFinancialIntelligence();
  announceReady();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
