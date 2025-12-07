
import React, { useState, useEffect } from 'react';
import * as Icons from './Icons';
import { GPT, LibraryItem, ChatSession } from '../types';
import { isAppConnected } from '../services/appsService';

interface ViewProps {
    isDarkMode: boolean;
}

// --- SEARCH CHATS VIEW ---
interface SearchChatsViewProps extends ViewProps {
  chatSessions: ChatSession[];
  onLoadSession: (id: string) => void;
}

export const SearchChatsView: React.FC<SearchChatsViewProps> = ({ chatSessions, onLoadSession, isDarkMode }) => {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Theme Classes
  const bgMain = isDarkMode ? 'bg-gray-950' : 'bg-white';
  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSub = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900';
  const cardBg = isDarkMode ? 'bg-gray-900/50 border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm';
  const tagBg = isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700';

  const filteredSessions = query 
    ? chatSessions.filter(s => 
        s.title.toLowerCase().includes(query.toLowerCase()) || 
        s.preview.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSearchSelect = (sessionId: string, title: string) => {
      if (!recentSearches.includes(title)) {
          setRecentSearches(prev => [title, ...prev].slice(0, 5));
      }
      onLoadSession(sessionId);
  };

  const formatDate = (timestamp: number) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - timestamp;
      
      if (diff < 24 * 60 * 60 * 1000) return 'Today';
      if (diff < 48 * 60 * 60 * 1000) return 'Yesterday';
      return date.toLocaleDateString();
  };

  return (
    <div className={`flex flex-col h-full p-6 md:p-12 animate-fade-in-up w-full max-w-4xl mx-auto overflow-y-auto custom-scrollbar ${bgMain}`}>
      <h1 className={`text-3xl font-bold mb-8 ${textMain}`}>Search Chats</h1>
      
      <div className="relative mb-8">
        <Icons.Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for messages, titles, or content..." 
          className={`w-full border rounded-xl py-3 pl-12 pr-4 focus:border-brand-500 focus:outline-none transition-colors ${inputBg}`}
          autoFocus
        />
      </div>

      {!query && recentSearches.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent Searches</h2>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map(s => (
              <button 
                key={s} 
                onClick={() => setQuery(s)} 
                className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center ${tagBg}`}
              >
                <Icons.Search className="w-3 h-3 mr-1.5 opacity-50" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
         {query && filteredSessions.length === 0 && (
             <div className={`text-center py-12 ${textSub}`}>
                 <Icons.Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                 No results found for "{query}"
             </div>
         )}
         
         {!query && chatSessions.length === 0 && (
             <div className={`text-center py-12 ${textSub}`}>
                 <p>No chat history available to search.</p>
             </div>
         )}

         {(query ? filteredSessions : chatSessions).map(session => (
           <div 
             key={session.id} 
             onClick={() => handleSearchSelect(session.id, session.title)}
             className={`p-4 border rounded-xl transition-all cursor-pointer group ${cardBg}`}
           >
              <div className="flex justify-between items-start mb-1">
                 <h3 className={`font-semibold group-hover:text-brand-purple transition-colors ${textMain}`}>{session.title || 'New Chat'}</h3>
                 <span className="text-xs text-gray-500">{formatDate(session.updatedAt)}</span>
              </div>
              <p className={`text-sm line-clamp-1 ${textSub}`}>{session.preview}</p>
           </div>
         ))}
      </div>
    </div>
  );
};

// --- LIBRARY VIEW ---
interface LibraryViewProps extends ViewProps {
  libraryItems?: LibraryItem[];
}

export const LibraryView: React.FC<LibraryViewProps> = ({ libraryItems = [], isDarkMode }) => {
  const categories = ['All', 'Images'];
  const [activeCat, setActiveCat] = useState('All');

  // Theme Classes
  const bgMain = isDarkMode ? 'bg-gray-950' : 'bg-white';
  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const borderClass = isDarkMode ? 'border-gray-800' : 'border-gray-200';
  const cardBg = isDarkMode ? 'bg-gray-900 border-gray-800 hover:border-brand-500/50' : 'bg-gray-50 border-gray-200 hover:border-brand-500/30';

  const displayItems = libraryItems.filter(item => {
      if (activeCat === 'All') return true;
      if (activeCat === 'Images') return item.type === 'image';
      return true;
  });

  return (
    <div className={`flex flex-col h-full p-6 md:p-8 animate-fade-in-up overflow-y-auto custom-scrollbar ${bgMain}`}>
      <div className="flex items-center justify-between mb-8">
         <h1 className={`text-2xl font-bold flex items-center ${textMain}`}>
            <Icons.LayoutGrid className="w-6 h-6 mr-3 text-brand-purple" />
            Library
         </h1>
      </div>

      <div className={`flex space-x-1 border-b mb-6 overflow-x-auto ${borderClass}`}>
        {categories.map(cat => (
           <button 
             key={cat}
             onClick={() => setActiveCat(cat)}
             className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                 activeCat === cat ? `border-brand-500 ${textMain}` : 'border-transparent text-gray-500 hover:text-gray-300'
             }`}
           >
             {cat}
           </button>
        ))}
      </div>

      {displayItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayItems.map((item) => (
                <div key={item.id} className={`aspect-square border rounded-xl overflow-hidden relative group transition-all cursor-pointer ${cardBg}`}>
                    {item.type === 'image' ? (
                        <img src={item.content} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="p-4 flex flex-col h-full justify-between">
                            <Icons.MessageSquare className="w-8 h-8 text-gray-500" />
                            <div className="text-xs text-gray-400 line-clamp-3">{item.content}</div>
                        </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                         <div className="text-sm font-bold text-white truncate">{item.title}</div>
                         <div className="text-[10px] text-gray-400">{new Date(item.date).toLocaleDateString()}</div>
                    </div>
                </div>
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
             <Icons.ImageIcon className="w-16 h-16 mb-4 opacity-20" />
             <p>No items in your library yet.</p>
             <p className="text-sm mt-2">Generated images will appear here automatically.</p>
        </div>
      )}
    </div>
  );
};

// --- MARKETPLACE VIEW ---
interface MarketplaceViewProps extends ViewProps {
  onSelectGPT: (gpt: GPT) => void;
  onCreateGPT: (gpt: GPT) => void;
  userGPTs: GPT[];
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({ onSelectGPT, onCreateGPT, userGPTs, isDarkMode }) => {
    const [isCreating, setIsCreating] = useState(false);
    
    // Form State
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newInstruction, setNewInstruction] = useState('');
    const [newCategory, setNewCategory] = useState('Productivity');
    const [newIcon, setNewIcon] = useState('Bot');
    
    // Filter & Sort State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('Popularity');

    const categories = ['All', 'Productivity', 'Design', 'Coding', 'Education', 'Business'];

    // Theme Classes
    const bgMain = isDarkMode ? 'bg-gray-950' : 'bg-white';
    const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
    const textSub = isDarkMode ? 'text-gray-400' : 'text-gray-500';
    const borderClass = isDarkMode ? 'border-gray-800' : 'border-gray-200';
    const inputBg = isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900 shadow-sm';
    const heroBg = isDarkMode ? 'bg-gradient-to-r from-brand-900/20 to-purple-900/20' : 'bg-gradient-to-r from-brand-50 to-purple-50';

    useEffect(() => {
        const savedName = localStorage.getItem('gpt_draft_name');
        const savedDesc = localStorage.getItem('gpt_draft_desc');
        const savedInst = localStorage.getItem('gpt_draft_inst');
        const savedCat = localStorage.getItem('gpt_draft_cat');
        const savedIcon = localStorage.getItem('gpt_draft_icon');

        if (savedName) setNewName(savedName);
        if (savedDesc) setNewDesc(savedDesc);
        if (savedInst) setNewInstruction(savedInst);
        if (savedCat) setNewCategory(savedCat);
        if (savedIcon) setNewIcon(savedIcon);
    }, []);

    useEffect(() => {
        if (isCreating) {
            localStorage.setItem('gpt_draft_name', newName);
            localStorage.setItem('gpt_draft_desc', newDesc);
            localStorage.setItem('gpt_draft_inst', newInstruction);
            localStorage.setItem('gpt_draft_cat', newCategory);
            localStorage.setItem('gpt_draft_icon', newIcon);
        }
    }, [newName, newDesc, newInstruction, newCategory, newIcon, isCreating]);

    const defaultGPTs: GPT[] = [
        { 
            id: 'devmaster', 
            name: 'DevMaster', 
            description: 'Full Stack Coding Expert. Architect systems, fix bugs, and write clean code in any language.', 
            author: 'ChatBharat',
            systemInstruction: 'You are DevMaster, an elite Senior Software Engineer. You write clean, production-ready code. You can architect entire systems, debug complex issues, and explain technical concepts simply.',
            icon: 'Code',
            category: 'Coding',
            createdAt: 1701000000000
        },
        { 
            id: 'studybuddy', 
            name: 'StudyBuddy', 
            description: 'Your personal tutor for 11th/12th Boards & Exams. Creates study plans and explains concepts.', 
            author: 'ChatBharat',
            systemInstruction: 'You are StudyBuddy, a friendly and motivating tutor for Indian students. You specialize in 11th and 12th-grade syllabus, Boards preparation, and competitive exams. You create realistic study timetables.',
            icon: 'Briefcase',
            category: 'Education',
            createdAt: 1700500000000
        },
        { 
            id: 'bizguru', 
            name: 'BizGuru', 
            description: 'Business & Earning Expert. Ideas for Farming, Freelancing, and Online Income.', 
            author: 'ChatBharat',
            systemInstruction: 'You are BizGuru. You provide practical business advice. You specialize in: 1. Online Earning (Freelancing, Digital Skills). 2. Agri-Business (Farming profit strategies). 3. Small Business Ideas with low investment.',
            icon: 'LineChart',
            category: 'Business',
            createdAt: 1701500000000
        },
        { 
            id: 'techfixer', 
            name: 'TechFixer', 
            description: 'Resolve app crashes, server issues, and deployment problems instantly.', 
            author: 'ChatBharat',
            systemInstruction: 'You are TechFixer, a technical support wizard. You solve software crashes, deployment errors (Vercel, Firebase), and server issues. You give step-by-step solutions.',
            icon: 'Zap',
            category: 'Coding',
            createdAt: 1702000000000
        },
        { 
            id: 'canva', 
            name: 'Canva GPT', 
            description: 'Effortlessly design anything: presentations, logos, social posts. Expert in visual design principles.', 
            author: 'canva.com',
            systemInstruction: 'You are Canva GPT. You are a world-class expert in graphic design...',
            icon: 'PenTool',
            category: 'Design',
            createdAt: 1700000000000
        }
    ];

    const allGPTs = [...defaultGPTs, ...userGPTs];

    const filteredGPTs = allGPTs.filter(gpt => {
        const matchesSearch = gpt.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              gpt.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || gpt.category === selectedCategory || (selectedCategory === 'Other' && !gpt.category);
        return matchesSearch && matchesCategory;
    });

    const sortedGPTs = [...filteredGPTs].sort((a, b) => {
        if (sortBy === 'Date Created') {
            return (b.createdAt || 0) - (a.createdAt || 0);
        }
        if (sortBy === 'Alphabetical') {
            return a.name.localeCompare(b.name);
        }
        return 0;
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const newGPT: GPT = {
            id: Date.now().toString(),
            name: newName,
            description: newDesc,
            author: 'You',
            systemInstruction: newInstruction,
            icon: newIcon,
            category: newCategory,
            createdAt: Date.now()
        };
        onCreateGPT(newGPT);
        setIsCreating(false);
        setNewName('');
        setNewDesc('');
        setNewInstruction('');
        localStorage.removeItem('gpt_draft_name');
        localStorage.removeItem('gpt_draft_desc');
        localStorage.removeItem('gpt_draft_inst');
        localStorage.removeItem('gpt_draft_cat');
        localStorage.removeItem('gpt_draft_icon');
    };

    const iconOptions = ['Bot', 'Code', 'PenTool', 'FileText', 'Globe', 'Zap', 'Shield', 'Sparkles', 'Briefcase', 'MessageSquare'];

    if (isCreating) {
        return (
             <div className={`flex flex-col h-full p-6 md:p-12 animate-fade-in-up w-full max-w-3xl mx-auto overflow-y-auto custom-scrollbar ${bgMain}`}>
                 <button onClick={() => setIsCreating(false)} className={`mb-6 flex items-center ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                     <Icons.ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Back to Store
                 </button>
                 <h1 className={`text-3xl font-bold mb-2 ${textMain}`}>Create New GPT</h1>
                 <p className={`mb-8 ${textSub}`}>Configure your custom AI agent with specific instructions and knowledge.</p>
                 
                 <form onSubmit={handleCreate} className="space-y-6">
                     <div className="flex gap-6">
                         <div className="flex-1 space-y-4">
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
                                <input 
                                    required
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className={`w-full rounded-lg p-3 focus:border-brand-500 outline-none border ${inputBg}`} 
                                    placeholder="e.g. Math Tutor"
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
                                <select 
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                    className={`w-full rounded-lg p-3 focus:border-brand-500 outline-none border ${inputBg}`} 
                                >
                                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                         </div>
                         <div className="w-1/3">
                              <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Icon</label>
                              <div className="grid grid-cols-4 gap-2">
                                  {iconOptions.map(icon => (
                                      <div 
                                        key={icon}
                                        onClick={() => setNewIcon(icon)}
                                        className={`aspect-square rounded-lg flex items-center justify-center cursor-pointer border transition-all ${
                                            newIcon === icon 
                                            ? 'bg-brand-600 border-brand-500 text-white' 
                                            : (isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100')
                                        }`}
                                      >
                                          {React.createElement(Icons[icon as keyof typeof Icons] as React.ElementType, { className: "w-5 h-5" })}
                                      </div>
                                  ))}
                              </div>
                         </div>
                     </div>
                     
                     <div>
                         <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                         <input 
                            required
                            value={newDesc}
                            onChange={e => setNewDesc(e.target.value)}
                            className={`w-full rounded-lg p-3 focus:border-brand-500 outline-none border ${inputBg}`} 
                            placeholder="Briefly describe what this GPT does"
                         />
                     </div>
                     <div>
                         <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Instructions (System Prompt)</label>
                         <textarea 
                            required
                            value={newInstruction}
                            onChange={e => setNewInstruction(e.target.value)}
                            className={`w-full h-40 rounded-lg p-3 focus:border-brand-500 outline-none border ${inputBg}`} 
                            placeholder="How should this GPT behave? What should it know?"
                         />
                     </div>
                     <button type="submit" className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-full transition-colors shadow-lg">
                         Create GPT
                     </button>
                 </form>
             </div>
        );
    }

    const showGrid = searchQuery || selectedCategory !== 'All' || sortBy !== 'Popularity';

    return (
        <div className={`flex flex-col h-full overflow-y-auto custom-scrollbar animate-fade-in-up ${bgMain}`}>
            {/* Hero Section */}
            <div className={`border-b p-8 md:p-12 text-center ${heroBg} ${borderClass}`}>
                <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${textMain}`}>ChatBharat GPT Store</h1>
                <p className={`max-w-xl mx-auto mb-8 ${textSub}`}>Discover and build custom versions of ChatBharat that combine instructions, extra knowledge, and any combination of skills.</p>
                
                <div className="max-w-2xl mx-auto relative mb-6">
                    <Icons.Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search public GPTs..." 
                      className={`w-full rounded-full py-3 pl-12 pr-4 focus:border-brand-500 focus:outline-none shadow-lg border ${inputBg}`}
                    />
                </div>

                {!searchQuery && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className={`inline-flex items-center justify-center mx-auto space-x-2 px-6 py-3 rounded-full font-bold shadow-lg transition-transform hover:scale-105 ${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
                    >
                        <Icons.Plus className="w-5 h-5" />
                        <span>Create your own GPT</span>
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 space-y-8">
                
                {/* Filters & Sort */}
                <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 ${borderClass}`}>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Filter by:</span>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors ${inputBg}`}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Sort by:</span>
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors ${inputBg}`}
                        >
                            <option>Popularity</option>
                            <option>Date Created</option>
                            <option>Alphabetical</option>
                        </select>
                    </div>
                </div>

                {/* GPT Listings */}
                {showGrid ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedGPTs.map((gpt) => (
                             <GPTCard key={gpt.id} gpt={gpt} onSelect={onSelectGPT} isDarkMode={isDarkMode} />
                        ))}
                        {sortedGPTs.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No GPTs found matching your criteria.
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {userGPTs.length > 0 && (
                            <section>
                                <h2 className={`text-xl font-bold mb-4 flex items-center ${textMain}`}><Icons.User className="w-5 h-5 mr-2 text-blue-400" /> Created by You</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {userGPTs.map((gpt) => (
                                         <GPTCard key={gpt.id} gpt={gpt} onSelect={onSelectGPT} highlight isDarkMode={isDarkMode} />
                                    ))}
                                </div>
                            </section>
                        )}

                        <section>
                            <h2 className={`text-xl font-bold mb-4 flex items-center ${textMain}`}><Icons.Sparkles className="w-5 h-5 mr-2 text-yellow-500" /> Featured GPTs</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {defaultGPTs.slice(0, 3).map((gpt, i) => (
                                    <GPTCard key={gpt.id} gpt={gpt} onSelect={onSelectGPT} featuredIndex={i} isDarkMode={isDarkMode} />
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className={`text-xl font-bold mb-4 flex items-center ${textMain}`}><Icons.PenTool className="w-5 h-5 mr-2 text-pink-500" /> Specialists</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {defaultGPTs.slice(3).map((gpt) => (
                                    <GPTCard key={gpt.id} gpt={gpt} onSelect={onSelectGPT} isDarkMode={isDarkMode} />
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
};

const GPTCard: React.FC<{ gpt: GPT; onSelect: (gpt: GPT) => void; highlight?: boolean; featuredIndex?: number; isDarkMode: boolean }> = ({ gpt, onSelect, highlight, featuredIndex, isDarkMode }) => {
    // Theme Classes
    const cardBg = isDarkMode ? 'bg-gray-900/50 border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm hover:shadow-md';
    const textMain = isDarkMode ? 'text-gray-200' : 'text-gray-900';
    const textSub = isDarkMode ? 'text-gray-400' : 'text-gray-500';

    // Check if connected
    const connected = isAppConnected(gpt.id);

    return (
        <div 
            onClick={() => onSelect(gpt)} 
            className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all relative group ${cardBg}
                ${highlight ? 'border-l-4 border-l-brand-500' : ''}
            `}
        >
            <div className={`w-12 h-12 rounded-full flex-shrink-0 mr-4 flex items-center justify-center text-xl font-bold text-white transition-transform group-hover:scale-105
                ${featuredIndex === 0 ? 'bg-gradient-to-br from-blue-400 to-purple-600' : 
                  featuredIndex === 1 ? 'bg-gradient-to-br from-orange-400 to-red-600' :
                  featuredIndex === 2 ? 'bg-gradient-to-br from-green-400 to-teal-600' : (isDarkMode ? 'bg-gray-700' : 'bg-black')}
            `}>
                {gpt.icon && Icons[gpt.icon as keyof typeof Icons] ? React.createElement(Icons[gpt.icon as keyof typeof Icons] as React.ElementType, {className: "w-6 h-6"}) : gpt.name[0]}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h3 className={`font-bold truncate ${textMain}`}>{gpt.name}</h3>
                    {connected && (
                        <span className="bg-green-500/10 text-green-500 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border border-green-500/20">
                            Linked
                        </span>
                    )}
                </div>
                <p className={`text-xs line-clamp-2 mb-2 ${textSub}`}>{gpt.description}</p>
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-gray-500">By {gpt.author}</span>
                    {gpt.category && <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>{gpt.category}</span>}
                </div>
            </div>

            {/* Tooltip on Hover */}
            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-black border border-gray-700 rounded-lg shadow-2xl pointer-events-none z-50">
                <h4 className="font-bold text-xs text-white mb-1">{gpt.name}</h4>
                <p className="text-[11px] text-gray-300 leading-snug">{gpt.description}</p>
                <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-black border-r border-b border-gray-700 transform rotate-45"></div>
            </div>
        </div>
    );
};