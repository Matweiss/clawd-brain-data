export const DEAL_STATE_VERSION = 1 as const;
export const DEAL_STATE_KEY = 'lucra-roi:deal-state';

export type FieldValue = string | number | boolean;

export interface DealStateV1 {
  version: typeof DEAL_STATE_VERSION;
  updatedAt: string;
  fields: Record<string, FieldValue>;
}

const isFieldValue = (value: unknown): value is FieldValue =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';

export function parseDealState(raw: string | null): DealStateV1 | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const candidate = value as Partial<DealStateV1>;
    if (candidate.version !== DEAL_STATE_VERSION || typeof candidate.updatedAt !== 'string') return null;
    if (!candidate.fields || typeof candidate.fields !== 'object') return null;
    const fields = Object.fromEntries(
      Object.entries(candidate.fields).filter((entry): entry is [string, FieldValue] => isFieldValue(entry[1]))
    );
    return { version: DEAL_STATE_VERSION, updatedAt: candidate.updatedAt, fields };
  } catch {
    return null;
  }
}

export function collectDealState(root: ParentNode = document): DealStateV1 {
  const fields: Record<string, FieldValue> = {};
  root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[id]').forEach((control) => {
    if (control instanceof HTMLInputElement && ['button', 'file', 'password', 'submit'].includes(control.type)) return;
    fields[control.id] = control instanceof HTMLInputElement && control.type === 'checkbox' ? control.checked : control.value;
  });
  return { version: DEAL_STATE_VERSION, updatedAt: new Date().toISOString(), fields };
}

export function restoreDealState(state: DealStateV1, root: ParentNode = document): number {
  let restored = 0;
  Object.entries(state.fields).forEach(([id, value]) => {
    const control = root.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`#${CSS.escape(id)}`);
    if (!control) return;
    if (control instanceof HTMLInputElement && control.type === 'checkbox') control.checked = Boolean(value);
    else control.value = String(value);
    control.dispatchEvent(new Event('input', { bubbles: true }));
    control.dispatchEvent(new Event('change', { bubbles: true }));
    restored += 1;
  });
  return restored;
}

export function installDealStatePersistence(storage: Storage = localStorage, root: ParentNode = document): void {
  const saved = parseDealState(storage.getItem(DEAL_STATE_KEY));
  if (saved) restoreDealState(saved, root);
  else if (storage.getItem(DEAL_STATE_KEY)) storage.removeItem(DEAL_STATE_KEY);

  let timer = 0;
  root.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => storage.setItem(DEAL_STATE_KEY, JSON.stringify(collectDealState(root))), 180);
  });
}
