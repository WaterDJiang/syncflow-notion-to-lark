import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh from './locales/zh.json';

const STORAGE_KEY = 'app_lang';
const saved = (localStorage.getItem(STORAGE_KEY) as 'en' | 'zh') || 'zh';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: saved,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export const setAppLang = (lng: 'en' | 'zh') => { i18n.changeLanguage(lng); localStorage.setItem(STORAGE_KEY, lng); };
export default i18n;
