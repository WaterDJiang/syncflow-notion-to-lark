import React from 'react';
import { useTranslation } from 'react-i18next';
import { setAppLang } from '../src/i18n';

const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  const current = i18n.language as 'en' | 'zh';
  const next = current === 'zh' ? 'en' : 'zh';
  return (
    <button
      onClick={() => setAppLang(next)}
      className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded-md"
    >
      {current === 'zh' ? 'EN' : '中文'}
    </button>
  );
};

export default LanguageToggle;
