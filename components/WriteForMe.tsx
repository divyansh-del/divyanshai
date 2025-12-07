
import React, { useState } from 'react';
import * as Icons from './Icons';
import { generateWriting } from '../services/geminiService';

interface WriteForMeProps {
    isDarkMode: boolean;
}

const WriteForMe: React.FC<WriteForMeProps> = ({ isDarkMode }) => {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Professional');
  const [format, setFormat] = useState('Article');
  const [length, setLength] = useState('Medium');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    setGeneratedContent('');
    
    const content = await generateWriting(topic, tone, format, length);
    
    setGeneratedContent(content);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Theme Constants
  const bgMain = isDarkMode ? 'bg-gray-950' : 'bg-gray-50';
  const bgPanel = isDarkMode ? 'bg-gray-950' : 'bg-white';
  const borderClass = isDarkMode ? 'border-gray-800' : 'border-gray-200';
  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSub = isDarkMode ? 'text-gray-500' : 'text-gray-500'; // Keep gray for subtext
  const inputBg = isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400';
  const buttonInactive = isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50';

  return (
    <div className={`flex flex-col md:flex-row h-full overflow-hidden animate-fade-in-up ${bgMain}`}>
      {/* Configuration Panel */}
      <div className={`w-full md:w-1/3 border-r p-6 flex flex-col overflow-y-auto ${bgPanel} ${borderClass}`}>
        <div className="mb-8 flex items-center">
            <div className="w-10 h-10 rounded-lg bg-brand-600/20 flex items-center justify-center mr-3">
                <Icons.PenTool className="w-6 h-6 text-brand-500" />
            </div>
            <div>
                <h2 className={`text-xl font-bold ${textMain}`}>Write For Me</h2>
                <p className={`text-xs ${textSub}`}>AI-Powered Content Generator</p>
            </div>
        </div>

        <div className="space-y-6 flex-1">
          <div className="space-y-2">
            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Topic or Prompt</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What would you like me to write about?"
              className={`w-full h-32 rounded-lg p-3 text-sm focus:border-brand-500 focus:outline-none resize-none transition-colors border ${inputBg}`}
            />
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tone</label>
            <div className="grid grid-cols-2 gap-2">
              {['Professional', 'Casual', 'Enthusiastic', 'Witty', 'Empathetic', 'Direct'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-2 text-xs rounded-md border transition-all ${
                    tone === t
                      ? 'bg-brand-600 border-brand-500 text-white'
                      : buttonInactive
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className={`w-full rounded-lg p-2.5 text-sm focus:border-brand-500 focus:outline-none border ${inputBg}`}
            >
              <option>Article</option>
              <option>Email</option>
              <option>Blog Post</option>
              <option>Essay</option>
              <option>Social Media Caption</option>
              <option>Product Description</option>
              <option>Cover Letter</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Length</label>
            <div className={`flex p-1 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
              {['Short', 'Medium', 'Long'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLength(l)}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    length === l
                      ? (isDarkMode ? 'bg-gray-700 text-white font-medium shadow' : 'bg-white text-black font-medium shadow')
                      : (isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-black')
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!topic.trim() || isGenerating}
          className={`w-full mt-6 py-3 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all ${
            !topic.trim() || isGenerating
              ? (isDarkMode ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
              : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg hover:shadow-brand-500/20'
          }`}
        >
          {isGenerating ? (
            <>
              <Icons.RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Icons.Sparkles className="w-4 h-4" />
              <span>Generate Draft</span>
            </>
          )}
        </button>
      </div>

      {/* Preview Panel */}
      <div className={`flex-1 p-6 md:p-8 flex flex-col overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Preview</h3>
            <div className="flex space-x-2">
                <button 
                    onClick={handleGenerate}
                    disabled={!generatedContent || isGenerating}
                    className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-black hover:bg-gray-200'}`}
                    title="Regenerate"
                >
                    <Icons.RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
                <button 
                    onClick={handleCopy}
                    disabled={!generatedContent}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'}`}
                >
                    {copied ? <Icons.Check className="w-3 h-3 text-green-400" /> : <Icons.Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
            </div>
        </div>
        
        <div className={`flex-1 rounded-xl border p-6 overflow-y-auto custom-scrollbar relative ${isDarkMode ? 'bg-gray-950 border-gray-800 text-gray-100' : 'bg-white border-gray-200 text-gray-800 shadow-sm'}`}>
            {generatedContent ? (
                <div className={`prose max-w-none prose-p:leading-relaxed ${isDarkMode ? 'prose-invert prose-headings:text-gray-100' : 'prose-headings:text-gray-900 prose-a:text-brand-600'}`}>
                    <div className="whitespace-pre-wrap">{generatedContent}</div>
                </div>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 opacity-40">
                    <Icons.Edit3 className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">Ready to write</p>
                    <p className="text-sm">Enter a topic and settings to start</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default WriteForMe;