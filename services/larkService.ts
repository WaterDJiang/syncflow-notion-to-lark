import { FieldSchema } from '../types';
import { loadCredentials } from './secureStorage';

const LARK_API_BASE = '/lark/open-apis';

const getTenantToken = async (): Promise<string | null> => {
  try {
    const creds = loadCredentials();
    const appId = creds?.larkAppId;
    const appSecret = creds?.larkAppSecret;
    if (!appId || !appSecret) return null;
    const res = await fetch(`${LARK_API_BASE}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.tenant_access_token || null;
  } catch {
    return null;
  }
};

const getAuthHeaders = async (): Promise<HeadersInit | null> => {
  const tenant = await getTenantToken();
  return tenant ? { Authorization: `Bearer ${tenant}` } : null;
};

export const exchangeUserAccessToken = async (code: string, redirectUri?: string): Promise<{ access_token?: string; refresh_token?: string; expires_in?: number } | null> => {
  try {
    const creds = loadCredentials();
    const appId = creds?.larkAppId;
    const appSecret = creds?.larkAppSecret;
    if (!appId || !appSecret || !code) return null;
    const res = await fetch(`/lark/open-apis/authen/v2/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ grant_type: 'authorization_code', client_id: appId, client_secret: appSecret, code, redirect_uri: redirectUri })
    });
    const data = await res.json();
    if (!res.ok) return null;
    return { access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in };
  } catch {
    return null;
  }
};

export const fetchLarkSchema = async (appToken: string, tableId: string): Promise<FieldSchema[]> => {
  try {
    if (!appToken || !tableId) return [];
    const headers = await getAuthHeaders();
    if (!headers) return [];
    const res = await fetch(`${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, { headers });
    const data = await res.json();
    if (!res.ok) {
      console.error('Lark fields fetch failed', data);
      return [];
    }
    const items = (data.data?.items || []) as any[];
    const mapType = (t: string): FieldSchema['type'] => {
      if (t === 'text' || t === 'long_text') return 'text';
      if (t === 'number') return 'number';
      if (t === 'date') return 'date';
      if (t === 'single_select' || t === 'multi_select') return 'select';
      if (t === 'user') return 'person';
      if (t === 'checkbox') return 'checkbox';
      if (t === 'url') return 'url';
      if (t === 'email') return 'email';
      return 'text';
    };
    return items.map((f) => ({
      id: f.field_id || f.id,
      name: (typeof f.name === 'string' && f.name.trim()) ? f.name.trim() : (f.field_name || f.title || `Field ${f.field_id || f.id}`),
      type: mapType(f.type)
    }));
  } catch {
    return [];
  }
};

type LarkRecord = { record_id: string; fields: Record<string, any> };

export const fetchLarkRecordsSample = async (appToken: string, tableId: string, limit = 100): Promise<LarkRecord[]> => {
  try {
    const headers = await getAuthHeaders();
    if (!headers) return [];
    let pageToken: string | undefined = undefined;
    const out: LarkRecord[] = [];
    while (out.length < limit) {
      const url = new URL(`${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records`);
      url.searchParams.set('page_size', String(Math.min(50, limit - out.length)));
      if (pageToken) url.searchParams.set('page_token', pageToken);
      const res = await fetch(url.toString(), { headers });
      if (!res.ok) break;
      const data = await res.json();
      const items = (data.data?.items || []) as any[];
      for (const it of items) out.push({ record_id: it.record_id || it.id, fields: it.fields || {} });
      const hasMore = !!data.data?.has_more;
      pageToken = data.data?.page_token;
      if (!hasMore || !pageToken) break;
    }
    return out;
  } catch {
    return [];
  }
};

export const countLarkRecords = async (appToken: string, tableId: string): Promise<number> => {
  try {
    const headers = await getAuthHeaders();
    if (!headers) return 0;
    const url = new URL(`${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records`);
    url.searchParams.set('page_size', '1');
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) return 0;
    const data = await res.json();
    const first = (data.data?.items || []) as any[];
    let total = first.length;
    let pageToken = data.data?.page_token;
    let hasMore = !!data.data?.has_more;
    while (hasMore && pageToken && total < 1000) {
      const pageUrl = new URL(`${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records`);
      pageUrl.searchParams.set('page_size', '200');
      pageUrl.searchParams.set('page_token', pageToken);
      const pageRes = await fetch(pageUrl.toString(), { headers });
      if (!pageRes.ok) break;
      const pageData = await pageRes.json();
      const items = (pageData.data?.items || []) as any[];
      total += items.length;
      pageToken = pageData.data?.page_token;
      hasMore = !!pageData.data?.has_more;
    }
    return total;
  } catch {
    return 0;
  }
};

export const listLarkTables = async (appToken: string): Promise<Array<{ id: string; name: string }>> => {
  try {
    const headers = await getAuthHeaders();
    if (!headers || !appToken) return [];
    const res = await fetch(`${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables`, { headers });
    const data = await res.json();
    if (!res.ok) {
      console.error('Lark tables fetch failed', data);
      return [];
    }
    const items = (data.data?.items || data.data?.tables || []) as any[];
    return items.map(it => ({ id: it.table_id || it.id, name: it.name }));
  } catch (e) {
    console.error('Lark list tables error', e);
    return [];
  }
};

export const computeSelectDistribution = async (
  appToken: string,
  tableId: string,
  selectFieldNames: string[],
  sampleSize = 200
): Promise<Record<string, Record<string, number>>> => {
  const records = await fetchLarkRecordsSample(appToken, tableId, sampleSize);
  const dist: Record<string, Record<string, number>> = {};
  for (const name of selectFieldNames) dist[name] = {};
  for (const r of records) {
    for (const name of selectFieldNames) {
      const v = r.fields[name];
      if (v == null) continue;
      if (Array.isArray(v)) {
        for (const item of v) {
          const key = typeof item === 'string' ? item : item?.name ?? String(item);
          dist[name][key] = (dist[name][key] || 0) + 1;
        }
      } else {
        const key = typeof v === 'string' ? v : v?.name ?? String(v);
        dist[name][key] = (dist[name][key] || 0) + 1;
      }
    }
  }
  return dist;
};

export const getBitableApp = async (appToken: string): Promise<any | null> => {
  try {
    const headers = await getAuthHeaders();
    if (!headers) return null;
    const res = await fetch(`${LARK_API_BASE}/bitable/v1/apps/${appToken}`, { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const updateBitableApp = async (appToken: string, params: { name?: string; is_advanced?: boolean }): Promise<boolean> => {
  try {
    const headers = await getAuthHeaders();
    if (!headers) return false;
    const res = await fetch(`${LARK_API_BASE}/bitable/v1/apps/${appToken}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ name: params.name, is_advanced: params.is_advanced })
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const copyBitableApp = async (appToken: string, payload: { name?: string; folder_token?: string; without_content?: boolean; time_zone?: string }): Promise<any | null> => {
  try {
    const headers = await getAuthHeaders();
    if (!headers) return null;
    const res = await fetch(`${LARK_API_BASE}/bitable/v1/apps/${appToken}/copy`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const createBitableApp = async (payload: { name?: string; folder_token?: string; time_zone?: string }): Promise<any | null> => {
  try {
    const headers = await getAuthHeaders();
    if (!headers) return null;
    const res = await fetch(`${LARK_API_BASE}/bitable/v1/apps`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const insertLarkRecords = async (appToken: string, tableId: string, records: Array<{ fields: Record<string, any> }>): Promise<number> => {
  try {
    const headers = await getAuthHeaders();
    if (!headers) return 0;
    let inserted = 0;
    const chunkSize = 500; // API single add limit per docs
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const res = await fetch(`${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ records: chunk })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('Lark insert failed', data);
        continue;
      }
      const items = (data.data?.records || data.data?.items || []) as any[];
      inserted += items.length;
    }
    return inserted;
  } catch (e) {
    console.error('Lark insert error', e);
    return 0;
  }
};

export const batchCreateRecordsDetailed = async (
  appToken: string,
  tableId: string,
  records: Array<{ fields: Record<string, any> }>
): Promise<{ success: number; total: number; failed: number; errors: any[] }> => {
  const headers = await getAuthHeaders();
  if (!headers) return { success: 0, total: 0, failed: records.length, errors: ['no_auth'] };
  let success = 0;
  const errors: any[] = [];
  const chunkSize = 500;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const res = await fetch(`${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ records: chunk })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || (typeof data.code === 'number' && data.code !== 0)) {
      errors.push(data);
      continue;
    }
    const items = (data.data?.records || data.data?.items || []) as any[];
    success += items.length;
  }
  const total = records.length;
  return { success, total, failed: total - success, errors };
};
