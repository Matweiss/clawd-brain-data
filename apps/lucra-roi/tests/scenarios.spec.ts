import { describe, expect, it } from 'vitest';
import { parseScenarios, ScenarioStore } from '../src/scenarios';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

const state = { version: 1 as const, updatedAt: '2026-07-12T00:00:00.000Z', fields: { 'i-vis': 1000 } };

describe('scenario store', () => {
  it('fails closed for invalid scenario payloads', () => {
    expect(parseScenarios('{bad')).toEqual([]);
    expect(parseScenarios(JSON.stringify([{ id: 1 }]))).toEqual([]);
  });
  it('saves, clones, and removes versioned scenarios', () => {
    const store = new ScenarioStore(new MemoryStorage());
    const saved = store.save('Base case', state);
    const clone = store.clone(saved.id);
    expect(store.list().map((record) => record.name).sort()).toEqual(['Base case', 'Base case copy']);
    store.remove(clone!.id);
    expect(store.list()).toHaveLength(1);
  });
});
