import React, { useState } from 'react';

export default function HeaderContainer(){
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState('GPT-4o');

  return (
    <div className="h-14 border-b flex items-center px-4 bg-white">
      <div className="flex items-center gap-3">
        <button className="text-sm font-semibold">←</button>
        <div className="text-lg font-semibold">Conversation</div>
        <div className="ml-3 badge text-sm">Model: {model}</div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="dropdown smooth" onMouseLeave={()=>setOpen(false)}>
          <button onClick={()=>setOpen(s=>!s)} className="px-3 py-2 rounded-md border smooth-hover">Model: {model} ▾</button>
          <div className={open? 'dropdown-menu open' : 'dropdown-menu'}>
            <div className="py-1">
              <div onClick={()=>setModel('GPT-4o')} className="px-3 py-2 cursor-pointer rounded-md hover:bg-neutral-100">GPT-4o</div>
              <div onClick={()=>setModel('Gemini Pro')} className="px-3 py-2 cursor-pointer rounded-md hover:bg-neutral-100">Gemini Pro</div>
              <div onClick={()=>setModel('Custom')} className="px-3 py-2 cursor-pointer rounded-md hover:bg-neutral-100">Custom</div>
            </div>
          </div>
        </div>

        <div className="dropdown" style={{position:'relative'}} onMouseLeave={()=>setOpen(false)}>
          <button onClick={()=>setOpen(s=>!s)} className="flex items-center gap-2 px-2 py-1 rounded-md smooth-hover">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">A</div>
            <div className="text-sm">Divyansh</div>
          </button>
          <div className={open? 'dropdown-menu open' : 'dropdown-menu'} style={{right:0}}>
            <div className="py-1">
              <div className="px-3 py-2 cursor-pointer rounded-md hover:bg-neutral-100">Profile</div>
              <div className="px-3 py-2 cursor-pointer rounded-md hover:bg-neutral-100">Settings</div>
              <div className="px-3 py-2 cursor-pointer rounded-md hover:bg-neutral-100">Sign out</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
