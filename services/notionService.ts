import { FieldSchema } from '../types';
import { loadCredentialsSecure } from './secureStorage';

type NotionDatabaseSummary = { id: string; title: string; icon?: string };

const STATIC_MODE = (import.meta.env.VITE_STATIC_MODE === 'true');
const USE_PROXY = !STATIC_MODE && (import.meta.env.PROD ? true : (import.meta.env.VITE_USE_SERVER_PROXY === 'true'));
const NOTION_API_BASE = USE_PROXY
  ? '/api/notion'
  : (import.meta.env.PROD ? 'https://api.notion.com' : '/notion');
const NOTION_VERSION = '2022-06-28';
const DIRECT_NOTION_BASE = 'https://api.notion.com';

const fetchNotion = async (path: string, init: RequestInit): Promise<Response> => {
  try {
    const res = await fetch(`${NOTION_API_BASE}${path}`, init);
    return res;
  } catch {
    if (!USE_PROXY) {
      return fetch(`${DIRECT_NOTION_BASE}${path}`, init);
    }
    return new Response(JSON.stringify({ error: 'proxy_unavailable' }), { status: 599, headers: { 'Content-Type': 'application/json' } });
  }
};

const getNotionHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Notion-Version': NOTION_VERSION,
  'Content-Type': 'application/json'
});

export const fetchMe = async (): Promise<{ name: string; email?: string; avatar?: string } | null> => {
  try {
    const creds = await loadCredentialsSecure();
    const token = creds?.notionToken;
    if (!token) return null;
    const res = await fetchNotion(`/v1/users/me`, { headers: getNotionHeaders(token) });
    if (!res.ok) return null;
    const data = await res.json();
    return { name: data.name || 'Notion User', email: data.person?.email, avatar: undefined };
  } catch {
    return null;
  }
};

export const listDatabases = async (): Promise<NotionDatabaseSummary[]> => {
  try {
    const creds = await loadCredentialsSecure();
    const token = creds?.notionToken;
    if (!token) return [];
    const res = await fetchNotion(`/v1/search`, {
      method: 'POST',
      headers: getNotionHeaders(token),
      body: JSON.stringify({
        filter: { value: 'database', property: 'object' },
        sort: { direction: 'ascending', timestamp: 'last_edited_time' }
      })
    });
    if (!res.ok) return [];
    const json = await res.json();
    const results = (json.results || []) as any[];
    return results.map(r => ({
      id: r.id,
      title: (r.title?.[0]?.plain_text) || (r.properties?.title?.title?.[0]?.plain_text) || 'Untitled',
      icon: r.icon?.emoji
    }));
  } catch {
    return [];
  }
};

const mapNotionPropertyType = (prop: any): FieldSchema['type'] => {
  const t = prop.type;
  if (t === 'title' || t === 'rich_text' || t === 'multi_select') return 'text';
  if (t === 'number') return 'number';
  if (t === 'date') return 'date';
  if (t === 'select') return 'select';
  if (t === 'people') return 'person';
  if (t === 'checkbox') return 'checkbox';
  if (t === 'url') return 'url';
  if (t === 'email') return 'email';
  return 'text';
};

export const fetchNotionSchema = async (databaseId: string): Promise<FieldSchema[]> => {
  try {
    const creds = await loadCredentialsSecure();
    const token = creds?.notionToken;
    if (!token || !databaseId) return [];
    const res = await fetchNotion(`/v1/databases/${databaseId}`, { headers: getNotionHeaders(token) });
    if (!res.ok) return [];
    const data = await res.json();
    const props = data.properties || {};
    return Object.keys(props).map((key) => ({
      id: props[key].id || key,
      name: key,
      type: mapNotionPropertyType(props[key])
    }));
  } catch {
    return [];
  }
};

export const countNotionRecords = async (databaseId: string): Promise<number> => {
  try {
    const creds = await loadCredentialsSecure();
    const token = creds?.notionToken;
    if (!token || !databaseId) return 0;
    const res = await fetchNotion(`/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: getNotionHeaders(token),
      body: JSON.stringify({ page_size: 50 })
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return Array.isArray(data.results) ? data.results.length : 0;
  } catch {
    return 0;
  }
};

export const fetchNotionRecordsSample = async (databaseId: string, limit = 50): Promise<any[]> => {
  try {
    const creds = await loadCredentialsSecure();
    const token = creds?.notionToken;
    if (!token || !databaseId) return [];
    const res = await fetchNotion(`/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: getNotionHeaders(token),
      body: JSON.stringify({ page_size: Math.min(50, limit) })
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch {
    return [];
  }
};
