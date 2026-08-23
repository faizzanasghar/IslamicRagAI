import React, { useState, useEffect } from 'react';
import { Database, Search, RefreshCw, BookOpen, Layers } from 'lucide-react';
import SourceCard from './SourceCard';

export default function DatasetExplorer() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dataset/sample?limit=12');
      if (res.ok) {
        const data = await res.json();
        setSamples(data.samples || []);
      }
    } catch (e) {
      console.error("Failed to load samples", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  const filteredSamples = samples.filter(s => 
    s.text.toLowerCase().includes(filterText.toLowerCase()) ||
    s.source.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Outfit'] text-white">
                Islamic Knowledge Base <span className="gradient-text-gold">Explorer</span>
              </h2>
              <p className="text-xs text-slate-400">
                Browse 20,000+ Quranic Verses and Hadiths in the dataset.
              </p>
            </div>
          </div>

          <button
            onClick={fetchSamples}
            disabled={loading}
            className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 transition flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Shuffle Samples</span>
          </button>
        </div>

        {/* Local Filter Bar */}
        <div className="pt-2">
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter current sample texts by keyword or surah..."
            className="w-full py-2.5 px-4 rounded-xl glass-input text-xs text-white"
          />
        </div>
      </div>

      {/* Grid of Samples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSamples.map((sample, idx) => (
          <SourceCard key={idx} doc={sample} index={idx} />
        ))}
      </div>
    </div>
  );
}
