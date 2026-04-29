import React from 'react';

export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
}

interface TrackListProps {
  tracks: Track[];
  currentTrackId?: string;
  onTrackSelect: (track: Track) => void;
}

export function TrackList({ tracks, currentTrackId, onTrackSelect }: TrackListProps) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
      {tracks.map((track) => {
        const isPlaying = track.id === currentTrackId;
        
        return (
          <div
            key={track.id}
            onClick={() => onTrackSelect(track)}
            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 group
              ${isPlaying 
                ? 'bg-white/10 border border-white/5 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                : 'hover:bg-white/5 border border-transparent'
              }`}
          >
            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={track.coverUrl} 
                alt={track.title} 
                className={`w-full h-full object-cover transition-transform duration-500 ${isPlaying ? 'scale-110' : 'group-hover:scale-110'}`}
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="flex gap-0.5 items-end h-3">
                    <div className="w-0.5 bg-[var(--aurora-start)] animate-[bounce_1s_infinite_0ms]" />
                    <div className="w-0.5 bg-[var(--aurora-mid)] animate-[bounce_1s_infinite_200ms]" />
                    <div className="w-0.5 bg-[var(--aurora-end)] animate-[bounce_1s_infinite_400ms]" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium truncate ${isPlaying ? 'text-white' : 'text-[var(--text-primary)] group-hover:text-white'}`}>
                {track.title}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                {track.artist}
              </p>
            </div>
            
            <div className="text-xs text-[var(--text-muted)] font-mono">
              {formatTime(track.duration)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
