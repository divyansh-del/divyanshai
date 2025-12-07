import '../../styles/chatgpt.css';
import React, { useState, useEffect } from 'react';
import Sidebar from './ChatSidebar/SidebarContainer';
import Header from './ChatHeader/HeaderContainer';
import InputContainer from './InputBar/InputContainer';
import VoiceOverlay from './VoiceMode/VoiceOverlay';
import SettingsPage from '../../pages/SettingsPage';

export default function ChatGPTLayout({ children }) {
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [route, setRoute] = useState(window.location.hash || '#/');

  useEffect(()=>{
    const onHash = ()=> setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', onHash);
    return ()=> window.removeEventListener('hashchange', onHash);
  },[]);

  const renderMain = () => {
    if(route === '#/settings') return <SettingsPage />;
    return children;
  };

  return (
    <div className="flex h-screen w-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <div className="flex-1 overflow-auto bg-neutral-50">
          {renderMain()}
        </div>
        <InputContainer onMic={()=>setVoiceOpen(true)} />
        {voiceOpen && <VoiceOverlay onClose={()=>setVoiceOpen(false)} />}
      </div>
    </div>
  );
}
