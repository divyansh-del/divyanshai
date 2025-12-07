import React from 'react';
import MicButton from '../VoiceMode/MicButton';

export default function InputContainer({ onMic }) {
  return (
    <div className="h-16 border-t bg-white flex items-center px-4 gap-3">
      <input className="flex-1 px-3 py-2 border rounded-md focus:outline-none" placeholder="Type a message..." />
      <button className="px-4 py-2 rounded-md bg-black text-white">Send</button>
      <MicButton onClick={onMic} />
    </div>
  );
}
