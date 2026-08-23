import React from 'react';
import { Bot, Search, Database, Settings, Sparkles, Cpu, Menu, ShieldCheck } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onToggleSidebar,
  healthStatus,
  stats,
}) {
  const isReady = healthStatus?.ready;
  const isOnCPU = healthStatus?.device !== 'cuda';

  const tabs = [
    { id: 'chat',      label: 'Chat AI',      icon: Sparkles },
    { id: 'inspector', label: 'RAG Inspector', icon: Search   },
    { id: 'explorer',  label: 'Dataset',       icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 px-4 lg:px-6 py-3 flex items-center justify-between shadow-xl gap-3">

      {/* Mobile Hamburger */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Brand */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Bot className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          {/* Online indicator */}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
            isReady ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
          }`} />
        </div>

        <div className="hidden sm:block">
          <div className="flex items-center space-x-2">
            <h1 className="font-extrabold text-lg tracking-tight font-['Outfit'] text-white leading-none">
              Islamic <span className="gradient-text-emerald">RAG</span> AI
            </h1>
            <span className="hidden md:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              v2.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-none">
            FAISS · Qwen 2.5 · DistilGPT2
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800/80 shrink-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === id
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className={id === 'explorer' ? 'hidden sm:inline' : ''}>{label}</span>
          </button>
        ))}
      </nav>

      {/* Status Pill + Settings */}
      <div className="flex items-center space-x-2 shrink-0">

        {/* Guardrail status */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400 text-[11px]">Islamic Only</span>
        </div>

        {/* Device + Document count */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <Cpu className={`w-3.5 h-3.5 ${isOnCPU ? 'text-amber-400' : 'text-emerald-400'}`} />
          <span className="text-slate-300 font-mono text-[11px]">
            {isOnCPU ? 'CPU Mode' : 'GPU Mode'}
          </span>
          {stats?.total_documents && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-semibold">
                {stats.total_documents.toLocaleString()} texts
              </span>
            </>
          )}
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
