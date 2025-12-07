import { UserCredentials, LarkTableConfig } from '../types';

const STORAGE_KEY = 'syncflow_secure_creds';
const V1_SALT = 'sf_v1_salt_';

const enc = new TextEncoder();

const getSalt = (): string => {
  let s = localStorage.getItem('syncflow_device_salt');
  if (!s) {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    s = Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('syncflow_device_salt', s);
  }
  return s;
};

const deriveKey = async (): Promise<CryptoKey> => {
  const base = `${navigator.userAgent}|${navigator.language}|${navigator.platform}|${getSalt()}`;
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(base), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', iterations: 120000, salt: enc.encode('syncflow_v2') }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
};

const v1Obfuscate = (text: string): string => {
  try { return btoa(V1_SALT + encodeURIComponent(text)); } catch { return text; }
};
const v1Deobfuscate = (hash: string): string => {
  try {
    const decoded = decodeURIComponent(atob(hash));
    return decoded.startsWith(V1_SALT) ? decoded.slice(V1_SALT.length) : '';
  } catch { return ''; }
};

export const saveCredentials = async (creds: UserCredentials) => {
  const key = await deriveKey();
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const data = enc.encode(JSON.stringify(creds));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const blob = { v: 2, iv: btoa(String.fromCharCode(...iv)), data: btoa(String.fromCharCode(...new Uint8Array(ct))) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
};

export const loadCredentials = (): UserCredentials | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.v === 2 && typeof parsed.iv === 'string' && typeof parsed.data === 'string') {
      return null;
    }
  } catch {}
  try {
    const json = v1Deobfuscate(raw);
    if (!json) return null;
    return JSON.parse(json) as UserCredentials;
  } catch { return null; }
};

export const loadCredentialsSecure = async (): Promise<UserCredentials | null> => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.v === 2) {
      const key = await deriveKey();
      const iv = Uint8Array.from(atob(parsed.iv), c => c.charCodeAt(0));
      const data = Uint8Array.from(atob(parsed.data), c => c.charCodeAt(0));
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
      return JSON.parse(new TextDecoder().decode(new Uint8Array(pt))) as UserCredentials;
    }
  } catch {}
  const legacy = loadCredentials();
  if (!legacy) return null;
  await saveCredentials(legacy);
  return legacy;
};

export const clearCredentials = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const hasCredentials = (): boolean => {
  return !!localStorage.getItem(STORAGE_KEY);
};

export const loadLarkTables = async (): Promise<LarkTableConfig[]> => {
  const creds = await loadCredentialsSecure();
  return creds?.larkTables || [];
};

export const saveLarkTables = async (tables: LarkTableConfig[]) => {
  const existing = await loadCredentialsSecure() || { notionToken: '', larkAppId: '', larkAppSecret: '' };
  const next: UserCredentials = { ...existing, larkTables: tables } as UserCredentials;
  await saveCredentials(next);
};
