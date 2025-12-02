import React, { useState, useEffect } from 'react';
import { FieldSchema, MappingPair } from '../types';
import { suggestMapping } from '../services/geminiService';
import { ArrowRight, Wand2, ArrowLeftRight, Trash2, Plus } from 'lucide-react';

interface MappingStepProps {
  sourceSchema: FieldSchema[];
  targetSchema: FieldSchema[];
  onConfirm: (mapping: MappingPair[]) => void;
}

const MappingStep: React.FC<MappingStepProps> = ({ sourceSchema, targetSchema, onConfirm }) => {
  const [mapping, setMapping] = useState<MappingPair[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (mapping.length === 0) {
      setMapping([{ sourceFieldId: '', targetFieldId: '' }]);
    }
  }, []);

  const handleAiMapping = async () => {
    setIsAnalyzing(true);
    const suggested = await suggestMapping(sourceSchema, targetSchema);
    if (suggested && suggested.length > 0) {
      setMapping(suggested);
    } else {
        alert("AI didn't find high-confidence matches. Please map manually.");
    }
    setIsAnalyzing(false);
  };

  const updateRow = (index: number, field: 'sourceFieldId' | 'targetFieldId', value: string) => {
    const newMapping = [...mapping];
    newMapping[index] = { ...newMapping[index], [field]: value };
    setMapping(newMapping);
  };

  const addRow = () => {
    setMapping([...mapping, { sourceFieldId: '', targetFieldId: '' }]);
  };

  const removeRow = (index: number) => {
    setMapping(mapping.filter((_, i) => i !== index));
  };

  const isValid = mapping.some(m => m.sourceFieldId && m.targetFieldId);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
           <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Data Mapping</h2>
           <p className="text-gray-500 mt-1">Match your Notion properties to Lark Base fields.</p>
        </div>
        <button
            onClick={handleAiMapping}
            disabled={isAnalyzing}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
        >
            {isAnalyzing ? (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Wand2 size={14} />
            )}
            <span>Auto-Map with AI</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-gray-100">
        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
             <div className="col-span-5 pl-2">Notion Source</div>
             <div className="col-span-2"></div>
             <div className="col-span-5 pl-2">Lark Destination</div>
        </div>

        <div className="divide-y divide-gray-100">
          {mapping.map((pair, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-center p-4 hover:bg-gray-50/50 transition-colors group">
              
              {/* Source Dropdown */}
              <div className="col-span-5">
                <div className="relative">
                    <select
                    value={pair.sourceFieldId}
                    onChange={(e) => updateRow(index, 'sourceFieldId', e.target.value)}
                    className="appearance-none block w-full rounded-xl border-gray-200 bg-white py-2.5 pl-3 pr-10 text-sm focus:border-[#0071E3] focus:ring-[#0071E3] shadow-sm transition-shadow"
                    >
                    <option value="">Select Field</option>
                    {sourceSchema.map(field => (
                        <option key={field.id} value={field.id} disabled={mapping.some((m, i) => i !== index && m.sourceFieldId === field.id)}>
                        {field.name}
                        </option>
                    ))}
                    </select>
                     {/* Custom Arrow */}
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                    </div>
                </div>
                {pair.sourceFieldId && (
                     <div className="mt-1 ml-1 text-[10px] text-gray-400 font-mono">
                        {sourceSchema.find(s => s.id === pair.sourceFieldId)?.type}
                     </div>
                )}
              </div>

              {/* Icon */}
              <div className="col-span-2 flex justify-center text-gray-300">
                <ArrowRight size={16} strokeWidth={2.5} />
              </div>

              {/* Target Dropdown */}
              <div className="col-span-5 flex items-center gap-2">
                 <div className="relative w-full">
                    <select
                        value={pair.targetFieldId}
                        onChange={(e) => updateRow(index, 'targetFieldId', e.target.value)}
                        className="appearance-none block w-full rounded-xl border-gray-200 bg-white py-2.5 pl-3 pr-10 text-sm focus:border-[#0071E3] focus:ring-[#0071E3] shadow-sm transition-shadow"
                    >
                        <option value="">Select Field</option>
                        {targetSchema.map(field => (
                        <option key={field.id} value={field.id} disabled={mapping.some((m, i) => i !== index && m.targetFieldId === field.id)}>
                            {field.name}
                        </option>
                        ))}
                    </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                    </div>
                </div>
                <button 
                    onClick={() => removeRow(index)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-gray-50/30 border-t border-gray-100">
             <button
                onClick={addRow}
                className="w-full py-3 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:border-[#0071E3] hover:text-[#0071E3] hover:bg-[#0071E3]/5 flex items-center justify-center text-sm font-medium transition-all"
            >
                <Plus size={16} className="mr-2" />
                Add Another Field
            </button>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={() => onConfirm(mapping)}
          disabled={!isValid}
          className="inline-flex items-center px-8 py-4 bg-[#0071E3] hover:bg-[#0077ED] border border-transparent rounded-2xl font-semibold text-white shadow-sm transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm Configuration
          <ArrowRight className="ml-2 h-4 w-4 stroke-[3px]" />
        </button>
      </div>
    </div>
  );
};

export default MappingStep;