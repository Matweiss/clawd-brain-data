import { collectDealState, restoreDealState, type DealStateV1 } from './state';

export const SCENARIO_KEY = 'lucra-roi:scenarios';

export interface ScenarioRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  state: DealStateV1;
}

export function parseScenarios(raw: string | null): ScenarioRecord[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is ScenarioRecord => {
      if (!entry || typeof entry !== 'object') return false;
      const record = entry as Partial<ScenarioRecord>;
      return typeof record.id === 'string' && typeof record.name === 'string' &&
        typeof record.createdAt === 'string' && typeof record.updatedAt === 'string' &&
        Boolean(record.state && record.state.version === 1 && record.state.fields);
    });
  } catch {
    return [];
  }
}

export class ScenarioStore {
  constructor(private readonly storage: Storage = localStorage) {}
  list(): ScenarioRecord[] {
    return parseScenarios(this.storage.getItem(SCENARIO_KEY)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  save(name: string, state = collectDealState()): ScenarioRecord {
    const now = new Date().toISOString();
    const record: ScenarioRecord = { id: crypto.randomUUID(), name: name.trim() || `Scenario ${this.list().length + 1}`, createdAt: now, updatedAt: now, state };
    this.write([record, ...this.list()]);
    return record;
  }
  clone(id: string): ScenarioRecord | null {
    const source = this.list().find((record) => record.id === id);
    return source ? this.save(`${source.name} copy`, source.state) : null;
  }
  load(id: string): number {
    const scenario = this.list().find((record) => record.id === id);
    return scenario ? restoreDealState(scenario.state) : 0;
  }
  remove(id: string): void { this.write(this.list().filter((record) => record.id !== id)); }
  private write(records: ScenarioRecord[]): void { this.storage.setItem(SCENARIO_KEY, JSON.stringify(records)); }
}
