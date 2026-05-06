export interface ParsedTrack {
  id: string;
  songName: string;
  singers: string;
  album: string;
  durationS: number;
  coverUrl: string;
  identifier: string;
  ext: string;
  downloadUrl: string;
}

export interface DownloadResult {
  total: number;
  downloaded: number;
  skipped: number;
  failed: number;
  errors: Array<{ song: string; error: string }>;
}

export interface DownloadProgress {
  total: number;
  completed: number;
  currentSong: string;
  status: 'idle' | 'downloading' | 'completed' | 'failed';
}
