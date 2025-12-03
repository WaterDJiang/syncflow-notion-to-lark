import React from 'react';
import { AppStep } from '../types';
import { useTranslation } from 'react-i18next';

interface StepWizardProps {
  currentStep: AppStep;
  onSelectStep?: (step: AppStep) => void;
}

const StepWizard: React.FC<StepWizardProps> = ({ currentStep, onSelectStep }) => {
  const { t } = useTranslation();
  const steps = [
    { id: AppStep.CONFIG_NOTION, label: t('connect_notion') },
    { id: AppStep.CONFIG_LARK, label: t('connect_lark') },
    { id: AppStep.MAPPING, label: t('map_fields') },
    { id: AppStep.SYNC, label: t('sync') },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mb-10">
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center justify-center space-x-2 bg-gray-200/50 p-1.5 rounded-full backdrop-blur-sm">
          {steps.map((step) => {
            const isCurrent = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <li key={step.id} className="relative flex-1">
                <div
                  className={`
                    w-full flex items-center justify-center py-1.5 px-4 rounded-full text-xs font-medium transition-all duration-300 ease-out
                    ${isCurrent 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : isCompleted 
                            ? 'text-gray-500 hover:text-gray-900' 
                            : 'text-gray-400'
                    }
                  `}
                  onClick={() => { if (onSelectStep && step.id < currentStep) onSelectStep(step.id); }}
                  role={step.id < currentStep ? 'button' : undefined}
                  aria-disabled={step.id >= currentStep}
                  style={{ cursor: step.id < currentStep ? 'pointer' : 'default' }}
                >
                  <span className="truncate">{step.label}</span>
                </div>
              </li>
            );
          })}
        </ol>
        
      </nav>
    </div>
  );
};

export default StepWizard;
