import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '../ui/Slider';
import { Button } from '../ui/Button';
import { TrackList, Track } from './TrackList';
import { PlaylistImport } from './PlaylistImport';
import { BlackHole } from '../effects/BlackHole';
import { AudioVisualizer } from '../effects/AudioVisualizer';
import { MusicParticles } from '../effects/MusicParticles';
import { toast } from '../ui/Toast';
import { usePlaylist } from '../../hooks/usePlaylist';

const MOCK_TRACKS: Track[] = [
  { id: '1', title: 'Cyberpunk City', artist: 'Neon Dreams', coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop', duration: 214 },
  { id: '2', title: 'Deep Space', artist: 'Stellar', coverUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=200&auto=format&fit=crop', duration: 186 },
  { id: '3', title: 'Lofi Coding', artist: 'Dev Beats', coverUrl: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=200&auto=format&fit=crop', duration: 245 },
  { id: '4', title: 'Synthwave Rider', artist: 'Retro 80s', coverUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=200&auto=format&fit=crop', duration: 198 },
];

export function MusicPlayer() {
  const { playlist: apiPlaylist, tracks, loading, error, importPlaylist } = usePlaylist();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>(MOCK_TRACKS);
  const [playMode, setPlayMode] = useState<'loop' | 'random'>('loop');
  const [clickEffect, setClickEffect] = useState<{x: number, y: number, id: number} | null>(null);

  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(80);

  const displayTracks = tracks.length > 0 ? tracks : playlist;

  useEffect(() => {
    if (displayTracks.length > 0 && !currentTrack) {
      setCurrentTrack(displayTracks[0]);
    }
  }, [displayTracks, currentTrack]);

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
    }
  };

  const handleNext = useCallback(() => {
    if (!currentTrack) return;
    const currentIndex = displayTracks.findIndex(t => t.id === currentTrack.id);
    let nextIndex;

    if (playMode === 'random') {
      nextIndex = Math.floor(Math.random() * displayTracks.length);
    } else {
      nextIndex = (currentIndex + 1) % displayTracks.length;
    }

    setCurrentTrack(displayTracks[nextIndex]);
    setProgress(0);
    setIsPlaying(true);
  }, [currentTrack, displayTracks, playMode]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && currentTrack) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= currentTrack.duration) {
            handleNext();
            return 0;
          }
          return p + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, handleNext]);

  const togglePlay = (e: React.MouseEvent) => {
    if (!isPlaying) {
      const rect = e.currentTarget.getBoundingClientRect();
      setClickEffect({
        x: rect.width / 2,
        y: rect.height / 2,
        id: Date.now()
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handlePrev = () => {
    if (!currentTrack) return;
    const currentIndex = displayTracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + displayTracks.length) % displayTracks.length;
    setCurrentTrack(displayTracks[prevIndex]);
    setProgress(0);
    setIsPlaying(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden relative z-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] border-white/10">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--aurora-start)]/5 via-transparent to-[var(--aurora-end)]/5 pointer-events-none" />

      <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-md relative z-10">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--aurora-start)] drop-shadow-[0_0_8px_var(--aurora-start)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            DEVTunes
          </span>
        </h2>
        <Button variant="ghost" size="sm" onClick={() => setIsImportOpen(true)} className="hover:bg-white/10 text-white/70 hover:text-white transition-colors">
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          导入歌单
        </Button>
      </div>

      <div className="relative h-64 flex items-center justify-center border-b border-white/5 overflow-hidden bg-black/60">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 z-10" />
        <MusicParticles isPlaying={isPlaying} />
        <BlackHole isPlaying={isPlaying} />
        <AudioVisualizer isPlaying={isPlaying} audioElement={audioElement} />
        <audio ref={setAudioElement} src="" className="hidden" />
      </div>

      <div className="p-6 bg-black/40 backdrop-blur-xl relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 group">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
              <motion.img
                src={currentTrack?.coverUrl || ''}
                alt="Cover"
                className="w-full h-full object-cover"
                animate={{
                  rotate: isPlaying ? 360 : 0,
                  scale: isPlaying ? 1.1 : 1
                }}
                transition={{
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 0.5 }
                }}
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--aurora-start)]/20 to-[var(--aurora-end)]/20 mix-blend-overlay" />
              )}
            </div>
            <div>
              <h3 className="text-white font-medium text-lg group-hover:text-[var(--aurora-start)] transition-colors">{currentTrack?.title || 'No track selected'}</h3>
              <p className="text-[var(--text-secondary)] text-sm">{currentTrack?.artist || 'Select a track'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPlayMode(m => m === 'loop' ? 'random' : 'loop')}
              className={`p-2 rounded-lg transition-all duration-300 ${playMode === 'random' ? 'text-[var(--aurora-start)] bg-[var(--aurora-start)]/10 shadow-[0_0_15px_rgba(0,255,200,0.2)]' : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <Slider
            value={progress}
            max={currentTrack?.duration || 0}
            onChange={setProgress}
            formatTooltip={formatTime}
          />
          <div className="flex justify-between text-xs text-[var(--text-muted)] font-mono tracking-wider">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(currentTrack?.duration || 0)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 w-1/4 group">
            <button
              onClick={toggleMute}
              className="p-1 text-[var(--text-muted)] hover:text-white transition-colors"
              title={isMuted ? '取消静音' : '静音'}
            >
              {isMuted ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
            <div className="overflow-hidden transition-all duration-300 ease-out group-hover:w-[120px] w-0">
              <Slider
                value={isMuted ? 0 : volume}
                onChange={(v) => {
                  setVolume(v);
                  if (v > 0) setIsMuted(false);
                }}
                className="w-[120px]"
                formatTooltip={(v) => `${Math.round(isMuted ? prevVolume : v)}%`}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={handlePrev} className="p-2 text-[var(--text-secondary)] hover:text-white hover:scale-110 transition-all">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <div className="relative">
              <button
                onClick={togglePlay}
                className="relative w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--aurora-start)] to-[var(--aurora-mid)] text-white shadow-[0_0_20px_rgba(0,255,200,0.4)] hover:shadow-[0_0_30px_rgba(0,255,200,0.6)] hover:scale-105 transition-all duration-300 z-10"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <AnimatePresence>
                {clickEffect && (
                  <motion.div
                    key={clickEffect.id}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full border-2 border-[var(--aurora-start)] pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </div>

            <button onClick={handleNext} className="p-2 text-[var(--text-secondary)] hover:text-white hover:scale-110 transition-all">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          <div className="w-1/4" />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-hidden flex flex-col relative z-10 bg-black/20">
        <h3 className="text-xs font-medium text-[var(--text-secondary)] mb-3 px-2 uppercase tracking-wider">
          {loading ? '加载中...' : apiPlaylist ? apiPlaylist.name : '当前播放列表'}
        </h3>
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <TrackList
          tracks={displayTracks}
          currentTrackId={currentTrack?.id || ''}
          onTrackSelect={(track) => {
            setCurrentTrack(track);
            setProgress(0);
            setIsPlaying(true);
          }}
          onReorder={(newPlaylist) => {
            setPlaylist(newPlaylist);
          }}
        />
      </div>

      <PlaylistImport
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={async (url) => {
          await importPlaylist(url);
          setIsImportOpen(false);
          toast.success('歌单导入成功');
        }}
      />
    </div>
  );
}