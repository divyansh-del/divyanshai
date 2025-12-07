import { useState } from 'react';

export default function SidebarSearch(){
  const [q, setQ] = useState('');
  return (
    <div className="mb-2">
      <input
        value={q}
        onChange={e=>setQ(e.target.value)}
        placeholder="Search chats or GPTs"
        className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring"
      />
    </div>
  );
}
