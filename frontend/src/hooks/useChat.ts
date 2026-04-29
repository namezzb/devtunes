import { useState, useCallback, useRef, useEffect } from 'react';
import { chat, ChatMessage as ApiChatMessage } from '../services/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isTyping: boolean;
  isStreaming: boolean;
  sendMessage: (content: string) => void;
  appendMessage: (role: 'user' | 'agent', content: string) => ChatMessage;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<(() => void) | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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

    const history: ApiChatMessage[] = messagesRef.current.map(({ role, content }) => ({ role, content }));
    let fullContent = '';

    let pendingUpdate = false;

    const flushUpdate = () => {
      pendingUpdate = false;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMessageId ? { ...msg, content: fullContent } : msg
        )
      );
    };

    const scheduleUpdate = () => {
      if (!pendingUpdate) {
        pendingUpdate = true;
        requestAnimationFrame(flushUpdate);
      }
    };

    abortControllerRef.current = chat(
      content,
      history,
      (chunk) => {
        fullContent += chunk;
        scheduleUpdate();
      },
      () => {
        setIsStreaming(false);
        setIsTyping(false);
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
        abortControllerRef.current = null;
      }
    );
  }, [appendMessage]);

  return {
    messages,
    isTyping,
    isStreaming,
    sendMessage,
    appendMessage,
  };
}
