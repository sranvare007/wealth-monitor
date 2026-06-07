const BASE = 'https://wealth-monitor-backend-production.up.railway.app/api/v1/mutual-funds';

export type MFSearchResult = {
  schemeCode: number;
  schemeName: string;
  fundHouse?: string;
  schemeCategory?: string;
};

export type MFNavResult = {
  schemeCode: number;
  schemeName: string;
  nav: number;
  navDate: string;
};

export async function searchMutualFunds(q: string): Promise<MFSearchResult[]> {
  if (!q.trim()) return [];
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(q.trim())}`);
  if (!res.ok) throw new Error(`MF search failed: ${res.status}`);
  const json = await res.json();
  const raw: unknown[] = Array.isArray(json) ? json : (json.data ?? []);
  return raw.map((r: any) => ({
    schemeCode: Number(r.schemeCode ?? r.scheme_code ?? r.id ?? 0),
    schemeName: String(r.schemeName ?? r.scheme_name ?? r.name ?? ''),
    fundHouse: r.fundHouse ?? r.fund_house ?? undefined,
    schemeCategory: r.schemeCategory ?? r.scheme_category ?? r.category ?? undefined,
  })).filter(r => r.schemeCode !== 0 && r.schemeName !== '');
}

export async function fetchMFLatestNAV(schemeCode: number): Promise<MFNavResult> {
  const res = await fetch(`${BASE}/${schemeCode}/latest`);
  if (!res.ok) throw new Error(`NAV fetch failed: ${res.status}`);
  const json = await res.json();
  // Response shape: { success, data: { meta: {...}, data: [{ date, nav }] } }
  const payload: any = json.data ?? json;
  const meta: any = payload.meta ?? {};
  const latest: any = Array.isArray(payload.data) ? payload.data[0] : (payload.data ?? payload);
  const navRaw = latest?.nav ?? latest?.latestNAV ?? latest?.currentNAV ?? 0;
  return {
    schemeCode: Number(meta.scheme_code ?? schemeCode),
    schemeName: String(meta.scheme_name ?? meta.schemeName ?? ''),
    nav: typeof navRaw === 'string' ? parseFloat(navRaw) : Number(navRaw),
    navDate: String(latest?.date ?? latest?.navDate ?? ''),
  };
}
