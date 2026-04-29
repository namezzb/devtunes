import React, { useRef, useEffect } from 'react';

interface StarFieldProps {
  count?: number;
}

export function StarField({ count = 400 }: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX - window.innerWidth / 2) * 0.05;
      targetMouseY = (e.clientY - window.innerHeight / 2) * 0.05;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      baseAlpha: Math.random() * 0.5 + 0.1,
      alpha: 0,
      blinkSpeed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.8 ? 'var(--star-gold)' : 'var(--star-white)',
      z: Math.random() * 2 + 0.1
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      mouseX += (targetMouseX - mouseX) * 0.1;
      mouseY += (targetMouseY - mouseY) * 0.1;

      stars.forEach(star => {
        star.alpha = star.baseAlpha + Math.sin(Date.now() * star.blinkSpeed + star.phase) * 0.2;
        if (star.alpha < 0) star.alpha = 0;

        let x = star.x - mouseX * star.z;
        let y = star.y - mouseY * star.z;

        if (x < 0) x += canvas.width;
        if (x > canvas.width) x -= canvas.width;
        if (y < 0) y += canvas.height;
        if (y > canvas.height) y -= canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        
        const isGold = star.color === 'var(--star-gold)';
        ctx.fillStyle = isGold 
          ? `rgba(255, 215, 0, ${star.alpha})` 
          : `rgba(232, 232, 255, ${star.alpha})`;
          
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
}
