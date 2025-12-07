
import React from 'react';
import * as Icons from './Icons';

export type SettingsTab = 
  | 'General' 
  | 'Brain' 
  | 'Memory' // New
  | 'Voice OS' 
  | 'Notifications'
  | 'Personalization' 
  | 'Apps' 
  | 'Data' 
  | 'Security' 
  | 'Parental'
  | 'Developer' 
  | 'Account';

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
  isDarkMode: boolean;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, setActiveTab, isDarkMode }) => {
  const tabs: { id: SettingsTab; icon: React.ElementType; label: string }[] = [
    { id: 'General', icon: Icons.Settings, label: 'General' },
    { id: 'Brain', icon: Icons.Cpu, label: 'Brain & Intelligence' },
    { id: 'Memory', icon: Icons.HardDrive, label: 'Memory' },
    { id: 'Voice OS', icon: Icons.Mic, label: 'Voice OS' },
    { id: 'Notifications', icon: Icons.Bell, label: 'Notifications' },
    { id: 'Personalization', icon: Icons.Sparkles, label: 'Personalization' },
    { id: 'Apps', icon: Icons.LayoutGrid, label: 'Apps & Connectors' },
    { id: 'Data', icon: Icons.Database, label: 'Data controls' },
    { id: 'Security', icon: Icons.Shield, label: 'Security' },
    { id: 'Parental', icon: Icons.Users, label: 'Parental controls' },
    { id: 'Developer', icon: Icons.Code, label: 'Developer (God Mode)' },
    { id: 'Account', icon: Icons.User, label: 'Account' },
  ];

  return (
    <div className={`w-full md:w-64 flex-shrink-0 border-r py-6 overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
      <div className="space-y-1 px-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 font-medium ${
              activeTab === tab.id
                ? (isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black')
                : (isDarkMode ? 'text-gray-400 hover:bg-gray-900 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-200 hover:text-black')
            }`}
          >
            <tab.icon className={`w-4 h-4 mr-3 flex-shrink-0 transition-colors ${
                activeTab === tab.id ? 'text-current' : 'text-gray-500 group-hover:text-gray-400'
            }`} />
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SettingsSidebar;