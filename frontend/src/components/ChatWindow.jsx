import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Bot, AlertCircle, ShieldCheck, CornerDownLeft } from 'lucide-react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({
  messages,
  onSendMessage,
  loading,
  error,
  onSelectPrompt,
  settings,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const samplePrompts = [
    { text: "What are the rights of a neighbor in Islam?", icon: "🏠" },
    { text: "What does the Quran say about patience?", icon: "📖" },
    { text: "Explain the concept of Tawheed.", icon: "☝️" },
    { text: "What is the significance of Zakat?", icon: "💛" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const modelLabel =
    settings.model_key === 'qwen'
      ? 'Qwen 2.5 (0.5B)'
      : settings.model_key === 'qwen_1.5b'
      ? 'Qwen 2.5 (1.5B)'
      : settings.model_key === 'qwen_3b'
      ? 'Qwen 2.5 (3B)'
      : settings.model_key === 'qwen_7b'
      ? 'Qwen 2.5 (7B)'
      : settings.model_key === 'distilgpt2_finetuned'
      ? 'Islamic DistilGPT2'
      : 'Base DistilGPT2';

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] relative overflow-hidden">

      {/* Islamic-only disclaimer banner */}
      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/5 border-b border-emerald-500/15 text-xs text-emerald-400/80">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>
          This assistant only answers questions about Islam, the Quran, Hadith, and Islamic knowledge.
        </span>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-8 space-y-1">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-7 py-12">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-0.5 shadow-2xl shadow-emerald-500/25 animate-float">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                <Bot className="w-9 h-9 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-arabic text-2xl text-amber-300/90 mb-1">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
              <h2 className="text-2xl font-extrabold font-['Outfit'] text-white">
                Islamic{' '}
                <span className="gradient-text-emerald">Knowledge</span>{' '}
                Assistant
              </h2>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Ask questions about Quranic verses, authentic Hadiths, Islamic history, fiqh, and more. Answers are grounded in a verified vector knowledge base.
              </p>
            </div>

            {/* Quick Prompt Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg pt-2">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectPrompt(prompt.text)}
                  className="glass-card p-3.5 rounded-2xl text-left border border-slate-800 hover:border-emerald-500/40 transition text-xs text-slate-300 hover:text-white flex items-start space-x-3 group animate-fadeIn"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <span className="text-lg shrink-0 group-hover:scale-110 transition-transform">
                    {prompt.icon}
                  </span>
                  <span className="line-clamp-2 leading-relaxed">{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))
        )}

        {/* Streaming / Loading Indicator */}
        {loading && messages.length > 0 && messages[messages.length - 1]?.isStreaming && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 px-2 py-1 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>
              Searching {settings.top_k} passages · Running {modelLabel}...
            </span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 my-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 glass-panel border-t border-slate-800/70">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto flex items-end gap-3"
        >
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Quran, Hadith, Islamic history, fiqh..."
              disabled={loading}
              rows={1}
              className="w-full py-3.5 pl-4 pr-12 rounded-2xl glass-input text-sm text-white placeholder-slate-400 resize-none overflow-hidden focus:outline-none"
            />
            {/* Hint */}
            {input.length > 0 && (
              <div className="absolute bottom-2.5 right-3 flex items-center space-x-1 text-[10px] text-slate-500 pointer-events-none">
                <CornerDownLeft className="w-3 h-3" />
                <span>Ctrl+↵</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-600/25 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-600 mt-2 max-w-4xl mx-auto">
          Answers are AI-generated from an Islamic knowledge base. Always verify with a qualified scholar.
        </p>
      </div>
    </div>
  );
}
