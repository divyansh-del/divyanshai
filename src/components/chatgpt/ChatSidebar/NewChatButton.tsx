export default function NewChatButton(){
  return (
    <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-black text-white hover:opacity-90">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      New chat
    </button>
  );
}
