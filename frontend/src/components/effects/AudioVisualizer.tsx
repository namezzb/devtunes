import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  audioElement?: HTMLAudioElement | null;
}

export function AudioVisualizer({ isPlaying, audioElement }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!audioElement || !isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 128;
      
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyzer);
      analyzer.connect(audioContext.destination);
      
      analyzerRef.current = analyzer;
      dataArrayRef.current = new Uint8Array(analyzer.frequencyBinCount);
    } catch (e) {
      console.warn("Audio context already created or failed to create");
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (!analyzerRef.current || !dataArrayRef.current) return;
      
      analyzerRef.current.getByteFrequencyData(dataArrayRef.current as any);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 20;
      
      const bars = dataArrayRef.current.length;
      const angleStep = (Math.PI * 2) / bars;
      
      for (let i = 0; i < bars; i++) {
        const value = dataArrayRef.current[i];
        const percent = value / 255;
        const barHeight = percent * 40;
        
        const angle = i * angleStep;
        
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, 'rgba(0, 255, 200, 0.2)');
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 107, 157, 0.8)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, audioElement]);

  return (
    <canvas 
      ref={canvasRef} 
      width={200} 
      height={200} 
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
