import { MusicPlayer } from '../music/MusicPlayer';
import { AgentChat } from '../agent/AgentChat';
import { useAppContext } from '../../context/AppContext';
import { useEffect } from 'react';

interface TabNavigationProps {
  activeTab: 'music' | 'ai';
  onTabChange: (tab: 'music' | 'ai') => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-panel border-t border-white/10">
      <div className="flex items-center justify-around py-3 px-4">
        <button
          onClick={() => onTabChange('music')}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-200 ${
            activeTab === 'music'
              ? 'text-[var(--aurora-start)] bg-[var(--aurora-start)]/10'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <span className="text-xs font-medium">Music</span>
        </button>

        <button
          onClick={() => onTabChange('ai')}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-200 ${
            activeTab === 'ai'
              ? 'text-[var(--aurora-mid)] bg-[var(--aurora-mid)]/10'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-2 2 2 2h-2l-2-2z" />
          </svg>
          <span className="text-xs font-medium">AI Chat</span>
        </button>
      </div>
    </nav>
  );
}

export function MobileView() {
  const { activeTab, setActiveTab } = useAppContext();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setActiveTab('music');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setActiveTab]);

  return (
    <div className="lg:hidden flex flex-col flex-1">
      <div className="flex-1 min-h-0 flex flex-col">
        {activeTab === 'music' ? <MusicPlayer /> : <AgentChat />}
      </div>
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export function DesktopView() {
  return (
    <div className="hidden lg:flex flex-1 gap-6 min-h-0">
      <div className="flex-[1.5] min-h-0 flex flex-col">
        <MusicPlayer />
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <AgentChat />
      </div>
    </div>
  );
}