import React, { useState } from 'react';
import { BookOpen, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';

export default function SourceCard({ doc, index }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Source: ${doc.source}\nText: ${doc.text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scorePercentage = doc.score ? Math.round(doc.score * 100) : null;

  return (
    <div className="glass-card p-3.5 rounded-xl text-xs space-y-2 border border-slate-800/90 relative group hover:border-emerald-500/40">
      {/* Header with Source title & Similarity Score */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <h4 className="font-semibold text-slate-200 truncate font-['Outfit']">
            {doc.source || `Reference #${index + 1}`}
          </h4>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {scorePercentage !== null && (
            <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
              scorePercentage > 75 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : scorePercentage > 50
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-700/50 text-slate-300 border-slate-600'
            }`}>
              {scorePercentage}% Match
            </span>
          )}

          <button
            onClick={handleCopy}
            className="p-1 rounded bg-slate-800/60 text-slate-400 hover:text-slate-200 transition"
            title="Copy reference snippet"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Snippet text */}
      <p className="text-slate-300 leading-relaxed font-sans italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
        "{doc.text}"
      </p>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
        <span className="flex items-center space-x-1">
          <ShieldCheck className="w-3 h-3 text-teal-400" />
          <span>FAISS Vector Chunk</span>
        </span>
        {doc.id !== undefined && (
          <span className="font-mono">ID: #{doc.id}</span>
        )}
      </div>
    </div>
  );
}
