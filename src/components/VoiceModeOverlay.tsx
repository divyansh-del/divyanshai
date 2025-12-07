
import React, { useEffect, useRef, useState } from 'react';
import * as Icons from './Icons';
import { Message, AppSettings, GPT } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

interface VoiceModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  messages: Message[];
  settings: AppSettings;
  activeGPT: GPT | null;
  onAddMessage: (role: 'user' | 'model', content: string) => void;
}

const VOICES = [
  { id: 'Kore', label: 'Kore (Calm)', gender: 'Female' },
  { id: 'Puck', label: 'Puck (Energetic)', gender: 'Male' },
  { id: 'Fenrir', label: 'Fenrir (Deep)', gender: 'Male' },
  { id: 'Charon', label: 'Charon (Professional)', gender: 'Male' },
  { id: 'Aoede', label: 'Aoede (Soft)', gender: 'Female' },
];

const CHATBHARAT_SYSTEM_INSTRUCTION = `
You are ChatBharat Ultra, a friendly, quick-witted, and helpful AI assistant.
- Your responses must be concise and conversational (voice-optimized).
- Do not use markdown formatting (lists, bolding) in your speech.
- Act like a real person in a voice call.
- If the user interrupts, stop talking immediately and listen.
`;

const VoiceModeOverlay: React.FC<VoiceModeOverlayProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  messages,
  settings,
  activeGPT,
  onAddMessage
}) => {
  // Configuration
  const MIN_SCALE = 0.92;
  const MAX_SCALE = 1.38;
  const SMOOTHING = 0.15;
  const MAX_RETRIES = 3;

  // State
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'error'>('connecting');
  const [accentColor, setAccentColor] = useState('#0b78ff');
  const [isMuted, setIsMuted] = useState(false);
  const [currentVoice, setCurrentVoice] = useState('Kore');
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs for Audio Processing
  const currentScaleRef = useRef(1.0);
  const circleWrapRef = useRef<HTMLDivElement>(null);
  const waveSvgRef = useRef<SVGSVGElement>(null);
  
  // Live API Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const sessionRef = useRef<any>(null); // Holds the LiveSession
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const initializedRef = useRef(false);
  const isConnectedRef = useRef(false);
  const retryCountRef = useRef(0);

  // Transcription Accumulation
  const inputTranscriptRef = useRef<string>('');
  const outputTranscriptRef = useRef<string>('');

  // --- Visual Helper ---
  const applyScale = (s: number) => {
    if (circleWrapRef.current) circleWrapRef.current.style.transform = `scale(${s})`;
    if (waveSvgRef.current) waveSvgRef.current.style.transform = `scale(${1 + (s - 1) * 0.08})`;
  };

  // --- Helpers for PCM ---
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // --- Audio Output Handling ---
  const playAudioChunk = async (base64Audio: string) => {
    if (!outputAudioContextRef.current) return;
    
    try {
        const ctx = outputAudioContextRef.current;
        // Resume if suspended (browser policy)
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const arrayBuffer = base64ToArrayBuffer(base64Audio);
        
        // Convert PCM16 to Float32
        const dataInt16 = new Int16Array(arrayBuffer);
        const float32Data = new Float32Array(dataInt16.length);
        for (let i = 0; i < dataInt16.length; i++) {
            float32Data[i] = dataInt16[i] / 32768.0;
        }

        const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000); // Model output is 24kHz
        audioBuffer.copyToChannel(float32Data, 0);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputNodeRef.current!);

        // Schedule seamlessly: Ensure we don't schedule in the past
        const currentTime = ctx.currentTime;
        if (nextStartTimeRef.current < currentTime) {
            nextStartTimeRef.current = currentTime;
        }
        
        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;
        
        audioSourcesRef.current.add(source);
        source.onended = () => {
            audioSourcesRef.current.delete(source);
            // Only switch back to listening if no more audio is queued/playing
            if (audioSourcesRef.current.size === 0) {
                 setStatus('listening');
            }
        };

    } catch (e) {
        console.error("Audio Playback Error", e);
    }
  };

  const stopAllAudio = () => {
      audioSourcesRef.current.forEach(source => {
          try { source.stop(); } catch {}
      });
      audioSourcesRef.current.clear();
      // Reset time to now to prevent scheduling in the past or far future after interruption
      if (outputAudioContextRef.current) {
          nextStartTimeRef.current = outputAudioContextRef.current.currentTime;
      }
      setStatus('listening');
  };

  // --- Live API Connection ---
  const connectToLiveAPI = async () => {
    if (initializedRef.current) return;
    
    // Online check
    if (!navigator.onLine) {
        setStatus('error');
        setErrorMessage("No Internet Connection");
        return;
    }

    initializedRef.current = true;
    setErrorMessage(null);
    setStatus('connecting');

    try {
        // 1. Optimized Audio Constraints
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000,
                channelCount: 1
            } 
        });
        
        // 2. Setup Input Context (16kHz for Gemini Input)
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
        
        // Explicitly resume AudioContext to prevent state mismatch
        if (inputAudioContextRef.current.state === 'suspended') {
            await inputAudioContextRef.current.resume();
        }

        const inputCtx = inputAudioContextRef.current;
        const source = inputCtx.createMediaStreamSource(stream);
        inputSourceRef.current = source;

        // 3. Audio Pipeline
        const highPassFilter = inputCtx.createBiquadFilter();
        highPassFilter.type = 'highpass';
        highPassFilter.frequency.value = 85;

        const compressor = inputCtx.createDynamicsCompressor();
        compressor.threshold.value = -20; 
        compressor.knee.value = 30; 
        compressor.ratio.value = 12; 
        compressor.attack.value = 0.003; 
        compressor.release.value = 0.25; 

        source.connect(highPassFilter);
        highPassFilter.connect(compressor);
        
        // OPTIMIZATION: Reduced buffer size to 2048 for ~128ms latency (vs 256ms at 4096)
        const processor = inputCtx.createScriptProcessor(2048, 1, 1);
        processorRef.current = processor;
        
        compressor.connect(processor);
        processor.connect(inputCtx.destination);

        // 4. Setup Output Context
        outputAudioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
        outputNodeRef.current = outputAudioContextRef.current.createGain();
        outputNodeRef.current.connect(outputAudioContextRef.current.destination);

        // 5. Initialize Gemini Client
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Inject Chat History (Optimized: Max 3 messages to prevent payload bloat causing network error)
        const recentMessages = messages.slice(-3);
        const historyContext = recentMessages.map(m => {
            const role = m.role === 'user' ? 'User' : 'Assistant';
            const cleanContent = m.content.replace(/[\n\r]+/g, ' ').substring(0, 100); 
            return `${role}: ${cleanContent}`;
        }).join(' | ');

        const baseInstruction = activeGPT ? activeGPT.systemInstruction : CHATBHARAT_SYSTEM_INSTRUCTION;
        
        // --- GOD MODE VOICE SETTINGS ---
        const emotion = settings.voice_config?.emotion_level || 'Expressive';
        const speedInstruction = settings.voice_config?.speed ? `Speak at ${settings.voice_config.speed}x speed.` : '';
        const customVoicePersona = settings.voice_config?.voice_persona_prompt || '';
        
        const voiceInstruction = `
        VOICE STYLE: ${emotion}.
        ${speedInstruction}
        ${customVoicePersona ? `CUSTOM PERSONA: ${customVoicePersona}` : ''}
        If the user sets 'Robotic', speak in a monotone.
        If 'Hyper-Real', include breath, pauses, and natural fillers (um, ah).
        `;
        
        const fullSystemInstruction = `${baseInstruction}
        ${voiceInstruction}
        CONTEXT: ${historyContext}
        Continue naturally.`;

        // 6. Connect Session
        const configToUse = {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: currentVoice } }
            },
            systemInstruction: fullSystemInstruction,
            // Ensure these are empty objects to prevent 'Invalid Argument' if model isn't supported for transcription
            inputAudioTranscription: {}, 
            outputAudioTranscription: {}
        };

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: configToUse,
            callbacks: {
                onopen: () => {
                    console.log("Gemini Live Connected");
                    isConnectedRef.current = true;
                    setStatus('listening');
                    retryCountRef.current = 0; // Reset retries on success
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Audio Output
                    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                        // IMMEDIATE FEEDBACK: Switch to speaking as soon as data arrives
                        setStatus('speaking');
                        playAudioChunk(audioData);
                    }
                    
                    // Transcriptions
                    if (message.serverContent?.outputTranscription?.text) {
                        outputTranscriptRef.current += message.serverContent.outputTranscription.text;
                    }
                    if (message.serverContent?.inputTranscription?.text) {
                        inputTranscriptRef.current += message.serverContent.inputTranscription.text;
                    }

                    // Turn Complete - Save History
                    if (message.serverContent?.turnComplete) {
                        if (inputTranscriptRef.current.trim()) {
                            onAddMessage('user', inputTranscriptRef.current);
                            inputTranscriptRef.current = '';
                        }
                        if (outputTranscriptRef.current.trim()) {
                            const responseText = outputTranscriptRef.current;
                            setTimeout(() => {
                                onAddMessage('model', responseText);
                            }, 100);
                            outputTranscriptRef.current = '';
                        }
                    }

                    // Interruption
                    if (message.serverContent?.interrupted) {
                        console.log("Model interrupted");
                        stopAllAudio();
                        if (outputTranscriptRef.current.trim()) {
                             onAddMessage('model', outputTranscriptRef.current + " (interrupted)");
                             outputTranscriptRef.current = '';
                        }
                    }
                },
                onclose: () => {
                    console.log("Gemini Live Closed");
                    isConnectedRef.current = false;
                },
                onerror: (err) => {
                    console.error("Gemini Live Error", err);
                    isConnectedRef.current = false;
                    
                    // AUTO-RETRY LOGIC
                    if (retryCountRef.current < MAX_RETRIES) {
                        const nextRetry = retryCountRef.current + 1;
                        console.log(`Connection dropped. Retrying (${nextRetry}/${MAX_RETRIES})...`);
                        retryCountRef.current = nextRetry;
                        setStatus('connecting');
                        
                        setTimeout(() => {
                            cleanup();
                            initializedRef.current = false;
                            connectToLiveAPI();
                        }, 1500 * nextRetry); // Exponential-ish backoff
                    } else {
                        setStatus('error');
                        setErrorMessage("Network Unstable. Please check connection.");
                    }
                }
            }
        });

        // Catch immediate connection errors
        sessionPromise.catch(e => {
            console.error("Session Connection Failed Immediately", e);
            if (!isConnectedRef.current) {
                 // Trigger logic similar to onerror
                 if (retryCountRef.current < MAX_RETRIES) {
                     retryCountRef.current += 1;
                     setTimeout(() => {
                         cleanup();
                         initializedRef.current = false;
                         connectToLiveAPI();
                     }, 1500);
                 } else {
                     setStatus('error');
                     setErrorMessage("Connection Failed. Check API Key.");
                 }
            }
        });

        sessionRef.current = sessionPromise;

        // 7. Start Streaming Input
        processor.onaudioprocess = (e) => {
            if (isMuted || !isConnectedRef.current) return;

            const inputData = e.inputBuffer.getChannelData(0);
            
            // PCM Conversion
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                let s = Math.max(-1, Math.min(1, inputData[i]));
                pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            const base64Data = arrayBufferToBase64(pcmData.buffer);

            sessionPromise.then(session => {
                try {
                    session.sendRealtimeInput({
                        media: {
                            mimeType: 'audio/pcm;rate=16000',
                            data: base64Data
                        }
                    });
                } catch (err) {
                    console.warn("Send Input Failed", err);
                }
            }).catch(err => {
                 // Suppress promise rejection if session isn't ready
            });
            
            updateVolumeLevel(inputData);
        };

    } catch (err) {
        console.error("Setup Failed", err);
        setStatus('error');
        setErrorMessage("Microphone Access Denied or API Error");
    }
  };

  const updateVolumeLevel = (data: Float32Array) => {
      let sum = 0;
      for (let i = 0; i < data.length; i += 10) { 
          sum += data[i] * data[i];
      }
      const rms = Math.sqrt(sum / (data.length / 10));
      setVolumeLevel(rms);
  };

  const cleanup = () => {
      isConnectedRef.current = false;
      
      if (processorRef.current) {
          processorRef.current.disconnect();
          processorRef.current = null;
      }
      if (inputSourceRef.current) {
          inputSourceRef.current.disconnect();
          inputSourceRef.current = null;
      }
      if (inputAudioContextRef.current) {
          try { inputAudioContextRef.current.close(); } catch {}
          inputAudioContextRef.current = null;
      }
      if (outputAudioContextRef.current) {
          try { outputAudioContextRef.current.close(); } catch {}
          outputAudioContextRef.current = null;
      }
      
      if (sessionRef.current) {
        sessionRef.current.then((session: any) => {
            try { session.close(); } catch(e) { console.warn("Session close error", e); }
        });
        sessionRef.current = null;
      }
      
      initializedRef.current = false;
  };

  // --- Effects ---

  useEffect(() => {
      if (isOpen) {
          inputTranscriptRef.current = '';
          outputTranscriptRef.current = '';
          retryCountRef.current = 0; // Reset retries on open
          connectToLiveAPI();
          
          let animationFrameId: number;
          const animate = () => {
              if (!isOpen) return;
              
              const targetScale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * Math.min(1, volumeLevel * 5);
              const prev = currentScaleRef.current;
              currentScaleRef.current = prev + (targetScale - prev) * SMOOTHING;
              applyScale(currentScaleRef.current);
              
              animationFrameId = requestAnimationFrame(animate);
          };
          animationFrameId = requestAnimationFrame(animate);
          
          return () => {
              cancelAnimationFrame(animationFrameId);
          };
      } else {
          cleanup();
      }
  }, [isOpen]); 

  const handleMicToggle = () => {
      setIsMuted(!isMuted);
  };

  const handleVoiceChange = (voiceId: string) => {
      setCurrentVoice(voiceId);
      setShowVoiceMenu(false);
      cleanup();
      setTimeout(() => {
          initializedRef.current = false;
          connectToLiveAPI();
      }, 100);
  };

  const retryConnection = () => {
      cleanup();
      retryCountRef.current = 0; // Reset retries manual
      setStatus('connecting');
      setTimeout(() => {
          initializedRef.current = false;
          connectToLiveAPI();
      }, 500);
  };

  const getStatusText = () => {
      if (status === 'error') return errorMessage || "Connection Issue";
      if (status === 'connecting') return "Connecting to Ultra Live...";
      if (status === 'speaking') return "ChatBharat is speaking...";
      if (isMuted) return "Microphone is muted";
      return "Listening...";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[10000] text-[#073046] font-sans">
        <style>{`
          .circle-wrap {
            width: 220px;
            height: 220px;
            border-radius: 50%;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            box-shadow: 0 30px 80px rgba(11,120,255,0.06);
            background: radial-gradient(circle at 30% 30%, #eaf6ff, #f7fcff 45%, #ffffff 72%);
            transition: transform 100ms linear;
          }
          .wave-svg {
             width: 140%;
             height: 140%;
             transform-origin: center;
             transition: transform 100ms linear;
             filter: blur(8px);
             opacity: 0.96;
             pointer-events: none;
          }
          .circle-btn {
             width: 64px;
             height: 64px;
             border-radius: 50%;
             background: #fff;
             display: flex;
             align-items: center;
             justify-content: center;
             box-shadow: 0 8px 26px rgba(2,12,34,0.06);
             border: none;
             cursor: pointer;
             font-size: 22px;
             transition: all 0.2s ease;
          }
          .circle-btn:active { transform: scale(0.95); }
          .circle-btn.active {
             background: linear-gradient(90deg, ${accentColor}, #2aa1ff);
             color: white;
          }
          .icon-btn {
             width: 46px;
             height: 46px;
             border-radius: 10px;
             border: none;
             background: #fff;
             box-shadow: 0 6px 16px rgba(5,25,60,0.06);
             cursor: pointer;
             display: flex;
             align-items: center;
             justify-content: center;
             font-size: 18px;
             transition: all 0.2s ease;
          }
          .icon-btn:hover { transform: scale(1.05); }
          .voice-menu {
             position: absolute;
             bottom: 110px;
             background: white;
             padding: 8px;
             border-radius: 16px;
             box-shadow: 0 10px 40px rgba(0,0,0,0.15);
             display: flex;
             flex-direction: column;
             gap: 4px;
             width: 200px;
             z-index: 10020;
             animation: fadeInUp 0.2s ease-out;
          }
          .voice-option {
             padding: 10px 12px;
             border-radius: 10px;
             text-align: left;
             font-size: 14px;
             cursor: pointer;
             display: flex;
             justify-content: space-between;
             align-items: center;
             color: #334;
          }
          .voice-option:hover { background: #f5f7fb; }
          .voice-option.selected { background: #eff6ff; color: ${accentColor}; font-weight: 600; }
        `}</style>

        {showVoiceMenu && (
            <div className="voice-menu">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-1">Select Voice</div>
                {VOICES.map(v => (
                    <div 
                        key={v.id} 
                        onClick={() => handleVoiceChange(v.id)}
                        className={`voice-option ${currentVoice === v.id ? 'selected' : ''}`}
                    >
                        <span>{v.label}</span>
                        {currentVoice === v.id && <Icons.Check className="w-4 h-4" />}
                    </div>
                ))}
            </div>
        )}

        <div className="absolute top-[18px] right-[18px] flex gap-[10px] z-[10010]">
             <button onClick={() => { cleanup(); onClose(); }} className="icon-btn" title="Close">
                 <Icons.XCircle className="w-5 h-5 text-gray-700" />
             </button>
        </div>

        <div ref={circleWrapRef} className="circle-wrap" aria-hidden="true">
             <svg ref={waveSvgRef} viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet" className="wave-svg">
                <defs>
                   <linearGradient id="gA" x1="0%" x2="100%">
                      <stop offset="0%" stopColor={accentColor} stopOpacity="0.26"></stop>
                      <stop offset="70%" stopColor="#bfe6ff" stopOpacity="0.12"></stop>
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06"></stop>
                   </linearGradient>
                   <radialGradient id="gB" cx="30%" cy="30%">
                      <stop offset="0%" stopColor="#e6f8ff" stopOpacity="1"></stop>
                      <stop offset="60%" stopColor="#dff4ff" stopOpacity="0.9"></stop>
                   </radialGradient>
                </defs>
                <circle cx="400" cy="400" r="320" fill="url(#gB)"></circle>
                <g opacity="0.46"><ellipse cx="400" cy="480" rx="320" ry="58" fill="url(#gA)"></ellipse></g>
                <g opacity="0.32"><ellipse cx="400" cy="420" rx="260" ry="44" fill="url(#gA)"></ellipse></g>
                <g opacity="0.22"><ellipse cx="400" cy="520" rx="240" ry="36" fill="url(#gA)"></ellipse></g>
             </svg>
        </div>
        
        <div className="mt-8 text-center font-medium text-lg text-gray-600 animate-fade-in transition-all flex flex-col items-center gap-2">
            <span>{getStatusText()}</span>
            {status === 'error' && (
                <button 
                    onClick={retryConnection}
                    className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors"
                >
                    Retry Connection
                </button>
            )}
        </div>

        <div className="mt-[22px] flex gap-[16px] items-center z-[10010]">
             <button 
                onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                className="circle-btn"
                style={{ width: '50px', height: '50px', fontSize: '18px' }}
                title="Change Voice"
             >
                <Icons.Users className="w-5 h-5 text-gray-600" />
             </button>

             <button 
                onClick={handleMicToggle} 
                className={`circle-btn ${!isMuted ? 'active' : ''}`}
                style={{ width: '72px', height: '72px' }}
                title={isMuted ? "Unmute" : "Mute"}
             >
                 {isMuted ? (
                    <Icons.Mic className="w-7 h-7 text-gray-400" style={{opacity: 0.5}} />
                 ) : (
                    <Icons.Mic className="w-7 h-7 text-white" />
                 )}
             </button>

             <button 
                onClick={() => { cleanup(); onClose(); }} 
                className="circle-btn"
                style={{ width: '50px', height: '50px', fontSize: '18px' }}
                title="End Call"
             >
                 <Icons.Phone className="w-5 h-5 text-red-500" />
             </button>
        </div>
    </div>
  );
};

export default VoiceModeOverlay;
