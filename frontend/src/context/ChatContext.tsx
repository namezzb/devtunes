import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useClock } from '../hooks/useClock';
import { useWeather, WeatherData } from '../hooks/useWeather';

export interface ChatContextData {
  weather: WeatherData | null;
  clock: {
    hours: string;
    minutes: string;
    dayOfWeek: string;
    date: string;
    period: 'AM' | 'PM';
  };
  timeCategory: string;
  nowPlaying: { title: string; artist: string } | null;
  playlistTitles: string[];
  setNowPlaying: (track: { title: string; artist: string } | null) => void;
  setPlaylistTitles: (titles: string[]) => void;
}

const ChatContext = createContext<ChatContextData | undefined>(undefined);

function getTimeCategory(hour: number): string {
  if (hour >= 6 && hour < 9) return '清晨';
  if (hour >= 9 && hour < 12) return '上午';
  if (hour >= 12 && hour < 14) return '午间';
  if (hour >= 14 && hour < 18) return '下午';
  if (hour >= 18 && hour < 21) return '傍晚';
  if (hour >= 21 || hour < 2) return '深夜';
  return '凌晨';
}

interface ChatContextProviderProps {
  children: ReactNode;
}

export function ChatContextProvider({ children }: ChatContextProviderProps) {
  const clockData = useClock('24h');
  const { weather } = useWeather({ useMock: true });
  const [nowPlaying, setNowPlaying] = useState<{ title: string; artist: string } | null>(null);
  const [playlistTitles, setPlaylistTitles] = useState<string[]>([]);

  const hour = parseInt(clockData.hours, 10);
  const timeCategory = getTimeCategory(hour);

  const handleSetNowPlaying = useCallback(
    (track: { title: string; artist: string } | null) => {
      setNowPlaying(track);
    },
    [],
  );

  const value: ChatContextData = {
    weather,
    clock: {
      hours: clockData.hours,
      minutes: clockData.minutes,
      dayOfWeek: clockData.dayOfWeek,
      date: clockData.date,
      period: clockData.period,
    },
    timeCategory,
    nowPlaying,
    playlistTitles,
    setNowPlaying: handleSetNowPlaying,
    setPlaylistTitles,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext(): ChatContextData {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatContextProvider');
  }
  return context;
}
