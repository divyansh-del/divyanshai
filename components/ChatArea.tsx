
import React, { useState, useRef, useEffect } from 'react';
import { Message, CommandOption, GPT, LayoutMode, AppSettings, CanvasState, Agent, ModelMode, getColorVariants } from '../types';
import * as Icons from './Icons';
import ReactMarkdown from 'react-markdown'; 
import VoiceModeOverlay from './VoiceModeOverlay';
import Canvas from './Canvas'; 

interface ChatAreaProps {
  messages: Message[];
  isThinking: boolean;
  onSendMessage: (content: string, attachment?: File) => void;
  onSaveMessage: (role: 'user' | 'model', content: string) => void;
  onFeedback: (id: string, type: 'up' | 'down') => void;
  onClearChat: () => void;
  isGroup?: boolean;
  onTestVisitorFlow?: () => void;
  activeGPT?: GPT | null;
  layoutMode: LayoutMode;
  isDarkMode: boolean;
  settings: AppSettings;
  isDeepThinking?: boolean;
  onToggleDeepThinking?: () => void;
  currentModel?: ModelMode;
  onModelChange?: (model: ModelMode) => void;
  onEditMessage?: (id: string, newContent: string) => void;
  onRegenerate?: () => void;
  canvasState?: CanvasState;
  onOpenCanvas?: (code: string, language: string) => void;
  onCloseCanvas?: () => void;
  onSummarize?: () => void;
  onScheduleMessage?: (content: string, time: number) => void;
}

const commands: CommandOption[] = [
  { command: 'image', description: 'Generate an image', icon: Icons.ImageIcon },
  { command: 'summarize', description: 'Summarize text or docs', icon: Icons.FileText },
  { command: 'code', description: 'Generate optimized code', icon: Icons.Code },
  { command: 'plan', description: 'Create a strategic plan', icon: Icons.Compass },
  { command: 'fix', description: 'Debug and fix issues', icon: Icons.Zap },
];

const AGENT_COLORS: Record<string, string> = {
    'devmaster': 'bg-green-500',
    'bizguru': 'bg-yellow-500',
    'studybuddy': 'bg-purple-500',
    'techfixer': 'bg-red-500'
};

const AGENT_NAMES: Record<string, string> = {
    'devmaster': 'DevMaster',
    'bizguru': 'BizGuru',
    'studybuddy': 'StudyBuddy',
    'techfixer': 'TechFixer'
};

const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, isThinking, onSendMessage, onSaveMessage, onFeedback, onClearChat, isGroup, onTestVisitorFlow, activeGPT,
  layoutMode, isDarkMode, settings, isDeepThinking, onToggleDeepThinking,
  currentModel, onModelChange, onEditMessage, onRegenerate,
  canvasState, onOpenCanvas, onCloseCanvas, onSummarize, onScheduleMessage
}) => {
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const accentColor = settings.general?.accentColor || 'Blue';
  const colors = getColorVariants(accentColor);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [expandedThinking, setExpandedThinking] = useState<string | null>(null);
  const [showAgentManager, setShowAgentManager] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false); 
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [groupId, setGroupId] = useState('6925359e20cc819ab3dbde7d45');
  const [resettingLink, setResettingLink] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const commandQuery = input.startsWith('/') ? input.substring(1).toLowerCase() : '';
  const filteredCommands = showCommands ? commands.filter(cmd => cmd.command.toLowerCase().includes(commandQuery)) : [];

  const bgClass = isDarkMode ? 'bg-gray-950' : 'bg-white';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const userBubbleClass = isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900';
  const aiBubbleClass = isDarkMode ? 'text-gray-200' : 'text-gray-800';
  const headerBg = isDarkMode ? 'bg-gray-950/90 border-gray-800' : 'bg-white/90 border-gray-200';
  const composerBg = isDarkMode ? 'bg-gray-800' : 'bg-gray-100';
  const composerBorder = isDarkMode ? 'border-gray-700' : 'border-transparent';
  const composerText = isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500';
  const containerPadding = layoutMode === 'Compact' ? 'p-2' : 'p-4 md:p-6';
  const bubbleSpacing = layoutMode === 'Compact' ? 'space-y-2' : 'space-y-6';
  const bubblePadding = layoutMode === 'Compact' ? 'p-3 rounded-xl' : 'p-4 rounded-2xl';
  const fontSize = layoutMode === 'Compact' ? 'text-sm' : 'text-base';
  const avatarSize = layoutMode === 'Compact' ? 'w-6 h-6' : 'w-8 h-8';

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  const handleScroll = () => {
      if (scrollContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
          setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 100);
      }
  };
  useEffect(() => scrollToBottom(), [messages, isThinking]);

  const handleVoiceMessage = (role: 'user' | 'model', content: string) => onSaveMessage(role, content);
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value; setInput(val);
    if (val.startsWith('/') && !val.includes(' ')) { setShowCommands(true); setSelectedIndex(0); } else setShowCommands(false);
    e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };
  const insertCommand = (cmd: string) => {
    if (cmd === 'summarize' && onSummarize) { onSummarize(); setInput(''); setShowCommands(false); return; }
    setInput(`/${cmd} `); setShowCommands(false); textareaRef.current?.focus();
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showCommands && filteredCommands.length > 0) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => (prev + 1) % filteredCommands.length); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length); return; }
        if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) { e.preventDefault(); insertCommand(filteredCommands[selectedIndex].command); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape') { setShowCommands(false); setShowInviteModal(false); setShowOptions(false); setShowAgentManager(false); setShowScheduleModal(false); setShowModelDropdown(false); setEditingId(null); }
  };
  const handleSend = () => {
    if (!input.trim() && !attachment) return;
    if (input.trim() === '/summarize' && onSummarize) { onSummarize(); setInput(''); return; }
    onSendMessage(input, attachment || undefined); setInput(''); setAttachment(null); setShowCommands(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };
  const handleScheduleSubmit = () => {
      if (!input.trim() || !scheduleDate || !scheduleTime) return;
      if (onScheduleMessage) onScheduleMessage(input, new Date(`${scheduleDate}T${scheduleTime}`).getTime());
      setShowScheduleModal(false); setInput(''); setScheduleDate(''); setScheduleTime('');
  };
  const handleCopy = (content: string, id: string) => { navigator.clipboard.writeText(content); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) setAttachment(e.target.files[0]); };
  const triggerFileSelect = () => fileInputRef.current?.click();
  const triggerVoiceMode = () => setShowVoiceOverlay(true);
  const triggerCanvas = () => { if (onOpenCanvas) onOpenCanvas('', 'javascript'); };
  const startEditing = (msg: Message) => { setEditingId(msg.id); setEditContent(msg.content); };
  const cancelEditing = () => { setEditingId(null); setEditContent(''); };
  const submitEdit = (id: string) => { if (onEditMessage) onEditMessage(id, editContent); setEditingId(null); setEditContent(''); };
  const toggleThinking = (id: string) => setExpandedThinking(prev => prev === id ? null : id);

  return (
    <div className={`flex-1 flex flex-row h-full relative transition-colors duration-300 overflow-hidden ${bgClass} ${textClass}`} onClick={() => {setShowOptions(false); setShowModelDropdown(false);}}>
      <div className={`flex-1 flex flex-col h-full relative min-w-0 transition-all ${canvasState?.isOpen ? 'md:pr-0' : ''}`}>
          <VoiceModeOverlay isOpen={showVoiceOverlay} onClose={() => setShowVoiceOverlay(false)} isDarkMode={isDarkMode} messages={messages} settings={settings} activeGPT={activeGPT || null} onAddMessage={handleVoiceMessage} />
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.csv,.txt" />

          {/* Schedule Modal */}
          {showScheduleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
              <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 w-full max-w-sm shadow-2xl`}>
                <h3 className={`text-lg font-bold mb-4 ${textClass}`}>Schedule Message</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className={`w-full p-2 rounded-lg text-sm border focus:outline-none ${colors.ring} ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                    <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className={`w-full p-2 rounded-lg text-sm border focus:outline-none ${colors.ring} ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                </div>
                <button onClick={handleScheduleSubmit} disabled={!input.trim() || !scheduleDate || !scheduleTime} className={`w-full py-2 ${colors.bg} ${colors.bgHover} text-white font-bold rounded-lg disabled:opacity-50`}>Confirm</button>
              </div>
            </div>
          )}

          {showClearConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
              <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 w-full max-w-sm shadow-2xl`}>
                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Clear chat history?</h3>
                <div className="flex justify-end space-x-3">
                  <button onClick={() => setShowClearConfirm(false)} className={`px-4 py-2 text-sm font-medium rounded-lg ${isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>Cancel</button>
                  <button onClick={() => { onClearChat(); setShowClearConfirm(false); }} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg">Clear chat</button>
                </div>
              </div>
            </div>
          )}

          {/* HEADER */}
          <div className={`h-14 border-b flex items-center justify-between px-4 sticky top-0 backdrop-blur-md z-30 transition-colors ${headerBg}`}>
            <div className="flex items-center">
                {activeGPT ? (
                    <><span className={`font-semibold ${textClass}`}>{activeGPT.name}</span><span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${colors.bg} text-white`}>GPT</span></>
                ) : (
                    <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setShowModelDropdown(!showModelDropdown); }} className={`group flex items-center space-x-1.5 cursor-pointer rounded-xl px-3 py-1.5 transition-all ${isDarkMode ? 'hover:bg-gray-800 text-gray-100' : 'hover:bg-gray-100 text-gray-900'}`}>
                            <span className="font-semibold text-lg tracking-tight">{currentModel === 'Flash' ? 'ChatBharat Flash' : currentModel === 'Pro' ? 'ChatBharat Pro' : 'Deep Reasoning'}</span>
                            <Icons.ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showModelDropdown && (
                            <div className={`absolute top-full left-0 mt-2 w-72 rounded-2xl border shadow-2xl z-50 p-2 animate-fade-in-up ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <div className="space-y-1">
                                    {[{ id: 'Flash', label: 'Flash', icon: Icons.Zap, color: 'text-green-500', bg: 'bg-green-500/10' }, { id: 'Pro', label: 'Pro', icon: Icons.Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10' }, { id: 'Reasoning', label: 'Reasoning', icon: Icons.Cpu, color: 'text-blue-500', bg: 'bg-blue-500/10' }].map((model) => (
                                        <button key={model.id} onClick={() => onModelChange?.(model.id as ModelMode)} className={`w-full text-left px-3 py-3 rounded-xl flex items-center justify-between transition-colors ${currentModel === model.id ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-100') : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50')}`}>
                                            <div className="flex items-center"><div className={`p-2 rounded-lg ${model.bg} ${model.color} mr-3`}><model.icon className="w-5 h-5" /></div><span className={`text-sm font-bold ${textClass}`}>{model.label}</span></div>
                                            {currentModel === model.id && <Icons.Check className={`w-4 h-4 ${colors.text}`} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
                <button onClick={triggerCanvas} className={`hidden md:flex items-center px-3 py-1.5 rounded-lg transition-all text-xs font-medium border ${canvasState?.isOpen ? `${colors.bgLight} ${colors.text} border-current` : 'text-gray-500 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}> <Icons.LayoutGrid className="w-4 h-4 mr-1.5" /> Canvas </button>
                <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setShowOptions(!showOptions); }} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}> <Icons.MoreHorizontal className="w-5 h-5" /> </button>
                    {showOptions && (
                        <div className={`absolute right-0 top-full mt-2 w-56 border rounded-xl shadow-2xl z-50 overflow-hidden p-1 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <button onClick={triggerCanvas} className={`md:hidden w-full text-left px-3 py-2 text-sm rounded-lg flex items-center transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}> <Icons.LayoutGrid className="w-4 h-4 mr-2.5" /> Open Canvas </button>
                            <button onClick={(e) => { e.stopPropagation(); setShowOptions(false); if (onSummarize) onSummarize(); }} className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}> <Icons.FileText className="w-4 h-4 mr-2.5" /> Summarize Chat </button>
                            <button onClick={(e) => { e.stopPropagation(); setShowOptions(false); if (onScheduleMessage) setShowScheduleModal(true); }} className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}> <Icons.Calendar className="w-4 h-4 mr-2.5" /> Schedule Message </button>
                            <div className={`h-px my-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}></div>
                            <button onClick={(e) => { e.stopPropagation(); setShowOptions(false); setShowClearConfirm(true); }} className={`w-full text-left px-3 py-2 text-sm rounded-lg text-red-500 flex items-center transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}> <Icons.Trash2 className="w-4 h-4 mr-2.5" /> Clear chat </button>
                        </div>
                    )}
                </div>
            </div>
          </div>

          {/* MESSAGES */}
          <div ref={scrollContainerRef} onScroll={handleScroll} className={`flex-1 overflow-y-auto custom-scrollbar ${containerPadding} ${bubbleSpacing} scroll-smooth`}>
             {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-fade-in" style={{animationDelay: '0.1s', animationFillMode: 'forwards'}}>
                    <div className="w-16 h-16 rounded-full bg-white shadow-glow mb-6 flex items-center justify-center transform transition-transform hover:scale-110 duration-500">
                        {activeGPT ? (
                            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-600">
                                {activeGPT.icon && Icons[activeGPT.icon as keyof typeof Icons] ? React.createElement(Icons[activeGPT.icon as keyof typeof Icons] as React.ElementType, {className: "w-8 h-8 text-black"}) : activeGPT.name[0]}
                            </div>
                        ) : ( <Icons.Bot className="w-10 h-10 text-gray-900" /> )}
                    </div>
                    <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>{activeGPT ? `Chat with ${activeGPT.name}` : 'How can I help you today?'}</h2>
                </div>
             ) : (
                 messages.map((msg, idx) => (
                    <div key={msg.id} className={`group flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                        <div className={`flex max-w-[95%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`flex-shrink-0 ${avatarSize} rounded-full flex items-center justify-center mt-1 shadow-sm ${msg.role === 'user' ? 'ml-3 bg-gray-600' : (msg.agent ? `${AGENT_COLORS[msg.agent]} mr-3` : 'mr-3 bg-white')}`}>
                                {msg.role === 'user' ? ( <span className="text-white text-xs font-bold">DV</span> ) : ( msg.agent ? <span className="text-white text-[10px] font-bold">{msg.agent[0].toUpperCase()}</span> : <Icons.Bot className="w-5 h-5 text-black" /> )}
                            </div>

                            <div className="flex flex-col min-w-0 w-full">
                                {/* Name & Time */}
                                <div className={`flex items-center mb-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} text-[10px] text-gray-500`}>
                                    <span className="font-bold mr-2">
                                        {msg.role === 'user' ? 'You' : (msg.agent ? AGENT_NAMES[msg.agent] : (activeGPT?.name || 'ChatBharat'))}
                                    </span>
                                    {msg.agent && <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-white mr-2 ${AGENT_COLORS[msg.agent]}`}>AUTO</span>}
                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>

                                {/* Bubble */}
                                {editingId === msg.id ? (
                                    <div className={`w-full p-4 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className={`w-full bg-transparent resize-none focus:outline-none text-sm mb-2 ${textClass}`} rows={3} autoFocus />
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={cancelEditing} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>Cancel</button>
                                            <button onClick={() => submitEdit(msg.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${colors.bg} text-white`}>Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`relative ${bubblePadding} ${msg.role === 'user' ? userBubbleClass : aiBubbleClass} ${fontSize} leading-relaxed shadow-sm`}>
                                        {msg.image && ( <div className="mb-3 rounded-lg overflow-hidden border border-gray-200/20"> {msg.image.startsWith('data:image/') ? <img src={msg.image} alt="Generated" className="max-w-full h-auto" /> : <div className={`p-4 flex items-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}><Icons.FileText className="w-8 h-8 text-gray-500 mr-3" /><div className="flex flex-col"><span className="text-sm font-bold">Attached Document</span></div></div>} </div> )}
                                        {msg.role === 'model' && currentModel === 'Reasoning' && (
                                            <div className="mb-4">
                                                <button onClick={() => toggleThinking(msg.id)} className={`flex items-center space-x-2 text-xs font-medium px-3 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                                    <Icons.Cpu className="w-3 h-3" /> <span>{expandedThinking === msg.id ? 'Hide Thought Process' : 'Show Thought Process'}</span> <Icons.ChevronDown className={`w-3 h-3 transition-transform ${expandedThinking === msg.id ? 'rotate-180' : ''}`} />
                                                </button>
                                                {expandedThinking === msg.id && ( <div className={`mt-2 p-3 rounded-lg border text-xs font-mono ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>Analysis complete.</div> )}
                                            </div>
                                        )}
                                        <div className="markdown-content">
                                            <ReactMarkdown components={{
                                                code({node, inline, className, children, ...props}: any) {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    const codeString = String(children).replace(/\n$/, '');
                                                    return !inline && match ? (
                                                        <div className="my-4 rounded-lg overflow-hidden border border-gray-700/50 bg-[#1e1e1e] shadow-lg">
                                                            <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] border-b border-gray-700/50">
                                                                <span className="text-xs text-gray-400 font-mono">{match[1]}</span>
                                                                <div className="flex items-center space-x-2">
                                                                    <button onClick={() => onOpenCanvas?.(codeString, match[1])} className="flex items-center text-[10px] text-blue-400 hover:text-blue-300"> <Icons.LayoutGrid className="w-3 h-3 mr-1" /> Open Canvas </button>
                                                                    <button onClick={() => handleCopy(codeString, msg.id + match[1])} className="flex items-center text-[10px] text-gray-400 hover:text-white"> {copiedId === msg.id + match[1] ? <Icons.Check className="w-3 h-3 mr-1" /> : <Icons.Copy className="w-3 h-3 mr-1" />} {copiedId === msg.id + match[1] ? 'Copied' : 'Copy'} </button>
                                                                </div>
                                                            </div>
                                                            <div className="p-3 overflow-x-auto text-sm font-mono text-gray-300"><code className={className} {...props}>{children}</code></div>
                                                        </div>
                                                    ) : ( <code className="bg-gray-200/20 dark:bg-gray-700/50 px-1 py-0.5 rounded font-mono text-[0.9em]" {...props}>{children}</code> );
                                                },
                                                a: ({href, children}) => <a href={href} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{children}</a>
                                            }}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                        {msg.groundingMetadata?.groundingChunks && msg.groundingMetadata.groundingChunks.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-200/20">
                                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center"> <Icons.Globe className="w-3 h-3 mr-1" /> Sources </div>
                                                <div className="flex flex-wrap gap-2"> {msg.groundingMetadata.groundingChunks.map((chunk, i) => chunk.web ? ( <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className={`block max-w-[200px] text-[10px] px-2 py-1.5 rounded border truncate transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'}`}> {chunk.web.title || new URL(chunk.web.uri!).hostname} </a> ) : null)} </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className={`flex items-center mt-1 space-x-2 transition-opacity ${msg.role === 'user' ? 'justify-end' : 'justify-start'} opacity-100 md:opacity-0 md:group-hover:opacity-100`}>
                                    <button onClick={() => handleCopy(msg.content, msg.id)} className="p-1 hover:text-gray-400 text-gray-500" title="Copy">{copiedId === msg.id ? <Icons.Check className="w-3 h-3" /> : <Icons.Copy className="w-3 h-3" />}</button>
                                    {msg.role === 'user' && !editingId && ( <button onClick={() => startEditing(msg)} className="p-1 hover:text-gray-400 text-gray-500" title="Edit Message"><Icons.Edit3 className="w-3 h-3" /></button> )}
                                    {msg.role === 'model' && ( <button onClick={() => onRegenerate && onRegenerate()} className={`p-1 hover:${colors.text} text-gray-500 ml-2`} title="Regenerate"><Icons.RefreshCw className="w-3 h-3" /></button> )}
                                </div>
                            </div>
                        </div>
                    </div>
                 ))
             )}
             
             {isThinking && ( 
                 <div className="flex flex-col ml-12 animate-fade-in mb-4"> 
                     <div className="flex items-center space-x-1.5 p-3 rounded-2xl w-fit bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 shadow-sm"> 
                         <div className="w-2.5 h-2.5 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full animate-bounce shadow-glow-sm" style={{animationDelay: '0s', animationDuration: '1s'}}></div> 
                         <div className="w-2.5 h-2.5 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full animate-bounce shadow-glow-sm" style={{animationDelay: '0.2s', animationDuration: '1s'}}></div> 
                         <div className="w-2.5 h-2.5 bg-gradient-to-tr from-pink-500 to-orange-500 rounded-full animate-bounce shadow-glow-sm" style={{animationDelay: '0.4s', animationDuration: '1s'}}></div> 
                     </div> 
                 </div> 
             )}
             <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* INPUT AREA */}
          <div className={`flex-shrink-0 p-3 md:p-4 relative z-20 ${bgClass}`}>
              {showCommands && ( <div className={`absolute bottom-full left-4 mb-2 w-64 rounded-xl border shadow-xl overflow-hidden animate-fade-in-up ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}> {filteredCommands.map((cmd, idx) => ( <button key={cmd.command} onClick={() => insertCommand(cmd.command)} className={`w-full text-left px-4 py-3 flex items-center space-x-3 text-sm ${idx === selectedIndex ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100') : ''} hover:bg-opacity-80`}> <div className={`p-1.5 rounded bg-gray-200 dark:bg-gray-600`}> <cmd.icon className="w-4 h-4 text-gray-700 dark:text-gray-200" /> </div> <div> <div className={`font-bold ${textClass}`}>/{cmd.command}</div> <div className="text-xs text-gray-500">{cmd.description}</div> </div> </button> ))} </div> )}
              
              <div className="flex items-end gap-2 md:gap-3 max-w-4xl mx-auto">
                <div className={`relative flex-1 rounded-[26px] border shadow-md transition-all duration-300 flex items-end ${composerBg} ${composerBorder} focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-offset-transparent ${colors.ring}`}>
                    <div className="flex items-center space-x-1 absolute left-3 bottom-2.5 z-10">
                        <button onClick={triggerFileSelect} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors" title="Attach File"><Icons.Paperclip className="w-5 h-5" /></button>
                        <button onClick={() => setShowScheduleModal(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors" title="Schedule"><Icons.Calendar className="w-5 h-5" /></button>
                    </div>
                    <textarea ref={textareaRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder={activeGPT ? `Message ${activeGPT.name}...` : "Message ChatBharat..."} className={`w-full max-h-[200px] py-4 pl-24 pr-12 bg-transparent resize-none outline-none custom-scrollbar leading-relaxed ${composerText}`} rows={1} />
                    <div className="absolute right-2 bottom-2">
                        <button onClick={handleSend} disabled={!input.trim() && !attachment} className={`p-2 rounded-full transition-all transform hover:scale-105 active:scale-95 ${input.trim() || attachment ? `${colors.bg} text-white shadow-lg` : 'bg-transparent text-gray-400 cursor-default'}`}> <Icons.Send className="w-5 h-5" /> </button>
                    </div>
                </div>
                <button onClick={triggerVoiceMode} className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 mb-0.5 ${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:opacity-80'}`} title="Start Voice Mode"> <Icons.Headphones className="w-6 h-6" /> </button>
              </div>
          </div>
      </div>
      {canvasState?.isOpen && onCloseCanvas && ( <Canvas canvasState={canvasState} onClose={onCloseCanvas} isDarkMode={isDarkMode} /> )}
    </div>
  );
};

export default ChatArea;