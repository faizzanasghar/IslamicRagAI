import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  User, Bot, Clock, Sparkles, Copy, Check,
  ChevronDown, ChevronUp, BookOpen, Cpu,
  AlertTriangle, Loader2, ShieldAlert
} from 'lucide-react';
import SourceCard from './SourceCard';

export default function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  const isOffTopic = message.isOffTopic;
  const isModelLoading = message.isModelLoading;
  const isError = message.isError;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ------------------------------------------------------------------
  // User Bubble
  // ------------------------------------------------------------------
  if (isUser) {
    return (
      <div className="flex gap-3 my-3 justify-end animate-fadeIn">
        <div className="max-w-[82%] sm:max-w-[75%]">
          <div className="p-4 rounded-2xl rounded-tr-none bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-sm leading-relaxed shadow-lg shadow-emerald-600/15 border border-emerald-500/30">
            {message.content}
          </div>
        </div>
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 shrink-0 mt-1">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Off-Topic Rejection Card
  // ------------------------------------------------------------------
  if (isOffTopic) {
    return (
      <div className="flex gap-3 my-3 justify-start animate-fadeIn">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center shrink-0 mt-1">
          <ShieldAlert className="w-4 h-4 text-white" />
        </div>
        <div className="max-w-[82%] sm:max-w-[75%]">
          <div className="off-topic-card p-4 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Outside My Knowledge Domain</span>
            </div>
            <p className="text-sm text-amber-100/90 leading-relaxed">
              {message.content}
            </p>
            <p className="text-[11px] text-amber-400/60 font-mono">
              Islamic relevance score: {message.confidence !== undefined
                ? `${(message.confidence * 100).toFixed(0)}%`
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // AI Answer Bubble (streaming / loaded / model-loading / error)
  // ------------------------------------------------------------------
  return (
    <div className="flex gap-3 my-3 justify-start animate-fadeIn">
      {/* AI Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-md ${
        isError
          ? 'bg-rose-600'
          : 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20'
      }`}>
        <Bot className="w-4 h-4 text-slate-950" />
      </div>

      <div className="max-w-[84%] sm:max-w-[78%] space-y-2">
        {/* Main Bubble */}
        <div className="glass-panel p-4 rounded-2xl rounded-tl-none border border-slate-800 shadow-xl space-y-2">

          {/* Header row: model badge + timing */}
          {(message.model_used || message.total_time_ms) && (
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-1 border-b border-slate-800/60 text-xs">
              {message.model_used && (
                <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                  <Cpu className="w-3 h-3" />
                  <span>{message.model_used}</span>
                </span>
              )}
              {message.total_time_ms && !isStreaming && (
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-teal-400" />
                  <span>Search: {message.search_time_ms}ms</span>
                  <span>•</span>
                  <span>Gen: {message.generation_time_ms}ms</span>
                </div>
              )}
              {isModelLoading && (
                <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Model Loading...</span>
                </span>
              )}
            </div>
          )}

          {/* Message Text — rendered as Markdown */}
          <div className={`markdown-content ${isStreaming ? 'typing-cursor' : ''}`}>
            {isStreaming && !message.content ? (
              /* Initial streaming shimmer */
              <div className="flex items-center space-x-2 text-slate-400 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Thinking...</span>
              </div>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            )}
          </div>

          {/* Footer: sources toggle + copy button */}
          {!isStreaming && !isError && (
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-800/50 text-xs">
              {message.retrieved_documents?.length > 0 ? (
                <button
                  onClick={() => setSourcesOpen((v) => !v)}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition text-xs font-semibold border border-emerald-500/20"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{message.retrieved_documents.length} Sources</span>
                  {sourcesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              ) : (
                <span />
              )}

              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2 py-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Expandable Sources Drawer */}
        {!isUser && sourcesOpen && message.retrieved_documents?.length > 0 && (
          <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-3 bg-slate-900/90 shadow-2xl animate-fadeIn">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Retrieved Passages ({message.retrieved_documents.length})</span>
            </h4>
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {message.retrieved_documents.map((doc, idx) => (
                <SourceCard key={idx} doc={doc} index={idx} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
