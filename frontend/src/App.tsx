import React from 'react';
import { StarField } from './components/effects/StarField';
import { Aurora } from './components/effects/Aurora';
import { AppProvider } from './context/AppContext';
import { MobileView, DesktopView } from './components/ui/TabNavigation';
import { ToastProvider } from './components/ui/Toast';

function AppContent() {
  return (
    <div className="min-h-screen bg-[var(--bg-deep)] text-white relative overflow-hidden font-sans">
      <StarField count={400} />
      <Aurora isPlaying={true} />

      <div className="relative z-10 container mx-auto px-4 py-8 h-screen flex flex-col">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--aurora-start)] via-[var(--aurora-mid)] to-[var(--aurora-end)]">
              DEVTunes
            </span>
          </h1>
          <p className="text-[var(--text-secondary)]">Music + AI Agent for Independent Developers</p>
        </header>

        <main className="flex-1 pb-8 min-h-0">
          <MobileView />
          <DesktopView />
        </main>
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