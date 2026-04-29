import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Button } from '../ui/Button';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'agent',
    content: '你好！我是 DEVTunes AI。我可以帮你推荐适合编程的音乐，或者根据你的心情生成专属歌单。今天想听点什么？',
    timestamp: '10:00'
  },
  {
    id: '2',
    role: 'user',
    content: '我在写一个复杂的 React 组件，需要一些能让我专注的音乐。',
    timestamp: '10:02'
  },
  {
    id: '3',
    role: 'agent',
    content: '明白了。写复杂组件需要深度专注。我为你推荐 "Lofi Coding" 歌单，节奏平缓，没有歌词打扰。需要我直接播放吗？',
    timestamp: '10:02'
  }
];

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (content: string) => {
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);
    
    setTimeout(() => {
      const newAgentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: '这是一个模拟的 AI 回复。在实际应用中，这里会连接到大语言模型 API。',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, newAgentMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handlePlayAudio = (id: string) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
      setTimeout(() => {
        if (playingAudioId === id) {
          setPlayingAudioId(null);
        }
      }, 3000);
    }
  };

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden relative z-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] border-white/10">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--aurora-start)]/5 via-transparent to-[var(--aurora-end)]/5 pointer-events-none" />
      
      <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-md relative z-10">
        <h2 className="text-lg font-semibold text-white flex items-center gap-3">
          <div className="relative flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--aurora-start)] opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--aurora-start)] shadow-[0_0_8px_var(--aurora-start)]"></span>
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            AI Agent
          </span>
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative z-10">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <ChatMessage 
              key={msg.id}
              {...msg}
              onPlayAudio={handlePlayAudio}
              isPlaying={playingAudioId === msg.id}
            />
          ))}
          
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="flex justify-start mb-4"
            >
              <div className="flex gap-4 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--aurora-start)] to-[var(--aurora-mid)] flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-[0_0_15px_rgba(0,255,200,0.4)] ring-2 ring-white/10">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="relative group">
                  <div className="bg-[var(--bg-card)]/80 backdrop-blur-xl rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-0 rounded-2xl rounded-tl-sm border border-transparent bg-gradient-to-br from-[var(--aurora-start)]/30 via-[var(--aurora-mid)]/10 to-[var(--aurora-end)]/30 [mask-image:linear-gradient(white,white)] [-webkit-mask-composite:xor] pointer-events-none" />
                    
                    <motion.div 
                      animate={{ 
                        scaleY: [1, 2, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                      className="w-1 h-3 bg-[var(--aurora-start)] rounded-full" 
                    />
                    <motion.div 
                      animate={{ 
                        scaleY: [1, 2.5, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
                      className="w-1 h-3 bg-[var(--aurora-mid)] rounded-full" 
                    />
                    <motion.div 
                      animate={{ 
                        scaleY: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                      className="w-1 h-3 bg-[var(--aurora-end)] rounded-full" 
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-2" />
      </div>

      <div className="relative z-10 bg-black/20 backdrop-blur-md border-t border-white/5">
        <ChatInput onSend={handleSend} disabled={isTyping} />
      </div>
    </div>
  );
}
