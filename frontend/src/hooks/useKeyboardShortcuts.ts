import { useEffect } from 'react';

export interface UseKeyboardShortcutsProps {
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onMute: () => void;
}

export interface KeyboardShortcut {
  key: string;
  description: string;
  modifiers?: string[];
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'Space', description: 'Play / Pause' },
  { key: '←', description: 'Previous track' },
  { key: '→', description: 'Next track' },
  { key: '↑', description: 'Volume up 5%' },
  { key: '↓', description: 'Volume down 5%' },
  { key: 'M', description: 'Mute / Unmute' },
];

function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) {
    return false;
  }
  return target.closest('input, textarea, [contenteditable="true"]') !== null;
}

export function useKeyboardShortcuts(props: UseKeyboardShortcutsProps): void {
  const { onTogglePlay, onNext, onPrev, onVolumeUp, onVolumeDown, onMute } = props;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (isInputElement(event.target)) {
        return;
      }

      switch (event.key) {
        case ' ':
          event.preventDefault();
          onTogglePlay();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onPrev();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onNext();
          break;
        case 'ArrowUp':
          event.preventDefault();
          onVolumeUp();
          break;
        case 'ArrowDown':
          event.preventDefault();
          onVolumeDown();
          break;
        case 'm':
        case 'M':
          event.preventDefault();
          onMute();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onTogglePlay, onNext, onPrev, onVolumeUp, onVolumeDown, onMute]);
}
