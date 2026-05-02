import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  thinkingMode?: boolean;
  onToggleThinking?: () => void;
  isStreaming?: boolean;
}

export function ChatInput({ onSend, disabled, thinkingMode = true, onToggleThinking, isStreaming = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      {onToggleThinking && (
        <div className="flex items-center gap-2.5 px-4 pt-3 pb-1">
          <button
            type="button"
            role="switch"
            aria-checked={thinkingMode}
            disabled={isStreaming}
            onClick={onToggleThinking}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isStreaming ? 'opacity-40 cursor-not-allowed' : ''
            } ${thinkingMode ? 'bg-[var(--aurora-start)]' : 'bg-white/20'}`}
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 ${
                thinkingMode ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-medium transition-colors duration-200 ${
            thinkingMode ? 'text-[var(--aurora-start)]' : 'text-[var(--text-secondary)]'
          }`}>
            {thinkingMode ? '开启思考' : '不开启思考'}
          </span>
        </div>
      )}

      <div className="relative flex items-end gap-2 p-4 bg-black/20 border-t border-white/5">
        <div className="relative flex-1 bg-[var(--bg-surface)] border border-white/10 rounded-xl overflow-hidden focus-within:border-[var(--aurora-mid)] focus-within:ring-1 focus-within:ring-[var(--aurora-mid)] transition-all">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="和 AI 聊聊音乐..."
            disabled={disabled}
            className="w-full max-h-[120px] bg-transparent text-white placeholder:text-white/20 px-4 py-3 resize-none focus:outline-none custom-scrollbar"
            rows={1}
          />
        </div>
        
        <Button 
          variant="gradient" 
          size="icon" 
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="h-[46px] w-[46px] flex-shrink-0 rounded-xl"
        >
          <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
