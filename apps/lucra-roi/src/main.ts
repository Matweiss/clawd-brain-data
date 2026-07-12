import { installDealStatePersistence } from './state';
import { buildCashFlow, buildSensitivity, type CoreInputs, type SeasonalityProfile } from './financial';
import { ScenarioStore, type ScenarioRecord } from './scenarios';

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

function scenarioSummary(record: ScenarioRecord): string {
  const value = (id: string, fallback = '—') => String(record.state.fields[id] ?? fallback);
  return `${value('i-vis')} visitors · $${value('i-arpu')} ARPU · ${value('i-opt')}% opt-in · ${value('i-lift')}% lift`;
}

function safeText(value: string): string { return value.replace(/[<>&"]/g, ''); }

function installScenarioWorkspace(): void {
  const mount = document.getElementById('scenario-workspace');
  if (!mount) return;
  const store = new ScenarioStore();
  const list = mount.querySelector<HTMLElement>('[data-scenario-list]')!;
  const compare = mount.querySelector<HTMLElement>('[data-scenario-compare]')!;
  const name = mount.querySelector<HTMLInputElement>('#scenario-name')!;
  const selected = new Set<string>();
  const render = (): void => {
    const records = store.list();
    list.innerHTML = records.length ? records.map((record) => `<article class="scenario-row" data-id="${record.id}"><label><input type="checkbox" data-compare ${selected.has(record.id) ? 'checked' : ''}><span><strong>${safeText(record.name)}</strong><small>${scenarioSummary(record)}</small></span></label><div><button type="button" data-load>Load</button><button type="button" data-clone>Clone</button><button type="button" data-delete aria-label="Delete ${safeText(record.name)}">Delete</button></div></article>`).join('') : '<p class="scenario-empty">Save the current deal to create a comparison set.</p>';
    const compared = records.filter((record) => selected.has(record.id)).slice(0, 3);
    compare.innerHTML = compared.length > 1 ? compared.map((record) => `<div><strong>${safeText(record.name)}</strong><span>${scenarioSummary(record)}</span></div>`).join('') : '<p>Select two or three saved scenarios to compare their assumptions.</p>';
  };
  mount.querySelector<HTMLButtonElement>('[data-save-scenario]')!.addEventListener('click', () => { store.save(name.value); name.value = ''; render(); });
  mount.querySelector<HTMLInputElement>('#prospect-mode')!.addEventListener('change', (event) => document.body.classList.toggle('prospect-mode', (event.currentTarget as HTMLInputElement).checked));
  list.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    // Comparison checkboxes are handled by the change listener below. Do not
    // re-render on their click or the checked element is replaced mid-action.
    if (target.closest('[data-compare]')) return;
    const row = target.closest<HTMLElement>('[data-id]');
    if (!row) return;
    if (target.closest('[data-load]')) store.load(row.dataset.id!);
    if (target.closest('[data-clone]')) store.clone(row.dataset.id!);
    if (target.closest('[data-delete]')) { store.remove(row.dataset.id!); selected.delete(row.dataset.id!); }
    renderFinancialIntelligence(); render();
  });
  list.addEventListener('change', (event) => {
    const checkbox = (event.target as HTMLElement).closest<HTMLInputElement>('[data-compare]');
    const row = checkbox?.closest<HTMLElement>('[data-id]');
    if (!checkbox || !row) return;
    if (checkbox.checked && selected.size < 3) selected.add(row.dataset.id!); else selected.delete(row.dataset.id!);
    render();
  });
  render();
}

function announceReady(): void {
  document.documentElement.dataset.typedClient = 'ready';
  document.dispatchEvent(new CustomEvent('lucra:typed-client-ready'));
}

function boot(): void {
  installDealStatePersistence();
  installFinancialIntelligence();
  installScenarioWorkspace();
  announceReady();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
