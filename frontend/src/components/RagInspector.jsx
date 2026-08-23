import React, { useState } from 'react';
import { Search, BookOpen, Clock, ShieldCheck, Sparkles, Loader2, Filter } from 'lucide-react';
import SourceCard from './SourceCard';

export default function RagInspector({ settings }) {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleInspect = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k: topK })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to perform vector retrieval.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
        
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-['Outfit'] text-white">
              FAISS <span className="gradient-text-emerald">RAG Inspector</span>
            </h2>
            <p className="text-xs text-slate-400">
              Inspect raw vector similarity matches, similarity scores, and metadata from the SentenceTransformer index.
            </p>
          </div>
        </div>

        {/* Search Controls */}
        <form onSubmit={handleInspect} className="flex flex-col sm:flex-row gap-3 pt-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type query to test vector search... e.g. 'charity and justice'"
            className="flex-1 py-3 px-4 rounded-xl glass-input text-sm text-white placeholder-slate-400"
          />

          <div className="flex items-center space-x-2 shrink-0">
            <label className="text-xs text-slate-400 font-semibold flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Top-K:</span>
            </label>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="py-3 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200"
            >
              {[3, 5, 8, 10, 15].map((k) => (
                <option key={k} value={k}>{k} passages</option>
              ))}
            </select>

            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition disabled:opacity-40 flex items-center space-x-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Inspect</span>
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Results View */}
      {results && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-200">
              Found {results.documents?.length || 0} vector matches for "{results.query}"
            </span>
            <span className="font-mono text-emerald-400 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{results.search_time_ms} ms</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.documents?.map((doc, idx) => (
              <SourceCard key={idx} doc={doc} index={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
