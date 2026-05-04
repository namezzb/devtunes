import { useState, useCallback, useRef, useEffect } from 'react';
import { chat } from '../services/api';

const THINKING_MODEL = 'claude-sonnet-4-6';
const FAST_MODEL = 'claude-haiku-4-5';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
}

export interface ToolStatus {
  active: boolean;
  name: string | null;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isTyping: boolean;
  isStreaming: boolean;
  toolStatus: ToolStatus;
  hasSession: boolean;
  thinkingMode: boolean;
  sendMessage: (content: string) => void;
  newSession: () => void;
  toggleThinking: () => void;
  appendMessage: (role: 'user' | 'agent', content: string) => ChatMessage;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<ToolStatus>({ active: false, name: null });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [thinkingMode, setThinkingMode] = useState(true);
  const abortControllerRef = useRef<(() => void) | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const newSession = useCallback(() => {
    setSessionId(null);
    setMessages([]);
  }, []);

  const toggleThinking = useCallback(() => {
    setThinkingMode((prev) => !prev);
    newSession();
  }, [newSession]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current();
      }
    };
  }, []);

  const appendMessage = useCallback((role: 'user' | 'agent', content: string): ChatMessage => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessage = useCallback((content: string) => {
    appendMessage('user', content);

    if (abortControllerRef.current) {
      abortControllerRef.current();
    }

    setIsTyping(false);
    setIsStreaming(true);
    setToolStatus({ active: false, name: null });

    let agentMessageId: string;
    setMessages((prev) => {
      const placeholder: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      agentMessageId = placeholder.id;
      return [...prev, placeholder];
    });

    let fullContent = '';
    let thinkingAccum = '';

    abortControllerRef.current = chat(
      content,
      sessionIdRef.current,
      (chunk) => {
        fullContent += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === agentMessageId ? { ...msg, content: fullContent } : msg
          )
        );
      },
      () => {
        setIsStreaming(false);
        setIsTyping(false);
        setToolStatus({ active: false, name: null });
        abortControllerRef.current = null;
      },
      (errorMsg) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === agentMessageId
              ? { ...msg, content: `Error: ${errorMsg}` }
              : msg
          )
        );
        setIsStreaming(false);
        setIsTyping(false);
        setToolStatus({ active: false, name: null });
        abortControllerRef.current = null;
      },
      (sid) => {
        setSessionId(sid);
      },
      (thinking) => {
        thinkingAccum += thinking;
        setToolStatus({ active: true, name: thinkingAccum });
      },
      (toolName) => {
        setToolStatus({ active: true, name: toolName });
      },
      () => {
        setToolStatus({ active: false, name: null });
      },
      thinkingMode ? THINKING_MODEL : FAST_MODEL,
    );
  }, [appendMessage, thinkingMode]);

  return {
    messages,
    isTyping,
    isStreaming,
    toolStatus,
    hasSession: sessionId !== null,
    thinkingMode,
    sendMessage,
    newSession,
    toggleThinking,
    appendMessage,
  };
}
