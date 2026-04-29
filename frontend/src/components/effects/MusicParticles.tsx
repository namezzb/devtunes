import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  isGathered: boolean;
  trail: { x: number; y: number }[];
}

interface MusicParticlesProps {
  isPlaying: boolean;
}

export function MusicParticles({ isPlaying }: MusicParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const beatTimerRef = useRef<number>(0);

  useEffect(() => {
    const colors = [
      '#00FFC8',
      '#8B5CF6',
      '#FF6B9D',
    ];

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;


    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const createParticle = (x?: number, y?: number, isExplosion = false): Particle => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      let px = x;
      let py = y;
      
      if (px === undefined || py === undefined) {

        if (!isExplosion) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.max(canvas.width, canvas.height) / 2 + 50;
          px = centerX + Math.cos(angle) * radius;
          py = centerY + Math.sin(angle) * radius;
        } else {
          px = centerX + (Math.random() - 0.5) * 20;
          py = centerY + (Math.random() - 0.5) * 20;
        }
      }

      let vx = 0;
      let vy = 0;

      if (isExplosion) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      } else if (!isPlaying) {
        vx = (Math.random() - 0.5) * 1;
        vy = (Math.random() - 0.5) * 1;
      }

      return {
        x: px,
        y: py,
        vx,
        vy,
        size: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 100 + Math.random() * 100,
        isGathered: false,
        trail: []
      };
    };


    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 80; i++) {
        particlesRef.current.push(createParticle(
          Math.random() * canvas.width,
          Math.random() * canvas.height
        ));
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;


      if (isPlaying) {
        beatTimerRef.current += 1;
        if (beatTimerRef.current > 60) {
          beatTimerRef.current = 0;

          for (let i = 0; i < 20; i++) {
            particlesRef.current.push(createParticle(centerX, centerY, true));
          }
        }
      }

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        
        p.life++;
        

        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 10) {
          p.trail.shift();
        }

        if (isPlaying) {
          if (!p.isGathered && p.life > 20) {

            const dx = centerX - p.x;
            const dy = centerY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 30) {
              p.isGathered = true;
              p.life = p.maxLife;
            } else {
              p.vx += (dx / dist) * 0.2;
              p.vy += (dy / dist) * 0.2;
              

              p.vx += (dy / dist) * 0.5;
              p.vy -= (dx / dist) * 0.5;
              

              const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
              if (speed > 4) {
                p.vx = (p.vx / speed) * 4;
                p.vy = (p.vy / speed) * 4;
              }
            }
          }
        } else {

          p.vx *= 0.95;
          p.vy *= 0.95;
          

          p.vx += (Math.random() - 0.5) * 0.1;
          p.vy += (Math.random() - 0.5) * 0.1;
        }

        p.x += p.vx;
        p.y += p.vy;


        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let j = 1; j < p.trail.length; j++) {
            ctx.lineTo(p.trail[j].x, p.trail[j].y);
          }
          
          const gradient = ctx.createLinearGradient(
            p.trail[0].x, p.trail[0].y,
            p.x, p.y
          );
          

          const alpha = Math.max(0, 1 - p.life / p.maxLife);
          

          let r = 255, g = 255, b = 255;
          if (p.color === '#00FFC8') { r = 0; g = 255; b = 200; }
          else if (p.color === '#8B5CF6') { r = 139; g = 92; b = 246; }
          else if (p.color === '#FF6B9D') { r = 255; g = 107; b = 157; }
          
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`);
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.stroke();
        }


        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.fill();
        ctx.globalAlpha = 1;


        if (p.life >= p.maxLife || 
            p.x < -100 || p.x > canvas.width + 100 || 
            p.y < -100 || p.y > canvas.height + 100) {
          particlesRef.current[i] = createParticle();
        }
      }


      while (particlesRef.current.length > 100) {
        particlesRef.current.shift();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      particlesRef.current = [];
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
