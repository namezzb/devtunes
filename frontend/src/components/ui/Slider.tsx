import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
  formatTooltip?: (value: number) => string;
}

export function Slider({ value, min = 0, max = 100, onChange, className = '', formatTooltip }: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const handleMove = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const newPercentage = x / rect.width;
    const newValue = min + newPercentage * (max - min);
    onChange(newValue);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
    
    if (trackRef.current) {
      trackRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (trackRef.current) {
      trackRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const showTooltip = (isDragging || isHovered) && formatTooltip;

  return (
    <div 
      className={`relative h-6 flex items-center cursor-pointer group ${className}`}
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[var(--aurora-start)] to-[var(--aurora-mid)] rounded-full relative"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)', transform: 'skewX(-20deg)' }} />
        </div>
      </div>
      
      <div 
        className={`absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8),0_0_20px_var(--aurora-start)] transition-transform duration-100 ${isDragging ? 'scale-150' : 'group-hover:scale-125'}`}
        style={{ left: `calc(${percentage}% - 7px)` }}
      >
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: -30, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 backdrop-blur-md text-white text-[10px] font-mono rounded-md border border-white/10 shadow-lg whitespace-nowrap pointer-events-none"
            >
              {formatTooltip(value)}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 border-b border-r border-white/10 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
