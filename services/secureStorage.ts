import { UserCredentials } from '../types';

const STORAGE_KEY = 'syncflow_secure_creds';
const SALT = 'sf_v1_salt_'; // Simple salt to prevent plain text visibility

// Simple obfuscation to prevent plain text reading in LocalStorage tools
// Note: Client-side encryption is never 100% secure against a determined attacker with console access.
// This prevents shoulder surfing and accidental exposure.
const obfuscate = (text: string): string => {
  try {
    return btoa(SALT + encodeURIComponent(text));
  } catch (e) {
    return text;
  }
};

const deobfuscate = (hash: string): string => {
  try {
    const decoded = decodeURIComponent(atob(hash));
    if (decoded.startsWith(SALT)) {
      return decoded.slice(SALT.length);
    }
    return '';
  } catch (e) {
    return '';
  }
};

export const saveCredentials = (creds: UserCredentials) => {
  const payload = JSON.stringify(creds);
  localStorage.setItem(STORAGE_KEY, obfuscate(payload));
};

export const loadCredentials = (): UserCredentials | null => {
  const hash = localStorage.getItem(STORAGE_KEY);
  if (!hash) return null;

  try {
    const json = deobfuscate(hash);
    if (!json) return null;
    return JSON.parse(json) as UserCredentials;
  } catch (e) {
    console.error("Failed to parse credentials", e);
    return null;
  }
};

export const clearCredentials = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const hasCredentials = (): boolean => {
  return !!localStorage.getItem(STORAGE_KEY);
};