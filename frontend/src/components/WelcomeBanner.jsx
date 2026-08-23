import React from 'react';
import { X, Bot, BookOpen, Shield, Cpu, Zap, Database, HelpCircle } from 'lucide-react';

export default function WelcomeBanner({ onClose, stats }) {
  const features = [
    {
      icon: BookOpen,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      title: 'Grounded in Scripture',
      desc: `${stats?.total_documents?.toLocaleString() ?? '20,000+'} authentic Islamic texts from Quran, Hadith, and scholarly sources.`,
    },
    {
      icon: Shield,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      title: 'Islamic-Only Guardrail',
      desc: 'An intelligent topic filter ensures only Islamic questions receive answers. Off-topic queries are politely declined.',
    },
    {
      icon: Cpu,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      title: 'Multiple AI Models',
      desc: 'Choose between Qwen 2.5 (0.5B Instruct) or Islamic Fine-Tuned DistilGPT2. Switch any time in Settings.',
    },
    {
      icon: Zap,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
      title: 'Real-time Streaming',
      desc: 'Answers stream token-by-token so you see results immediately — even on CPU without a GPU.',
    },
  ];

  const canAnswer = [
    'Quranic verses and tafsir',
    'Hadith and Prophetic traditions',
    'Islamic history and Seerah',
    'Fiqh, halal/haram rulings',
    'Islamic worship and pillars',
    'Ethics, manners, and family in Islam',
  ];

  const cannotAnswer = [
    'Programming or technology questions',
    'Weather, sports, or entertainment',
    'Politics unrelated to Islamic governance',
    'Non-Islamic religious topics',
    'Financial or medical advice',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6 animate-fadeInScale overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Bot className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold font-['Outfit'] text-white">
                Welcome to <span className="gradient-text-emerald">Islamic RAG AI</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="glass-card p-3.5 rounded-2xl border border-slate-800 space-y-1.5"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${f.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">{f.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Can/Cannot Answer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <h4 className="font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="text-base">✅</span>
              <span>I can answer about</span>
            </h4>
            <ul className="space-y-1">
              {canAnswer.map((item, i) => (
                <li key={i} className="text-slate-300 flex items-start space-x-2">
                  <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="text-base">🛡️</span>
              <span>Outside my scope</span>
            </h4>
            <ul className="space-y-1">
              {cannotAnswer.map((item, i) => (
                <li key={i} className="text-slate-400 flex items-start space-x-2">
                  <span className="text-amber-500/60 mt-0.5 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/70 leading-relaxed">
            This AI generates answers from its training data and should not replace advice from qualified Islamic scholars. Always verify important matters with a scholar or certified institution.
          </p>
        </div>

        {/* CTA */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition"
          >
            Start Asking ✨
          </button>
        </div>
      </div>
    </div>
  );
}
