import React from 'react';
import { X, Cpu, Sliders, Check } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, settings, onUpdateSettings }) {
  if (!isOpen) return null;

  const models = [
    {
      key: 'qwen',
      name: 'Qwen 2.5 (0.5B Instruct)',
      tag: 'Ultra-Fast CPU (Default)',
      desc: '0.5B parameter instruct model. Fast response on CPU with low RAM requirements (~1GB).'
    },
    {
      key: 'qwen_1.5b',
      name: 'Qwen 2.5 (1.5B Instruct)',
      tag: 'Balanced Accuracy & Speed',
      desc: '1.5B parameter model. Stronger grounding and citation adherence (~3GB RAM).'
    },
    {
      key: 'qwen_3b',
      name: 'Qwen 2.5 (3B Instruct)',
      tag: 'High Accuracy',
      desc: '3B parameter model. High reasoning capacity and strict citation adherence (~6GB RAM).'
    },
    {
      key: 'qwen_7b',
      name: 'Qwen 2.5 (7B Instruct)',
      tag: 'Flagship Accuracy',
      desc: '7B parameter model. Maximum factual accuracy and zero hallucination (~15GB RAM).'
    },
    {
      key: 'distilgpt2_finetuned',
      name: 'Islamic Fine-Tuned DistilGPT2',
      tag: 'Fine-Tuned Checkpoint',
      desc: 'DistilGPT2 model fine-tuned on 20,000+ Islamic texts (checkpoint-885).'
    },
    {
      key: 'distilgpt2',
      name: 'Base DistilGPT2',
      tag: 'Lightweight Base',
      desc: 'Standard base DistilGPT2 model for baseline comparisons.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Fixed Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold font-['Outfit'] text-white">RAG Engine Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto py-4 pr-1.5 space-y-5 custom-scrollbar">
          
          {/* Model Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Select LLM Generator Model</span>
            </label>

            <div className="space-y-2">
              {models.map((m) => (
                <div
                  key={m.key}
                  onClick={() => onUpdateSettings({ ...settings, model_key: m.key })}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    settings.model_key === m.key
                      ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{m.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-semibold border border-slate-700">
                        {m.tag}
                      </span>
                    </div>
                    {settings.model_key === m.key && (
                      <Check className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top-K Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-semibold text-slate-300">Top-K Passages Retrieved</label>
              <span className="font-mono text-emerald-400 font-bold">{settings.top_k} passages</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={settings.top_k}
              onChange={(e) => onUpdateSettings({ ...settings, top_k: Number(e.target.value) })}
              className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Higher values give more grounded context to the model.</p>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-semibold text-slate-300">Generation Temperature</label>
              <span className="font-mono text-emerald-400 font-bold">{settings.temperature}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => onUpdateSettings({ ...settings, temperature: Number(e.target.value) })}
              className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Lower values (0.1 - 0.5) produce strict factual answers.</p>
          </div>

        </div>

        {/* Fixed Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
