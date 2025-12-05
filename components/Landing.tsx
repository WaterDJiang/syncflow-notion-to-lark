import React from 'react';
import { useTranslation } from 'react-i18next';
import { Play, ShieldCheck, Zap, Globe2, Layers, ChevronRight } from 'lucide-react';

type LandingProps = {
  onStartSync: () => void;
  onOpenSettings: () => void;
};

const Landing: React.FC<LandingProps> = ({ onStartSync, onOpenSettings }) => {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto">
      <section className="rounded-[32px] bg-gradient-to-b from-white to-gray-50 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
        <div className="px-6 sm:px-10 pt-12 pb-10 text-center">
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute inset-x-0 -top-6 h-24 bg-gradient-to-b from-[#F5F7FB] to-transparent blur-2xl opacity-60" />
            <div className="flex items-center justify-center space-x-5">
              <img src="/Notion_app_logo.png" alt="Notion" className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg ring-1 ring-black/5 shadow-sm" />
              <span className="text-2xl sm:text-3xl text-gray-300">→</span>
              <img src="/Lark_Suite_logo_2022.png" alt="Lark" className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg ring-1 ring-black/5 shadow-sm" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight leading-tight">{t('landing_title')}</h1>
          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">{t('landing_subtitle')}</p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button onClick={onStartSync} className="group px-7 py-3.5 bg-black text-white rounded-full text-sm font-semibold shadow-sm hover:bg-gray-900 flex items-center">
              {t('landing_cta')}
              <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button onClick={onOpenSettings} className="px-7 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-full text-sm font-semibold shadow-sm">
              {t('open_settings')}
            </button>
          </div>
        </div>

        <div className="px-6 sm:px-10 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-5">{t('landing_how_title')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white ring-1 ring-black/10 shadow-sm text-base leading-none tabular-nums font-medium">1</div>
                <span className="text-sm text-gray-700">{t('landing_step1')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white ring-1 ring-black/10 shadow-sm text-base leading-none tabular-nums font-medium">2</div>
                <span className="text-sm text-gray-700">{t('landing_step2')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white ring-1 ring-black/10 shadow-sm text-base leading-none tabular-nums font-medium">3</div>
                <span className="text-sm text-gray-700">{t('landing_step3')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white ring-1 ring-black/10 shadow-sm text-base leading-none tabular-nums font-medium">4</div>
                <span className="text-sm text-gray-700">{t('landing_step4')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-5">{t('landing_features_title')}</h2>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 text-[#0071E3] flex items-center justify-center">
                  <Zap size={16} />
                </div>
                <span className="text-sm text-gray-700">{t('landing_feature_fast')}</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 text-[#0071E3] flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <span className="text-sm text-gray-700">{t('landing_feature_secure')}</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 text-[#0071E3] flex items-center justify-center">
                  <Globe2 size={16} />
                </div>
                <span className="text-sm text-gray-700">{t('landing_feature_i18n')}</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 text-[#0071E3] flex items-center justify-center">
                  <Layers size={16} />
                </div>
                <span className="text-sm text-gray-700">{t('landing_feature_batch')}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
