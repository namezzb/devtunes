import React from 'react';
import { motion } from 'framer-motion';
import { useClock } from '../../hooks/useClock';
import { useWeather } from '../../hooks/useWeather';

export interface CompactClockWeatherProps {
  className?: string;
  format?: '12h' | '24h';
  showSeconds?: boolean;
  showDate?: boolean;
  useMock?: boolean;
}

export function CompactClockWeather({
  className = '',
  format = '24h',
  showSeconds = true,
  showDate = true,
  useMock = true,
}: CompactClockWeatherProps) {
  const { hours, minutes, seconds, date, dayOfWeek, period } = useClock(format);
  const { weather, loading, error, refresh, getDescription } = useWeather({ useMock });

  const gradientTextStyle = {
    background: 'linear-gradient(135deg, var(--aurora-start), var(--aurora-mid), var(--aurora-end))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };

  return (
    <div className={`glass-card relative overflow-hidden p-4 flex items-center justify-between ${className}`}>
      <div className="absolute inset-0 pointer-events-none rounded-2xl border border-transparent" style={{
        background: 'linear-gradient(135deg, rgba(0, 255, 200, 0.1), rgba(139, 92, 246, 0.1), rgba(255, 107, 157, 0.1)) border-box',
        WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
      }} />
      
      <motion.div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(circle at 0% 0%, var(--aurora-start) 0%, transparent 50%)',
            'radial-gradient(circle at 100% 100%, var(--aurora-mid) 0%, transparent 50%)',
            'radial-gradient(circle at 0% 100%, var(--aurora-end) 0%, transparent 50%)',
            'radial-gradient(circle at 0% 0%, var(--aurora-start) 0%, transparent 50%)',
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      <div className="flex flex-col w-[60%] relative z-10">
        <div className="flex items-baseline">
          <span className="text-5xl font-light tracking-tight" style={gradientTextStyle} aria-label="Hours">
            {hours}
          </span>
          <span className="text-4xl font-light text-[var(--aurora-mid)] animate-pulse mx-1">:</span>
          <span className="text-5xl font-light tracking-tight" style={gradientTextStyle} aria-label="Minutes">
            {minutes}
          </span>
          {showSeconds && (
            <span className="text-xl font-light text-[var(--text-secondary)] ml-2 mb-1" aria-label="Seconds">
              {seconds}
            </span>
          )}
          {format === '12h' && (
            <span className="text-sm font-medium text-[var(--text-secondary)] ml-2 mb-1 uppercase">
              {period}
            </span>
          )}
        </div>
        {showDate && (
          <div className="text-sm font-medium text-[var(--text-muted)] mt-1 tracking-wide">
            {dayOfWeek}, {date}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end w-[40%] relative z-10 text-right border-l border-white/5 pl-4">
        {loading ? (
          <div className="flex items-center justify-center h-full w-full py-2">
            <div className="w-6 h-6 border-2 border-[var(--aurora-mid)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-end justify-center h-full">
            <span className="text-xs text-[var(--error)] mb-1">Weather Error</span>
            <button 
              onClick={refresh}
              className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] transition-colors"
            >
              Retry
            </button>
          </div>
        ) : weather ? (
          <>
            <div className="flex items-center justify-end gap-2">
              <motion.div 
                className="text-3xl"
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                {weather.icon}
              </motion.div>
              <span className="text-3xl font-bold tracking-tight" style={gradientTextStyle}>
                {weather.temperature}°
              </span>
            </div>
            <div className="text-sm font-medium text-[var(--text-secondary)] mt-1">
              {getDescription()}
            </div>
            <div className="flex items-center gap-1 w-full mt-0.5">
              <span className="text-xs text-[var(--text-muted)] truncate">
                {weather.location}
              </span>
              <button
                onClick={refresh}
                aria-label="Refresh weather"
                className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
