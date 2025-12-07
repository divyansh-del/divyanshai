
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import WriteForMe from './components/WriteForMe';
import AuthScreen from './components/AuthScreen';
import JoinPreview from './components/JoinPreview';
import { SearchChatsView, LibraryView, MarketplaceView } from './components/ModuleViews';
import { ViewMode, Message, GPT, LibraryItem, ChatSession, CanvasState, ScheduledTask, ModelMode, getColorVariants } from './types';
import { streamGeminiResponse, generateTitle, generateImage, checkContentSafety, generateSummary } from './services/geminiService';
import { supabase, isSupabaseConnected } from './services/supabaseClient';
import * as Icons from './components/Icons';
import { SettingsProvider, useSettings } from './services/SettingsContext';

function InnerApp() {
  const { settings } = useSettings();
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Chat);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile to prevent flash
  const isDarkMode = settings.general?.theme === 'Dark' || (settings.general?.theme === 'System' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [activeGPT, setActiveGPT] = useState<GPT | null>(null);
  const [userGPTs, setUserGPTs] = useState<GPT[]>([]);
  
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [modelMode, setModelMode] = useState<ModelMode>('Flash');
  const [isDeepThinking, setIsDeepThinking] = useState(false);

  useEffect(() => {
      if (modelMode === 'Reasoning') setIsDeepThinking(true);
      else setIsDeepThinking(false);
  }, [modelMode]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [canvasState, setCanvasState] = useState<CanvasState>({
      isOpen: false,
      content: '',
      language: 'javascript'
  });

  // Open sidebar by default on large screens
  useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth >= 768) {
              setSidebarOpen(true);
          } else {
              setSidebarOpen(false);
          }
      };
      handleResize(); // Initial check
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { checkSession(); }, []);

  // ... (Supabase & Scheduler Effects same as before) ...
  useEffect(() => {
      if (!isSupabaseConnected() || !supabase || !isAuthenticated) return;
      const channel = supabase.channel('realtime_chats')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, (payload: any) => {
                  if (payload.eventType === 'UPDATE' && payload.new.id === currentSessionId) {
                      setMessages(payload.new.messages);
                  }
                  loadData();
              }
          ).subscribe();
      return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated, currentSessionId]);

  useEffect(() => {
      const interval = setInterval(() => {
          const now = Date.now();
          const pendingTasks = scheduledTasks.filter(t => !t.executed && t.scheduledFor <= now);
          if (pendingTasks.length > 0) {
              pendingTasks.forEach(task => handleSendMessage(task.prompt));
              setScheduledTasks(prev => prev.map(t => pendingTasks.find(pt => pt.id === t.id) ? { ...t, executed: true } : t));
          }
      }, 10000); 
      return () => clearInterval(interval);
  }, [scheduledTasks, messages]); 

  // ... (Load/Save Data functions same as before) ...
  const checkSession = async () => {
    // Artificial delay for smoother loading experience
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 800));
    
    if (isSupabaseConnected() && supabase) {
       const { data: { session } } = await supabase.auth.getSession();
       await minLoadTime;
       
       if (session) { setIsAuthenticated(true); loadData(); } 
       else { setIsAuthenticated(false); loadData(true); }
    } else { 
        await minLoadTime;
        loadData(true); 
    }
    setIsAuthChecking(false);
  };

  const loadData = async (forceLocal = false) => {
      if (!forceLocal && isSupabaseConnected() && supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
             const { data: remoteSessions } = await supabase.from('chats').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
             if (remoteSessions && remoteSessions.length > 0) {
                 const mapped = remoteSessions.map((s: any) => ({
                     id: s.id,
                     title: s.title,
                     preview: s.messages.length > 0 ? s.messages[s.messages.length - 1].content.substring(0, 50) : 'Empty',
                     updatedAt: new Date(s.updated_at).getTime(),
                     messages: s.messages
                 }));
                 setChatSessions(mapped);
                 return;
             }
          }
      }
      try {
          const localSessions = JSON.parse(localStorage.getItem('chatbharat_sessions') || '[]');
          localSessions.sort((a: ChatSession, b: ChatSession) => b.updatedAt - a.updatedAt);
          setChatSessions(localSessions);
          const localActive = localStorage.getItem('chatbharat_current_session_id');
          if(localActive) {
             const sess = localSessions.find((s:any) => s.id === localActive);
             if(sess) { setCurrentSessionId(localActive); setMessages(sess.messages); }
          }
      } catch (e) { console.error("Load error", e); }
  };

  const saveData = async (updatedSessions: ChatSession[], specificId?: string) => {
      localStorage.setItem('chatbharat_sessions', JSON.stringify(updatedSessions));
      if (currentSessionId) localStorage.setItem('chatbharat_current_session_id', currentSessionId);
      if (isSupabaseConnected() && supabase && specificId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              const sessionToSave = updatedSessions.find(s => s.id === specificId);
              if (sessionToSave) {
                  await supabase.from('chats').upsert({
                      id: sessionToSave.id,
                      user_id: user.id,
                      title: sessionToSave.title,
                      messages: sessionToSave.messages,
                      updated_at: new Date().toISOString()
                  });
              }
          }
      }
  };

  const handleClearAllData = async () => {
      localStorage.removeItem('chatbharat_sessions');
      localStorage.removeItem('chatbharat_current_session_id');
      setChatSessions([]); setMessages([]); setCurrentSessionId(null);
      if (isSupabaseConnected() && supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) await supabase.from('chats').delete().eq('user_id', user.id);
      }
      alert("All chat history has been deleted.");
  };

  const deleteSession = async (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const updatedSessions = chatSessions.filter(s => s.id !== id);
      setChatSessions(updatedSessions);
      if (currentSessionId === id) handleNewChat();
      saveData(updatedSessions);
      if (isSupabaseConnected() && supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) await supabase.from('chats').delete().eq('id', id).eq('user_id', user.id);
      }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
  };

  const readFileText = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsText(file);
    });
  };

  const handleSaveMessage = (role: 'user' | 'model', content: string) => {
    if (!content.trim()) return;
    const msg: Message = { id: Date.now().toString(), role, content, timestamp: Date.now() };
    setMessages(prev => {
        const next = [...prev, msg];
        updateSessionState(next);
        return next;
    });
  };

  const updateSessionState = (msgs: Message[]) => {
      let sessionId = currentSessionId;
      if (!sessionId) {
          sessionId = Date.now().toString();
          setCurrentSessionId(sessionId);
          const firstMsg = msgs[0]?.content || 'New Chat';
          const title = firstMsg.substring(0, 30) + (firstMsg.length > 30 ? '...' : '');
          const preview = msgs[msgs.length - 1]?.content.substring(0, 60) + '...';
          setChatSessions(prev => {
              const newSession: ChatSession = { id: sessionId!, title, preview, updatedAt: Date.now(), messages: msgs };
              const updated = [newSession, ...prev];
              saveData(updated, sessionId!);
              return updated;
          });
      } else {
          setChatSessions(prev => {
              const updated = prev.map(s => {
                  if (s.id === sessionId) {
                      return { ...s, messages: msgs, preview: msgs[msgs.length - 1]?.content.substring(0, 60) + '...', updatedAt: Date.now() };
                  }
                  return s;
              });
              updated.sort((a, b) => b.updatedAt - a.updatedAt);
              saveData(updated, sessionId!);
              return updated;
          });
      }
  };

  // --- MAIN CHAT HANDLER ---
  const handleSendMessage = async (content: string, attachment?: File) => {
    // Parental Control
    if (settings.parental?.restricted_mode) {
        const blocked = (settings.parental.blocked_words || '').split(',').map(w => w.trim().toLowerCase()).filter(w => w);
        const hasBadWord = blocked.some(word => content.toLowerCase().includes(word));
        if (hasBadWord) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: '⚠️ Message blocked by Parental Controls.', timestamp: Date.now() }]);
            return;
        }
    }

    let finalContent = content;
    let imageBase64 = undefined;

    if (attachment) {
        if (attachment.type.startsWith('image/')) imageBase64 = await fileToBase64(attachment);
        else if (attachment.type === 'text/plain' || attachment.type === 'application/json') {
            const textContent = await readFileText(attachment);
            finalContent += `\n\n[Attached File Content]:\n${textContent}`;
        }
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: finalContent, timestamp: Date.now(), image: imageBase64 };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    updateSessionState(newMessages);
    setIsThinking(true);

    try {
      const safety = await checkContentSafety(content);
      if (!safety.allowed) throw new Error(safety.error);

      if (content.trim().toLowerCase().startsWith('/image')) {
          const prompt = content.substring(7).trim();
          const img = await generateImage(prompt);
          if (img) {
               const aiMsg: Message = { id: Date.now().toString(), role: 'model', content: `Generated: ${prompt}`, image: img, timestamp: Date.now() };
               setMessages(prev => { const next = [...prev, aiMsg]; updateSessionState(next); return next; });
          }
          setIsThinking(false);
          return;
      }

      const aiMsgId = (Date.now() + 1).toString();
      let aiContent = "";
      let groundingData = undefined;
      let activeAgent = undefined; // Track detected agent
      
      setMessages(prev => [...prev, { id: aiMsgId, role: 'model', content: '', timestamp: Date.now() }]);

      const stream = streamGeminiResponse(
          newMessages, 
          finalContent, 
          settings, 
          activeGPT?.systemInstruction, 
          imageBase64,
          isDeepThinking,
          modelMode
      );

      for await (const chunk of stream) {
          if (typeof chunk === 'string') {
              aiContent += chunk;
              setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: aiContent, groundingMetadata: groundingData, agent: activeAgent } : m));
          } else if (typeof chunk === 'object') {
              if ('groundingMetadata' in chunk) {
                  groundingData = (chunk as any).groundingMetadata;
                  setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, groundingMetadata: groundingData } : m));
              }
              if ('activeAgentId' in chunk) {
                  activeAgent = (chunk as any).activeAgentId;
                  // Immediately update message to show agent badge
                  setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, agent: activeAgent } : m));
              }
          }
      }

      const finalMsg: Message = { id: aiMsgId, role: 'model', content: aiContent, timestamp: Date.now(), groundingMetadata: groundingData, agent: activeAgent };
      const finalMsgs = [...newMessages, finalMsg];
      updateSessionState(finalMsgs);
      
      if (messages.length === 0) {
          generateTitle(content).then(t => {
               setChatSessions(prev => {
                   const updated = prev.map(s => s.id === currentSessionId ? { ...s, title: t } : s);
                   saveData(updated, currentSessionId!);
                   return updated;
               });
          });
      }

    } catch (error: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `Error: ${error.message || 'Network issue'}`, timestamp: Date.now() }]);
    } finally { 
        setIsThinking(false); 
    }
  };

  const handleEditMessage = (id: string, newContent: string) => {
      const idx = messages.findIndex(m => m.id === id);
      if (idx === -1) return;
      const truncated = messages.slice(0, idx);
      setMessages(truncated);
      handleSendMessage(newContent);
  };

  const handleRegenerate = () => {
      if (messages.length === 0) return;
      let newMsgs = [...messages];
      if (newMsgs[newMsgs.length - 1].role === 'model') newMsgs.pop();
      const lastUserMsg = newMsgs[newMsgs.length - 1];
      if (!lastUserMsg || lastUserMsg.role !== 'user') return;
      newMsgs.pop();
      setMessages(newMsgs);
      handleSendMessage(lastUserMsg.content);
  };

  const handleSummarize = async () => {
      setIsThinking(true);
      const summary = await generateSummary(messages);
      setIsThinking(false);
      const summaryMsg: Message = { id: Date.now().toString(), role: 'model', content: `**Conversation Summary:**\n\n${summary}`, timestamp: Date.now() };
      setMessages(prev => { const next = [...prev, summaryMsg]; updateSessionState(next); return next; });
  };

  const handleScheduleMessage = (content: string, time: number) => {
      const newTask: ScheduledTask = { id: Date.now().toString(), prompt: content, scheduledFor: time, executed: false, type: 'message' };
      setScheduledTasks(prev => [...prev, newTask]);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `Message scheduled for ${new Date(time).toLocaleString()}: "${content}"`, timestamp: Date.now() }]);
  };

  const handleNewChat = () => { setMessages([]); setCurrentSessionId(null); setActiveGPT(null); setIsDeepThinking(false); setCanvasState(prev => ({ ...prev, isOpen: false })); };
  const handleLoadSession = (id: string) => { 
      const s = chatSessions.find(x => x.id === id); 
      if(s) { setMessages(s.messages); setCurrentSessionId(id); setViewMode(ViewMode.Chat); localStorage.setItem('chatbharat_current_session_id', id); setCanvasState(prev => ({ ...prev, isOpen: false })); } 
      // Auto close sidebar on mobile when loading a chat
      if (window.innerWidth < 768) {
          setSidebarOpen(false);
      }
  };
  
  if (isAuthChecking) {
      return (
          <div className={`flex h-screen w-full items-center justify-center ${isDarkMode ? 'bg-gray-950' : 'bg-white'}`}>
              <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 animate-breathing mb-4">
                      <Icons.Bot className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-sm font-medium text-gray-500 tracking-wider uppercase animate-pulse">Initializing Ultra Core...</div>
              </div>
          </div>
      );
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
      
      {/* Mobile Sidebar Toggle - Visible when sidebar is closed */}
      <div className={`fixed top-4 left-4 z-50 md:hidden ${!sidebarOpen ? 'block' : 'hidden'}`}>
        <button onClick={() => setSidebarOpen(true)} className={`p-2 rounded-xl shadow-lg transition-transform active:scale-95 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black border border-gray-200'}`}>
            <Icons.LayoutGrid className="w-5 h-5" />
        </button>
      </div>

      <Sidebar 
        currentView={viewMode} setView={setViewMode} isOpen={sidebarOpen} toggleOpen={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat} onGroupChat={() => setViewMode(ViewMode.GroupChat)} chatSessions={chatSessions} currentSessionId={currentSessionId}
        onLoadSession={handleLoadSession} onDeleteSession={deleteSession} isDarkMode={isDarkMode}
      />

      {/* Guest Mode Indicator (Floating) */}
      {!isAuthenticated && !isAuthChecking && (
          <div className="fixed bottom-4 left-4 z-[60] pointer-events-none md:left-72">
              <div className="bg-orange-500/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm shadow-lg border border-orange-400/50 flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></span>
                  Guest Mode
              </div>
          </div>
      )}
      
      <main className="flex-1 flex flex-col relative transition-all duration-300 w-full">
        {(viewMode === ViewMode.Chat || viewMode === ViewMode.GroupChat) && (
          <ChatArea 
            messages={messages} isThinking={isThinking} onSendMessage={handleSendMessage} onFeedback={() => {}}
            onClearChat={() => setMessages([])} isGroup={viewMode === ViewMode.GroupChat} activeGPT={activeGPT}
            layoutMode={settings.layoutMode} isDarkMode={isDarkMode} settings={settings}
            onSaveMessage={handleSaveMessage} isDeepThinking={isDeepThinking}
            currentModel={modelMode} onModelChange={setModelMode}
            onToggleDeepThinking={() => { const newMode = isDeepThinking ? 'Flash' : 'Reasoning'; setModelMode(newMode); }}
            onEditMessage={handleEditMessage} onRegenerate={handleRegenerate}
            canvasState={canvasState} onOpenCanvas={(code, lang) => setCanvasState({ isOpen: true, content: code, language: lang, title: 'Code Editor' })}
            onCloseCanvas={() => setCanvasState(prev => ({ ...prev, isOpen: false }))}
            onSummarize={handleSummarize} onScheduleMessage={handleScheduleMessage}
          />
        )}
        {viewMode === ViewMode.Settings && <SettingsModal onClose={() => setViewMode(ViewMode.Chat)} settings={settings} onUpdateSettings={()=>{}} isDarkMode={isDarkMode} onLogout={()=>{supabase?.auth.signOut(); setIsAuthenticated(false);}} onClearAllData={handleClearAllData} />}
        {viewMode === ViewMode.Auth && <AuthScreen onLoginSuccess={() => { setIsAuthenticated(true); loadData(); setViewMode(ViewMode.Chat); }} />}
        {viewMode === ViewMode.WriteForMe && <WriteForMe isDarkMode={isDarkMode} />}
        {viewMode === ViewMode.JoinPreview && <JoinPreview onJoinClick={() => setViewMode(ViewMode.GroupChat)} />}
        {viewMode === ViewMode.Search && <SearchChatsView chatSessions={chatSessions} onLoadSession={handleLoadSession} isDarkMode={isDarkMode} />}
        {viewMode === ViewMode.Library && <LibraryView isDarkMode={isDarkMode} />}
        {viewMode === ViewMode.Marketplace && <MarketplaceView onSelectGPT={(gpt) => { setActiveGPT(gpt); setViewMode(ViewMode.Chat); }} onCreateGPT={(g) => setUserGPTs(p => [...p, g])} userGPTs={userGPTs} isDarkMode={isDarkMode} />}
      </main>
    </div>
  );
}

export default function App() {
    return <SettingsProvider><InnerApp /></SettingsProvider>;
}
