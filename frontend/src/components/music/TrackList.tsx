import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
  url?: string;
  source?: 'local' | 'netease';
}

interface TrackListProps {
  tracks: Track[];
  currentTrackId?: string;
  onTrackSelect: (track: Track) => void;
  onReorder: (tracks: Track[]) => void;
}

interface SortableItemProps {
  track: Track;
  isPlaying: boolean;
  onSelect: () => void;
}

function SortableItem({ track, isPlaying, onSelect }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 group
        ${isDragging
          ? 'opacity-50 ring-2 ring-[var(--aurora-start)] bg-white/5'
          : isPlaying
          ? 'bg-white/10 border border-white/5 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
          : 'hover:bg-white/5 border border-transparent'
        }`}
      onClick={onSelect}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-white transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
        </svg>
      </button>

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
}

export function TrackList({ tracks, currentTrackId, onTrackSelect, onReorder }: TrackListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tracks.findIndex((t) => t.id === active.id);
      const newIndex = tracks.findIndex((t) => t.id === over.id);
      const newTracks = arrayMove(tracks, oldIndex, newIndex);
      onReorder(newTracks);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
          {tracks.map((track) => {
            const isPlaying = track.id === currentTrackId;

            return (
              <SortableItem
                key={track.id}
                track={track}
                isPlaying={isPlaying}
                onSelect={() => onTrackSelect(track)}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
