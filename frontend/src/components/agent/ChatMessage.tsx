import React from 'react';
import { motion } from 'framer-motion';

interface ChatMessageProps {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  onPlayAudio?: (id: string) => void;
  isPlaying?: boolean;
}

export function ChatMessage({ role, content, timestamp, onPlayAudio, isPlaying, id }: ChatMessageProps) {
  const isUser = role === 'user';
  const isError = content.startsWith('Error:');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-4`}>

        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--aurora-mid)] to-[var(--aurora-end)] flex items-center justify-center text-white text-xs font-bold shadow-[0_0_15px_rgba(139,92,246,0.4)] ring-2 ring-white/10">
              U
            </div>
          ) : (
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-[var(--aurora-start)] to-[var(--aurora-mid)] flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,255,200,0.4)] ring-2 ring-white/10">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {isPlaying && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--aurora-start)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--aurora-start)]"></span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className="flex items-center gap-3 mb-1.5 px-1">
            <span className="text-[10px] font-medium tracking-wider text-[var(--text-muted)] uppercase">{timestamp}</span>
          </div>

          <div className="relative group">
            <div
              className={`relative px-5 py-3.5 rounded-2xl text-sm leading-relaxed backdrop-blur-xl transition-all duration-300 ${
                isError
                  ? 'bg-red-500/20 border border-red-500/30 text-red-200 rounded-tl-sm'
                  : isUser
                    ? 'bg-white/10 text-white rounded-tr-sm hover:bg-white/15 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]'
                    : 'bg-[var(--bg-card)]/80 text-[var(--text-primary)] rounded-tl-sm shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]'
              }`}
            >
              {!isUser && (
                <div className="absolute inset-0 rounded-2xl rounded-tl-sm border border-transparent bg-gradient-to-br from-[var(--aurora-start)]/30 via-[var(--aurora-mid)]/10 to-[var(--aurora-end)]/30 [mask-image:linear-gradient(white,white)] [-webkit-mask-composite:xor] pointer-events-none" />
              )}
              
              <div className="relative z-10 flex items-start gap-3">
                <div className="flex-1">{content}</div>
                
                {!isUser && onPlayAudio && (
                  <button 
                    onClick={() => onPlayAudio(id)}
                    className={`flex-shrink-0 mt-0.5 p-1.5 rounded-full transition-all duration-300 ${
                      isPlaying 
                        ? 'text-[var(--aurora-start)] bg-[var(--aurora-start)]/10 shadow-[0_0_10px_rgba(0,255,200,0.2)]' 
                        : 'text-[var(--text-muted)] hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isPlaying ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
