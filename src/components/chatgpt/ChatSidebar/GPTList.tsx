export default function GPTList(){
  const items = ['Writer GPT', 'Study Buddy'];
  return (
    <div className="mt-3">
      <h3 className="text-xs text-gray-500 uppercase px-2 mb-2">Your GPTs</h3>
      <ul className="space-y-1">
        {items.map(i=>(
          <li key={i} className="px-2 py-2 rounded-md hover:bg-neutral-100 cursor-pointer">{i}</li>
        ))}
      </ul>
    </div>
  );
}
