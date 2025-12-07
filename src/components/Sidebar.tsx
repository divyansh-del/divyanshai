
import React, { useState, useEffect } from 'react';
import { ViewMode, SidebarItemProps, ChatSession, getColorVariants } from '../types';
import * as Icons from './Icons';
import { useSettings } from '../services/SettingsContext';

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

const SidebarItem: React.FC<SidebarItemProps & { isDarkMode: boolean, accentColor: string }> = ({ icon: Icon, label, onClick, active, isSubItem, badge, isDarkMode, accentColor }) => {
  const colors = getColorVariants(accentColor);
  
  return (
    <button
      onClick={onClick}
      className={`group flex items-center w-full px-3 py-2.5 text-sm rounded-xl transition-all duration-200 
        ${active 
          ? (isDarkMode ? `bg-gray-800 text-white shadow-lg shadow-black/20 ring-1 ring-white/10` : `bg-gray-100 text-black shadow-sm ring-1 ring-black/5`) + ' font-medium'
          : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/50 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black') + ' hover:translate-x-1'}
        ${isSubItem ? 'pl-9' : ''}
      `}
    >
      <Icon className={`w-4 h-4 mr-3 flex-shrink-0 transition-colors ${active ? colors.text : 'text-gray-500 group-hover:text-gray-400'}`} />
      <span className="flex-1 text-left truncate">{label}</span>
      {badge && (
        <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shadow-sm ${colors.bg}`}>
          {badge}
        </span>
      )}
    </button>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="px-4 py-2 mt-4 mb-1 text-xs font-bold text-gray-500 uppercase tracking-wider opacity-80">
    {title}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  isOpen, 
  toggleOpen,
  onNewChat, 
  onGroupChat,
  chatSessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  isDarkMode
}) => {
  const { settings } = useSettings();
  const accentColor = settings.general?.accentColor || 'Blue';
  const colors = getColorVariants(accentColor);
  const [isChatsVisible, setIsChatsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dynamic Styles based on Theme
  const bgClass = isDarkMode ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200';
  const textClass = isDarkMode ? 'text-white' : 'text-black';
  const buttonHover = isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200';

  const sidebarContent = (
    <div className={`flex flex-col h-full overflow-hidden transition-colors ${bgClass} ${textClass}`}>
      {/* Top Action */}
      <div className="p-4 mb-2">
        <button 
          onClick={onNewChat}
          className={`flex items-center justify-between w-full px-4 py-3 text-sm rounded-xl border transition-all duration-300 group hover:shadow-lg active:scale-95 ${
             isDarkMode ? 'text-white bg-gray-900 border-gray-800 hover:bg-gray-800' : 'text-gray-800 bg-white border-gray-200 hover:bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-3 shadow-md transition-transform group-hover:rotate-12 ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
              <Icons.Bot className="w-4 h-4" />
            </div>
            <span className="font-semibold">New Chat</span>
          </div>
          <Icons.Plus className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4 space-y-1">
        
        {/* Core Section */}
        <SidebarItem 
          icon={Icons.LayoutGrid} 
          label="Library"
          active={currentView === ViewMode.Library}
          onClick={() => setView(ViewMode.Library)}
          isDarkMode={isDarkMode}
          accentColor={accentColor}
        />
        
        <SidebarItem 
          icon={Icons.Briefcase} 
          label="Marketplace" 
          badge="NEW" 
          active={currentView === ViewMode.Marketplace}
          onClick={() => setView(ViewMode.Marketplace)}
          isDarkMode={isDarkMode}
          accentColor={accentColor}
        />

        {/* Groups Section */}
        <SectionHeader title="Group Chats" />
        <SidebarItem 
          icon={Icons.Users} 
          label="New Group Chat" 
          active={currentView === ViewMode.GroupChat}
          onClick={onGroupChat}
          isDarkMode={isDarkMode}
          accentColor={accentColor}
        />
        
        <SidebarItem 
          icon={Icons.Search} 
          label="Search Chats"
          active={currentView === ViewMode.Search}
          onClick={() => setView(ViewMode.Search)}
          isDarkMode={isDarkMode}
          accentColor={accentColor}
        />

        {/* Your Chats Section (Collapsible) */}
        <div className="mt-6">
           <button 
             onClick={() => setIsChatsVisible(!isChatsVisible)}
             className="flex items-center justify-between w-full px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
           >
             <span>History</span>
             {isChatsVisible ? <Icons.ChevronUp className="w-3 h-3" /> : <Icons.ChevronDown className="w-3 h-3" />}
           </button>

           {isChatsVisible && (
             <div className="space-y-1 mt-2 animate-fade-in-up">
                {chatSessions.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-gray-500 italic text-center">No recent chats</div>
                ) : (
                  chatSessions.map((session) => (
                    <div 
                      key={session.id}
                      className={`group flex items-center w-full px-3 py-2.5 text-sm rounded-xl transition-all duration-200 cursor-pointer relative
                        ${currentSessionId === session.id && currentView === ViewMode.Chat 
                          ? (isDarkMode ? `bg-gray-800 text-white` : `bg-gray-100 text-black`) + ' font-medium'
                          : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/50 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black')
                        }
                      `}
                      onClick={() => onLoadSession(session.id)}
                    >
                      <Icons.MessageSquare className={`w-4 h-4 mr-3 flex-shrink-0 transition-colors ${currentSessionId === session.id ? colors.text : 'text-gray-500 group-hover:text-gray-400'}`} />
                      <span className="flex-1 text-left truncate pr-6">{session.title || 'New Chat'}</span>
                      
                      {/* Delete Button (Visible on Hover) */}
                      <button 
                        onClick={(e) => onDeleteSession(session.id, e)}
                        className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-500 rounded-md transition-all text-gray-500"
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
      <div className={`p-3 border-t mt-auto ${isDarkMode ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'}`}>
        <button 
          onClick={() => setView(ViewMode.Settings)}
          className={`flex items-center w-full px-3 py-2.5 rounded-xl transition-colors ${buttonHover} group`}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white mr-3 shadow-sm group-hover:shadow-md transition-shadow">
            {settings.account?.name ? settings.account.name.substring(0, 2).toUpperCase() : 'DV'}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className={`text-sm font-bold truncate ${textClass}`}>{settings.account?.name || 'Divyansh'}</div>
            <div className={`text-[10px] ${colors.text} font-medium`}>Ultra Pro</div>
          </div>
          <Icons.Settings className="w-4 h-4 text-gray-400 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );

  // Mobile Drawer Wrapper
  if (isMobile) {
      return (
          <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={toggleOpen}
            />
            {/* Sidebar */}
            <div 
                className={`fixed top-0 left-0 h-full w-72 z-50 transform transition-transform duration-300 ease-out shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {sidebarContent}
            </div>
          </>
      );
  }

  // Desktop Sidebar
  return isOpen ? (
      <div className={`flex flex-col w-72 h-full border-r overflow-hidden flex-shrink-0 relative ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          {sidebarContent}
      </div>
  ) : null;
};

export default Sidebar;
