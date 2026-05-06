import React, { useEffect, useRef, useCallback } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  audioElement?: HTMLAudioElement | null;
}

export function AudioVisualizer({ isPlaying, audioElement }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const previousElementRef = useRef<HTMLAudioElement | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  // ResizeObserver: sync canvas dimensions to container size
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
        canvas.width = clientWidth;
        canvas.height = clientHeight;
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!audioElement || !isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
      return;
    }

    let audioContext = audioContextRef.current;
    if (!audioContext) {
      audioContext = new AudioContext();
      audioContextRef.current = audioContext;
    }

    if (previousElementRef.current !== audioElement) {
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch {
          /* already disconnected */
        }
        sourceRef.current = null;
      }
      previousElementRef.current = audioElement;
    }

    if (!sourceRef.current) {
      try {
        sourceRef.current = audioContext.createMediaElementSource(audioElement);
      } catch (e) {
        console.warn('AudioVisualizer: could not connect to audio element', e);
        return;
      }
    }

    const source = sourceRef.current;
    const analyzer = analyzerRef.current || audioContext.createAnalyser();
    if (!analyzerRef.current) {
      analyzer.fftSize = 128;
      analyzerRef.current = analyzer;
      source.connect(analyzer);
      analyzer.connect(audioContext.destination);
    }

    const dataArray = new Uint8Array(analyzer.frequencyBinCount);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      analyzer.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 20;

      const bars = dataArray.length;
      const angleStep = (Math.PI * 2) / bars;

      for (let i = 0; i < bars; i++) {
        const value = dataArray[i];
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
        animationRef.current = 0;
      }
    };
  }, [isPlaying, audioElement]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}
