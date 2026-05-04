import React, { useState, useEffect } from 'react';
import { StarField } from './components/effects/StarField';
import { Aurora } from './components/effects/Aurora';
import { AppProvider } from './context/AppContext';
import { MobileView, DesktopView } from './components/ui/TabNavigation';
import { ToastProvider } from './components/ui/Toast';
import { ClockWeatherPanel } from './components/widget';

function AppContent() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen w-full bg-[var(--bg-deep)] text-white relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <StarField count={400} />
        <Aurora isPlaying={true} />
      </div>

      <div className="relative z-10 h-full w-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="container mx-auto px-4 py-8 min-h-full flex flex-col">
          <header className="mb-6 text-center flex-shrink-0">
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--aurora-start)] via-[var(--aurora-mid)] to-[var(--aurora-end)]">
                DEVTunes
              </span>
            </h1>
            <p className="text-[var(--text-secondary)]">Music + AI Agent for Independent Developers</p>
          </header>

          <div className="mb-6 flex-shrink-0">
            <ClockWeatherPanel
              clockFormat="24h"
              showSeconds={true}
              showDate={true}
              useMockWeather={true}
              showForecast={true}
            />
          </div>

          <main className="flex-1 pb-20 lg:pb-8 min-h-0 flex flex-col">
            {isDesktop ? <DesktopView /> : <MobileView />}
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <ToastProvider />
      <AppContent />
    </AppProvider>
  );
}

export default App;