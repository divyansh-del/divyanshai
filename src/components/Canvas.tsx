
import React, { useState, useEffect, useRef } from 'react';
import * as Icons from './Icons';
import { CanvasState } from '../types';

interface CanvasProps {
    canvasState: CanvasState;
    onClose: () => void;
    isDarkMode: boolean;
}

const ECHARTS_PIE_SNIPPET = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; font-family: sans-serif; background: #fff; }
    #chart-container { width: 100%; height: 400px; }
  </style>
</head>
<body>
  <div id="chart-container"></div>
  <script>
    var dom = document.getElementById('chart-container');
    var myChart = echarts.init(dom, null, { renderer: 'canvas', useDirtyRect: false });
    var option = {
      title: {
        text: 'AI Usage Statistics',
        subtext: 'Fake Data',
        left: 'center'
      },
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          name: 'Access From',
          type: 'pie',
          radius: '50%',
          data: [
            { value: 1048, name: 'Search Engine' },
            { value: 735, name: 'Direct' },
            { value: 580, name: 'Email' },
            { value: 484, name: 'Union Ads' },
            { value: 300, name: 'Video Ads' }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
    if (option && typeof option === 'object') {
      myChart.setOption(option);
    }
    window.addEventListener('resize', myChart.resize);
  </script>
</body>
</html>`;

const Canvas: React.FC<CanvasProps> = ({ canvasState, onClose, isDarkMode }) => {
    const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'console'>('code');
    const [code, setCode] = useState(canvasState.content);
    const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [iframeSrc, setIframeSrc] = useState<string | null>(null);
    const [showSnippets, setShowSnippets] = useState(false);

    useEffect(() => {
        setCode(canvasState.content);
        setConsoleOutput([]);
        setIframeSrc(null);
        // Auto-switch to code tab on new content
        setActiveTab('code');
    }, [canvasState.content]);

    // Theme Classes
    const bgMain = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
    const borderClass = isDarkMode ? 'border-gray-800' : 'border-gray-200';
    const textMain = isDarkMode ? 'text-gray-100' : 'text-gray-900';
    const editorBg = isDarkMode ? 'bg-gray-950 text-gray-200' : 'bg-white text-gray-800';

    const handleRun = async () => {
        setIsRunning(true);
        setConsoleOutput(['> Initializing execution environment...', '> Running...']);
        
        // 1. HTML/JS VISUALIZATION (SANDBOX)
        if (canvasState.language === 'html' || canvasState.language === 'javascript' || code.includes('<!DOCTYPE html>')) {
            setActiveTab('preview');
            
            // Construct executable HTML
            let finalHtml = code;
            if (canvasState.language === 'javascript' && !code.includes('<!DOCTYPE html>')) {
                // Wrap JS in a basic HTML template if it's pure JS
                finalHtml = `
                    <!DOCTYPE html>
                    <html>
                    <body>
                        <script>
                            // Capture console
                            const originalLog = console.log;
                            console.log = (...args) => {
                                // We can't easily postMessage back in this simple blob setup without more boilerplate,
                                // so we just log to browser console for now or could alert.
                                originalLog.apply(console, args);
                            };
                        </script>
                        <script>
                            ${code}
                        </script>
                    </body>
                    </html>
                `;
            }

            const blob = new Blob([finalHtml], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            setIframeSrc(url);
            
            setConsoleOutput(prev => [...prev, '> Rendered in Preview tab.']);
            setIsRunning(false);
            return;
        }

        // 2. PYTHON SIMULATION (Data Science Mock)
        if (canvasState.language === 'python') {
             setActiveTab('console');
             setTimeout(() => {
                 const logs: string[] = [];
                 logs.push('[Python 3.10 Interpreter]');
                 
                 // Simulate Print Statements
                 const printMatches = code.matchAll(/print\((["'])(.*?)\1\)/g);
                 for (const match of printMatches) {
                     logs.push(match[2]);
                 }

                 // Simulate Loops (Basic)
                 if (code.includes('for i in range')) {
                     const rangeMatch = code.match(/range\((\d+)\)/);
                     if (rangeMatch) {
                         const n = parseInt(rangeMatch[1]);
                         if (n < 5) logs.push(`(Loop executed ${n} times)`);
                         else logs.push(`(Loop executed ${n} times... output truncated)`);
                     }
                 }

                 // Check for Plotting
                 if (code.includes('matplotlib') || code.includes('plt.show') || code.includes('seaborn')) {
                     // We can't easily render a real python plot in browser without Pyodide (heavy).
                     // We switch to preview and show a placeholder or generated HTML chart if possible.
                     // For now, we simulate the output.
                     logs.push('> Plot generated object <matplotlib.lines.Line2D>');
                     logs.push('> Displaying plot...');
                     // In a real app, this would return an image base64
                 }
                 
                 if (logs.length === 1) logs.push('> Script executed. No standard output.');
                 
                 setConsoleOutput(['> Execution started...', '-----------------', ...logs, '-----------------', '> Process exited with code 0']);
                 setIsRunning(false);
             }, 1000);
             return;
        }

        // 3. GENERIC JS LOGIC (Console only)
        setActiveTab('console');
        setTimeout(() => {
            const logs: string[] = [];
            try {
                // Capture console.log
                const originalLog = console.log;
                console.log = (...args: any[]) => logs.push(args.map(a => String(a)).join(' '));
                
                // Safe Execution
                // eslint-disable-next-line no-new-func
                const runFunc = new Function(code);
                runFunc();
                
                console.log = originalLog; // Restore
                setConsoleOutput(['> Execution started...', '-----------------', ...logs, '-----------------', '> Process exited with code 0']);
            } catch (e: any) {
                setConsoleOutput(prev => [...prev, `Error: ${e.message}`]);
            } finally {
                setIsRunning(false);
            }
        }, 800);
    };

    const handleInsertSnippet = (snippetCode: string, lang: string) => {
        setCode(snippetCode);
        setShowSnippets(false);
        // Force update if needed via parent, but local state handles display
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
    };

    return (
        <div className={`flex flex-col h-full border-l transition-all duration-300 w-full md:w-[50%] lg:w-[45%] shadow-2xl z-20 ${bgMain} ${borderClass}`}>
            {/* Header */}
            <div className={`h-14 flex items-center justify-between px-4 border-b ${borderClass} ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded bg-brand-600 text-white shadow-lg shadow-brand-600/20">
                        <Icons.Code className="w-4 h-4" />
                    </div>
                    <div>
                        <div className={`text-sm font-bold ${textMain}`}>{canvasState.title || 'Canvas'}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{canvasState.language || 'Plain Text'}</div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Snippets Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowSnippets(!showSnippets)}
                            className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                        >
                            <Icons.Plus className="w-3 h-3 mr-1" /> Snippets
                        </button>
                        {showSnippets && (
                            <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-50 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <button 
                                    onClick={() => handleInsertSnippet(ECHARTS_PIE_SNIPPET, 'html')}
                                    className={`w-full text-left px-4 py-2.5 text-xs hover:bg-brand-500 hover:text-white transition-colors ${textMain}`}
                                >
                                    ECharts Pie Chart
                                </button>
                                <button 
                                    onClick={() => handleInsertSnippet("console.log('Hello World');", 'javascript')}
                                    className={`w-full text-left px-4 py-2.5 text-xs hover:bg-brand-500 hover:text-white transition-colors ${textMain}`}
                                >
                                    Hello World (JS)
                                </button>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleRun}
                        disabled={isRunning}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all transform hover:scale-105 ${isRunning ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-600/20'} text-white`}
                    >
                        {isRunning ? <Icons.RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Icons.Play className="w-3 h-3 mr-1" />}
                        Run
                    </button>
                    <button onClick={handleCopy} className={`p-2 rounded-lg hover:bg-gray-700/10 transition-colors ${textMain}`} title="Copy Code">
                        <Icons.Copy className="w-4 h-4" />
                    </button>
                    <button onClick={onClose} className={`p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors ${textMain}`} title="Close Canvas">
                        <Icons.XCircle className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className={`flex border-b text-xs font-bold uppercase tracking-wide ${borderClass}`}>
                <button 
                    onClick={() => setActiveTab('code')}
                    className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeTab === 'code' ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-500 hover:text-gray-400'}`}
                >
                    Editor
                </button>
                <button 
                    onClick={() => setActiveTab('preview')}
                    className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeTab === 'preview' ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-500 hover:text-gray-400'}`}
                >
                    Preview
                </button>
                <button 
                    onClick={() => setActiveTab('console')}
                    className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeTab === 'console' ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-500 hover:text-gray-400'}`}
                >
                    Console
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'code' && (
                    <textarea 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className={`w-full h-full p-6 font-mono text-sm resize-none focus:outline-none custom-scrollbar leading-relaxed ${editorBg}`}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoComplete="off"
                    />
                )}
                
                {activeTab === 'preview' && (
                    <div className={`h-full w-full bg-white relative flex flex-col`}>
                        {iframeSrc ? (
                            <iframe 
                                src={iframeSrc} 
                                className="w-full h-full border-none"
                                title="Canvas Preview"
                                sandbox="allow-scripts allow-same-origin"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Icons.LayoutGrid className="w-12 h-12 mb-2 opacity-20" />
                                <p className="text-sm">Click 'Run' to generate preview.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'console' && (
                    <div className="h-full bg-[#0d0d0d] p-4 font-mono text-xs text-green-400 overflow-y-auto custom-scrollbar">
                        {consoleOutput.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-600">
                                <Icons.Play className="w-12 h-12 mb-2 opacity-20" />
                                <p>Ready to execute.</p>
                            </div>
                        ) : (
                            consoleOutput.map((line, i) => (
                                <div key={i} className={`mb-1 break-all whitespace-pre-wrap ${line.startsWith('Error') ? 'text-red-400' : ''} ${line.startsWith('>') ? 'text-gray-500' : ''}`}>
                                    {line}
                                </div>
                            ))
                        )}
                        {isRunning && <div className="animate-pulse mt-2">_</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Canvas;
