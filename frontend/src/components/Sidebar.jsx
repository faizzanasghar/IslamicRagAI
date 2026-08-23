import React, { useState } from 'react';
import {
  Sparkles, MessageSquare, Database, Trash2, Cpu,
  Sliders, ChevronRight, BookOpen, Star, Clock, ScrollText
} from 'lucide-react';

const PROMPT_CATEGORIES = [
  {
    label: 'Quran & Tafsir',
    icon: BookOpen,
    color: 'text-emerald-400',
    prompts: [
      "What does the Quran say about patience (Sabr)?",
      "Explain Surah Al-Fatiha and its meaning.",
      "What are the rights of orphans in the Quran?",
    ],
  },
  {
    label: 'Hadith & Sunnah',
    icon: ScrollText,
    color: 'text-teal-400',
    prompts: [
      "What does the Hadith say about kindness to neighbors?",
      "What is the virtue of saying Bismillah?",
      "Tell me about the importance of honesty from Hadith.",
    ],
  },
  {
    label: 'Islamic Practice',
    icon: Star,
    color: 'text-amber-400',
    prompts: [
      "Explain the concept of Tawheed in Islam.",
      "What is the significance of Zakat in Islam?",
      "What are the conditions for a valid Islamic marriage?",
    ],
  },
  {
    label: 'History & Seerah',
    icon: Clock,
    color: 'text-violet-400',
    prompts: [
      "Tell me about the life of Prophet Muhammad ﷺ.",
      "What was the significance of the Hijra?",
      "Who were the four rightly guided caliphs?",
    ],
  },
];

export default function Sidebar({
  stats,
  settings,
  onSelectPrompt,
  onClearChat,
  onOpenSettings,
  chatHistoryCount,
}) {
  const [openCategory, setOpenCategory] = useState(0);

  return (
    <aside className="w-80 glass-panel border-r border-slate-800/80 flex flex-col justify-between min-h-full overflow-y-auto">

      <div className="p-4 space-y-5">

        {/* Active Model Config */}
        <div className="glass-card p-3.5 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Config</span>
            </span>
            <button
              onClick={onOpenSettings}
              className="text-[10px] text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <span>Edit</span>
              <Sliders className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-900 space-y-1.5">
            <div className="text-xs font-bold text-white truncate font-['Outfit']">
              {settings.model_key === 'qwen'
                ? 'Qwen 2.5 (0.5B Instruct)'
                : settings.model_key === 'qwen_1.5b'
                ? 'Qwen 2.5 (1.5B Instruct)'
                : settings.model_key === 'qwen_3b'
                ? 'Qwen 2.5 (3B Instruct)'
                : settings.model_key === 'qwen_7b'
                ? 'Qwen 2.5 (7B Instruct)'
                : settings.model_key === 'distilgpt2_finetuned'
                ? 'Islamic Fine-Tuned DistilGPT2'
                : 'Base DistilGPT2'}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Top-K: <strong className="text-emerald-400">{settings.top_k}</strong></span>
              <span>Temp: <strong className="text-emerald-400">{settings.temperature}</strong></span>
              <span>Tokens: <strong className="text-emerald-400">{settings.max_new_tokens}</strong></span>
            </div>
          </div>
        </div>

        {/* Knowledge Base Stats */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 px-1">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span>Knowledge Index</span>
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {[
              {
                value: stats?.total_documents
                  ? stats.total_documents.toLocaleString()
                  : '20K+',
                label: 'Indexed Texts',
                color: 'text-emerald-400',
              },
              {
                value: stats?.total_sources
                  ? stats.total_sources.toLocaleString()
                  : '384+',
                label: 'Sources',
                color: 'text-teal-400',
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center"
              >
                <div className={`text-sm font-extrabold font-mono ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categorized Prompt Library */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 px-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Suggested Questions</span>
          </h3>

          {PROMPT_CATEGORIES.map((cat, catIdx) => {
            const Icon = cat.icon;
            const isOpen = openCategory === catIdx;
            return (
              <div key={catIdx} className="rounded-xl border border-slate-800/80 overflow-hidden">
                <button
                  onClick={() => setOpenCategory(isOpen ? -1 : catIdx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold transition ${
                    isOpen ? 'bg-slate-800/80 text-white' : 'bg-slate-900/50 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                    <span>{cat.label}</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="bg-slate-950/40 divide-y divide-slate-800/50 animate-fadeIn">
                    {cat.prompts.map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => onSelectPrompt(prompt)}
                        className="w-full text-left px-3 py-2.5 text-xs text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/5 transition flex items-start space-x-2 group"
                      >
                        <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-slate-600 group-hover:text-emerald-500 transition" />
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 pt-2 border-t border-slate-800/80 space-y-3">
        <button
          onClick={onClearChat}
          disabled={chatHistoryCount === 0}
          className="w-full py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition text-xs font-medium flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Chat ({chatHistoryCount})</span>
        </button>

        <div className="text-[10px] text-slate-500 text-center font-mono leading-relaxed">
          FAISS · SentenceTransformers · Qwen 2.5
          <br />
          Islamic Knowledge RAG v2.0
        </div>
      </div>
    </aside>
  );
}
