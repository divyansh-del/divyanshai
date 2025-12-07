import React, { useEffect, useRef } from 'react';

interface VoiceOverlayProps {
  onClose: () => void;
  onTranscript?: (text: string) => void;
}

export default function VoiceOverlay({ onClose, onTranscript }: VoiceOverlayProps) {
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let t = 0;

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0,0,width,height);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,width,height);
      // waveform
      ctx.beginPath();
      for (let x=0;x<width;x+=6){
        const y = height/2 + Math.sin((x+t)/20) * 40 * Math.sin(t/50);
        ctx.lineTo(x,y);
      }
      ctx.strokeStyle = 'rgba(96,165,250,0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
      t++;
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);
    return ()=> {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center glass-blur">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">🎤</div>
        </div>
        <div className="text-white text-lg">Listening... Speak now</div>
        <div className="text-white/70 text-sm">Auto-transcribe enabled</div>
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-white/10 border text-white">Stop</button>
        </div>
      </div>
    </div>
  );
}