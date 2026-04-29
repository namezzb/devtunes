import { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  activeTab: 'music' | 'ai';
  setActiveTab: (tab: 'music' | 'ai') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [activeTab, setActiveTab] = useState<'music' | 'ai'>('music');

  return (
    <AppContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}