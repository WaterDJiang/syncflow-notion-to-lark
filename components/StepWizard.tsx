import React from 'react';
import { AppStep } from '../types';

interface StepWizardProps {
  currentStep: AppStep;
}

const StepWizard: React.FC<StepWizardProps> = ({ currentStep }) => {
  const steps = [
    { id: AppStep.CONFIG_NOTION, label: 'Connect Notion' },
    { id: AppStep.CONFIG_LARK, label: 'Connect Lark' },
    { id: AppStep.MAPPING, label: 'Map Fields' },
    { id: AppStep.SYNC, label: 'Sync' },
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