// Minimal HubSpot v3 client for the sync script.
// We use plain fetch instead of @hubspot/api-client to keep deps lean —
// the API surface we need is small (search + properties + owners).

const BASE = "https://api.hubapi.com";

export interface HubSpotObject {
  id: string;
  properties: Record<string, string | null>;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
}

export interface HubSpotSearchPage {
  total: number;
  results: HubSpotObject[];
  paging?: { next?: { after: string } };
}

export interface HubSpotPropertyOption {
  value: string;
  label: string;
  displayOrder?: number;
  hidden?: boolean;
}

export interface HubSpotProperty {
  name: string;
  label: string;
  type: string;
  options?: HubSpotPropertyOption[];
}

export interface HubSpotOwner {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  archived?: boolean;
}

export class HubSpotClient {
  constructor(private token: string) {}

  private async request<T>(
    path: string,
    init: RequestInit = {},
    attempt = 0
  ): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    // 429 + 5xx: retry with exponential backoff up to 5 attempts.
    // HubSpot Pro is ~100 req / 10s — at our batch size (100/page) we
    // shouldn't approach this in normal operation, but a burst of small
    // search calls could.
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(2 ** attempt * 500, 10_000);
      await sleep(wait);
      return this.request<T>(path, init, attempt + 1);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `HubSpot ${init.method ?? "GET"} ${path} → ${res.status} ${res.statusText}\n${body}`
      );
    }
    return res.json() as Promise<T>;
  }

  async getProperty(
    objectType: string,
    propertyName: string
  ): Promise<HubSpotProperty> {
    return this.request<HubSpotProperty>(
      `/crm/v3/properties/${encodeURIComponent(objectType)}/${encodeURIComponent(
        propertyName
      )}`
    );
  }

  async listOwners(): Promise<HubSpotOwner[]> {
    // /crm/v3/owners is paginated but accounts rarely have >100 owners.
    // We still loop until paging.next is missing, just to be correct.
    const all: HubSpotOwner[] = [];
    let after: string | undefined;
    do {
      const qs = new URLSearchParams({ limit: "100" });
      if (after) qs.set("after", after);
      const page = await this.request<{
        results: HubSpotOwner[];
        paging?: { next?: { after: string } };
      }>(`/crm/v3/owners/?${qs.toString()}`);
      all.push(...page.results);
      after = page.paging?.next?.after;
    } while (after);
    return all;
  }

  /**
   * Iterate the search endpoint page-by-page. Yields each page's results
   * so the caller can upsert in batches without buffering everything in
   * memory.
   *
   * NOTE: HubSpot's search endpoint hard-caps total returnable results at
   * 10,000. For accounts above that limit on a single object type we'd
   * need to chunk by date range. Mat's current account: 6,999 contacts /
   * 634 deals — comfortably under.
   */
  async *searchPages(opts: {
    objectType: string;
    properties: string[];
    filters?: Array<{ propertyName: string; operator: string; value: string }>;
    sortBy?: string;
    sortDirection?: "ASCENDING" | "DESCENDING";
    pageSize?: number;
  }): AsyncGenerator<HubSpotObject[]> {
    const limit = opts.pageSize ?? 100;
    let after: string | undefined;
    let pages = 0;

    while (true) {
      const body: Record<string, unknown> = {
        limit,
        properties: opts.properties,
      };
      if (opts.filters && opts.filters.length > 0) {
        body.filterGroups = [{ filters: opts.filters }];
      }
      if (opts.sortBy) {
        body.sorts = [
          {
            propertyName: opts.sortBy,
            direction: opts.sortDirection ?? "DESCENDING",
          },
        ];
      }
      if (after) body.after = after;

      const page = await this.request<HubSpotSearchPage>(
        `/crm/v3/objects/${encodeURIComponent(opts.objectType)}/search`,
        { method: "POST", body: JSON.stringify(body) }
      );

      pages += 1;
      yield page.results;

      after = page.paging?.next?.after;
      if (!after) return;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
