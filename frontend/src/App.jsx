import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import RagInspector from './components/RagInspector';
import DatasetExplorer from './components/DatasetExplorer';
import SettingsModal from './components/SettingsModal';
import WelcomeBanner from './components/WelcomeBanner';

const DEFAULT_SETTINGS = {
  model_key: 'qwen',
  top_k: 5,
  temperature: 0.7,
  max_new_tokens: 250,
};

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // mobile
  const [showWelcome, setShowWelcome] = useState(false);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('rag_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('rag_settings', JSON.stringify(settings));
  }, [settings]);

  // Show welcome banner on first visit
  useEffect(() => {
    if (!localStorage.getItem('welcome_seen')) {
      setShowWelcome(true);
    }
  }, []);

  const handleWelcomeClose = () => {
    localStorage.setItem('welcome_seen', 'true');
    setShowWelcome(false);
  };

  // Poll health & stats
  const fetchHealthAndStats = async () => {
    try {
      const [hRes, sRes] = await Promise.all([
        fetch('/api/health').catch(() => null),
        fetch('/api/stats').catch(() => null),
      ]);
      if (hRes?.ok) setHealthStatus(await hRes.json());
      if (sRes?.ok) setStats(await sRes.json());
    } catch (e) {
      console.warn('Backend connection pending...', e);
    }
  };

  useEffect(() => {
    fetchHealthAndStats();
    const interval = setInterval(fetchHealthAndStats, 15000);
    return () => clearInterval(interval);
  }, []);

  // ------------------------------------------------------------------
  // SSE Streaming Chat Handler
  // ------------------------------------------------------------------
  const handleSendMessage = async (queryText) => {
    if (!queryText.trim() || loading) return;

    const userMsg = { role: 'user', content: queryText };
    const aiPlaceholder = {
      role: 'assistant',
      content: '',
      isStreaming: true,
      model_used: settings.model_key,
    };

    setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          model_key: settings.model_key,
          top_k: settings.top_k,
          temperature: settings.temperature,
          max_new_tokens: settings.max_new_tokens,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail?.message || errData.detail || `Server error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;

          try {
            const data = JSON.parse(raw);
            updateMessageFromEvent(data);
          } catch {
            /* ignore malformed SSE lines */
          }
        }
      }
    } catch (err) {
      // Remove placeholder on failure
      setMessages((prev) => prev.slice(0, -1));
      setError(`Connection error: ${err.message || 'Could not reach the backend.'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateMessageFromEvent = (data) => {
    setMessages((prev) => {
      const msgs = [...prev];
      const lastIdx = msgs.length - 1;
      const last = msgs[lastIdx];
      if (!last || last.role !== 'assistant') return prev;

      switch (data.type) {
        case 'token':
          return [
            ...msgs.slice(0, lastIdx),
            { ...last, content: last.content + (data.text || '') },
          ];

        case 'done':
          return [
            ...msgs.slice(0, lastIdx),
            {
              ...last,
              isStreaming: false,
              sources: data.sources,
              retrieved_documents: data.retrieved_documents,
              search_time_ms: data.search_time_ms,
              generation_time_ms: data.generation_time_ms,
              total_time_ms: data.total_time_ms,
              model_used: data.model_used,
            },
          ];

        case 'off_topic':
          return [
            ...msgs.slice(0, lastIdx),
            {
              ...last,
              isStreaming: false,
              isOffTopic: true,
              content: data.message,
              confidence: data.confidence,
            },
          ];

        case 'model_loading':
          return [
            ...msgs.slice(0, lastIdx),
            {
              ...last,
              isStreaming: false,
              isModelLoading: true,
              content: data.message,
              retrieved_documents: data.retrieved_documents || [],
              sources: data.sources || [],
              search_time_ms: data.search_time_ms,
              model_used: data.model_used,
            },
          ];

        case 'error':
          return [
            ...msgs.slice(0, lastIdx),
            {
              ...last,
              isStreaming: false,
              isError: true,
              content: `⚠️ Generation error: ${data.message}`,
            },
          ];

        default:
          return prev;
      }
    });
  };

  const handleSelectPrompt = (promptText) => {
    setActiveTab('chat');
    setIsSidebarOpen(false);
    handleSendMessage(promptText);
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 font-sans text-slate-100">
      {/* Welcome Banner (first visit) */}
      {showWelcome && (
        <WelcomeBanner onClose={handleWelcomeClose} stats={stats} />
      )}

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
        healthStatus={healthStatus}
        stats={stats}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="sidebar-mobile-overlay lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar — desktop: always visible, mobile: drawer */}
        <div className={`
          ${isSidebarOpen ? 'sidebar-mobile' : 'hidden'}
          lg:relative lg:flex lg:w-80 lg:shrink-0
        `}>
          <Sidebar
            stats={stats}
            settings={settings}
            onSelectPrompt={handleSelectPrompt}
            onClearChat={handleClearChat}
            onOpenSettings={() => setIsSettingsOpen(true)}
            chatHistoryCount={messages.length}
          />
        </div>

        {/* Tab Views */}
        {activeTab === 'chat' && (
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            loading={loading}
            error={error}
            onSelectPrompt={handleSelectPrompt}
            settings={settings}
          />
        )}

        {activeTab === 'inspector' && (
          <RagInspector settings={settings} />
        )}

        {activeTab === 'explorer' && (
          <DatasetExplorer />
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />
    </div>
  );
}
