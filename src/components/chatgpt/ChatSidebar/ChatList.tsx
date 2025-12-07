const SAMPLE = [
  { id: 'c1', title: 'Math homework', last: '2 messages ago' },
  { id: 'c2', title: 'Project plan', last: 'yesterday' },
  { id: 'c3', title: 'Ideas', last: 'Nov 28' },
];

export default function ChatList(){
  return (
    <div>
      <h3 className="text-xs text-gray-500 uppercase px-2 mb-2">Chats</h3>
      <ul className="space-y-1">
        {SAMPLE.map(c=>(
          <li key={c.id} className="px-2 py-2 rounded-md hover:bg-neutral-100 cursor-pointer flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{c.title}</div>
              <div className="text-xs text-gray-500">{c.last}</div>
            </div>
            <div className="text-xs text-gray-400">›</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
