const BASE = 'https://wealth-monitor-backend-production.up.railway.app/api/v1/mutual-funds';

export type MFSearchResult = {
  schemeCode: number;
  schemeName: string;
};

export type MFNavResult = {
  schemeCode: number;
  schemeName: string;
  nav: number;
  navDate: string;
};

export async function searchMutualFunds(q: string): Promise<MFSearchResult[]> {
  if (!q.trim()) return [];
  const res = await fetch(`${BASE}/db-search?q=${encodeURIComponent(q.trim())}`, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`MF search failed: ${res.status}`);
  const json = await res.json();
  // Response shape: { success, data: [{ schemeCode, schemeName, isinGrowth, ... }] }
  const raw: any[] = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
  return raw
    .map(r => ({
      schemeCode: Number(r.schemeCode ?? r.scheme_code ?? 0),
      schemeName: String(r.schemeName ?? r.scheme_name ?? ''),
    }))
    .filter(r => r.schemeCode !== 0 && r.schemeName !== '');
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
