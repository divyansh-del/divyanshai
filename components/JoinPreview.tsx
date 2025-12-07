
import React, { useState } from 'react';
import * as Icons from './Icons';

interface JoinPreviewProps {
  onJoinClick: () => void;
}

const JoinPreview: React.FC<JoinPreviewProps> = ({ onJoinClick }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-950 text-white p-4 animate-fade-in">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-10 shadow-2xl flex flex-col items-center text-center">
        
        {/* Avatar Cluster */}
        <div className="flex -space-x-4 mb-6">
           <div className="w-16 h-16 rounded-full border-4 border-gray-900 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white z-10">
                DV
           </div>
           <div className="w-16 h-16 rounded-full border-4 border-gray-900 bg-gray-700 flex items-center justify-center z-0">
                <Icons.Users className="w-8 h-8 text-gray-400" />
           </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Divyansh invited you
        </h1>
        
        <p className="text-gray-400 mb-8">
          You've been invited to join a collaborative AI group chat on <span className="text-white font-medium">ChatBharat Ultra</span>.
        </p>

        <div className="w-full bg-gray-800/50 rounded-xl p-4 mb-8 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase font-bold">Group Info</span>
                <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
            </div>
            <div className="flex items-center text-sm text-gray-300">
                <Icons.Bot className="w-4 h-4 mr-2 text-brand-500" />
                <span>AI Agents: Enabled (Vortex, Arjun, Trinity)</span>
            </div>
        </div>

        <button 
          onClick={onJoinClick}
          className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3.5 rounded-full transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center"
        >
          Join Group Chat
        </button>
        
        <p className="mt-6 text-xs text-gray-600">
            By joining, you agree to the workspace terms and privacy policy.
        </p>
      </div>
    </div>
  );
};

export default JoinPreview;