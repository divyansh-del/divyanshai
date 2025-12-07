import React from 'react';

export default function MicButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Voice Mode"
      className="fixed right-6 bottom-6 z-40 w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:opacity-90"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 1v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 11a7 7 0 01-14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 21v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}
