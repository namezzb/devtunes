import axios from 'axios';
import type { ParsedTrack, DownloadResult, DownloadProgress } from '../types/musicdl.js';

const MUSICDL_SERVICE_URL = process.env.MUSICDL_SERVICE_URL || 'http://localhost:3002';
const TIMEOUT_MS = 30000;
const PARSE_TIMEOUT_MS = 120000;
const MAX_RETRIES = 2;

interface ParseApiResponse {
  success: boolean;
  data?: Array<{
    song_name: string;
    singers: string;
    album: string;
    duration_s: number;
    cover_url: string;
    identifier: string;
    ext: string;
    download_url: string;
  }>;
  error?: string;
}

interface DownloadApiResponse {
  success: boolean;
  data?: {
    total: number;
    downloaded: number;
    skipped: number;
    failed: number;
    errors: Array<{ song: string; error: string }>;
  };
  error?: string;
}

interface DownloadStatusApiResponse {
  total: number;
  completed: number;
  current_song: string;
  status: string;
}

export class MusicdlService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || MUSICDL_SERVICE_URL;
  }

  async ping(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      return response.data?.status === 'ok';
    } catch {
      return false;
    }
  }

  async parsePlaylist(url: string): Promise<ParsedTrack[]> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await axios.post<ParseApiResponse>(
          `${this.baseUrl}/parse`,
          { url },
          { timeout: PARSE_TIMEOUT_MS }
        );
        const body = response.data;
        if (!body.success || !body.data) {
          throw new Error(body.error || 'Parse failed');
        }
        return body.data.map((item) => ({
          id: item.identifier,
          songName: item.song_name,
          singers: item.singers,
          album: item.album,
          durationS: item.duration_s,
          coverUrl: item.cover_url,
          identifier: item.identifier,
          ext: item.ext,
          downloadUrl: item.download_url,
        }));
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }

  async downloadPlaylist(
    playlistUrl: string,
    targetDir: string,
    songIdentifiers?: string[]
  ): Promise<DownloadResult> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const body: Record<string, unknown> = {
          playlist_url: playlistUrl,
          target_dir: targetDir,
        };
        if (songIdentifiers && songIdentifiers.length > 0) {
          body.song_identifiers = songIdentifiers;
        }
        const response = await axios.post<DownloadApiResponse>(
          `${this.baseUrl}/download`,
          body,
          { timeout: 300000 }
        );
        const respBody = response.data;
        if (!respBody.success || !respBody.data) {
          throw new Error(respBody.error || 'Download failed');
        }
        return respBody.data;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }

  async getDownloadStatus(): Promise<DownloadProgress> {
    const response = await axios.get<DownloadStatusApiResponse>(
      `${this.baseUrl}/download-status`,
      { timeout: 5000 }
    );
    const body = response.data;
    return {
      total: body.total,
      completed: body.completed,
      currentSong: body.current_song,
      status: body.status as DownloadProgress['status'],
    };
  }
}
