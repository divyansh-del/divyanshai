import React, { useState } from 'react';
import { ViewMode, SidebarItemProps, ChatSession } from '../types';
import * as Icons from './Icons';

interface SidebarProps {
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
  isOpen: boolean;
  toggleOpen: () => void;
  onNewChat: () => void;
  onGroupChat: () => void;
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  onLoadSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isDarkMode: boolean;
}

const SidebarItem: React.FC<SidebarItemProps & { isDarkMode: boolean }> = ({ icon: Icon, label, onClick, active, isSubItem, badge, isDarkMode }) => (
  <button
    onClick={onClick}
    className={`group flex items-center w-full px-3 py-2 text-sm rounded-lg transition-all duration-200 
      ${active 
        ? (isDarkMode ? 'bg-[#1e3a8a] text-white' : 'bg-[#e0f2fe] text-black') + ' font-medium border-2 border-dashed border-blue-500 scale-110 z-10 shadow-md'
        : (isDarkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-200 hover:text-black') + ' hover:scale-105 border-2 border-transparent'}
      ${isSubItem ? 'pl-9' : ''}
    `}
  >
    <Icon className={`w-4 h-4 mr-3 flex-shrink-0 ${active ? 'text-blue-500' : 'text-gray-500 group-hover:text-gray-300'}`} />
    <span className="flex-1 text-left truncate">{label}</span>
    {badge && (
      <span className="ml-auto bg-brand-600 text-[10px] font-bold px-1.5 py-0.5 rounded text-white">
        {badge}
      </span>
    )}
  </button>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="px-4 py-2 mt-4 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
    {title}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  isOpen, 
  onNewChat, 
  onGroupChat,
  chatSessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  isDarkMode
}) => {
  // Logic: Arrow Up = Shown, Arrow Down = Hidden (As requested)
  const [isChatsVisible, setIsChatsVisible] = useState(true);

  if (!isOpen) return null;

  // Dynamic Styles based on Theme
  const bgClass = isDarkMode ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200';
  const textClass = isDarkMode ? 'text-white' : 'text-black';
  const buttonHover = isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200';

  return (
    <div className={`flex flex-col w-64 h-full border-r overflow-hidden flex-shrink-0 transition-colors ${bgClass} ${textClass}`}>
      {/* Top Action */}
      <div className="p-3">
        <button 
          onClick={onNewChat}
          className={`flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg border transition-all group hover:scale-105 ${
             isDarkMode ? 'text-white bg-gray-800/50 hover:bg-gray-800 border-gray-700/50' : 'text-gray-800 bg-white hover:bg-gray-100 border-gray-200'
          }`}
        >
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
              <Icons.Bot className={`w-4 h-4 ${isDarkMode ? 'text-black' : 'text-white'}`} />
            </div>
            <span className="font-medium">New Chat</span>
          </div>
          <Icons.Plus className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4 space-y-1">
        
        {/* Core Section */}
        <SidebarItem 
          icon={Icons.LayoutGrid} 
          label="Library"
          active={currentView === ViewMode.Library}
          onClick={() => setView(ViewMode.Library)}
          isDarkMode={isDarkMode}
        />
        
        <SidebarItem 
          icon={Icons.Briefcase} 
          label="Marketplace" 
          badge="NEW" 
          active={currentView === ViewMode.Marketplace}
          onClick={() => setView(ViewMode.Marketplace)}
          isDarkMode={isDarkMode}
        />

        {/* Groups Section */}
        <SectionHeader title="Group Chats" />
        <SidebarItem 
          icon={Icons.Users} 
          label="New Group Chat" 
          active={currentView === ViewMode.GroupChat}
          onClick={onGroupChat}
          isDarkMode={isDarkMode}
        />
        
        <SidebarItem 
          icon={Icons.Search} 
          label="Search Chats"
          active={currentView === ViewMode.Search}
          onClick={() => setView(ViewMode.Search)}
          isDarkMode={isDarkMode}
        />

        {/* Your Chats Section (Collapsible) */}
        <div className="mt-6">
           <button 
             onClick={() => setIsChatsVisible(!isChatsVisible)}
             className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
           >
             <span>Your Chats</span>
             {/* Icon Logic: Down = Hidden, Up = Shown */}
             {isChatsVisible ? (
                <Icons.ChevronUp className="w-4 h-4" />
             ) : (
                <Icons.ChevronDown className="w-4 h-4" />
             )}
           </button>

           {isChatsVisible && (
             <div className="space-y-1 mt-1 animate-fade-in-up">
                {chatSessions.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-gray-600 italic">No saved chats yet.</div>
                ) : (
                  chatSessions.map((session) => (
                    <div 
                      key={session.id}
                      className={`group flex items-center w-full px-3 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer
                        ${currentSessionId === session.id && currentView === ViewMode.Chat 
                          ? (isDarkMode ? 'bg-[#1e3a8a] text-white' : 'bg-[#e0f2fe] text-black') + ' font-medium border-2 border-dashed border-blue-500 scale-110 z-10 shadow-md'
                          : (isDarkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-200 hover:text-black') + ' hover:scale-105 border-2 border-transparent'
                        }
                      `}
                      onClick={() => onLoadSession(session.id)}
                    >
                      <Icons.MessageSquare className={`w-4 h-4 mr-3 flex-shrink-0 opacity-70 ${currentSessionId === session.id ? 'text-blue-500' : ''}`} />
                      <span className="flex-1 text-left truncate">{session.title || 'New Chat'}</span>
                      
                      {/* Delete Button (Visible on Hover) */}
                      <button 
                        onClick={(e) => onDeleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                        title="Delete Chat"
                      >
                        <Icons.Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
             </div>
           )}
        </div>

      </div>

      {/* Profile Section (Bottom Sticky) */}
      <div className={`p-2 border-t ${isDarkMode ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'}`}>
        <button 
          onClick={() => setView(ViewMode.Settings)}
          className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${buttonHover} hover:scale-105`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white mr-3">
            DV
          </div>
          <div className="flex-1 text-left">
            <div className={`text-sm font-medium ${textClass}`}>Divyansh</div>
            <div className="text-xs text-brand-purple">Ultra v3.0 Pro</div>
          </div>
          <Icons.Settings className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;