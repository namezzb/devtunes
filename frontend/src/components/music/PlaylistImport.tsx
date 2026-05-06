import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  scanLibrary,
  getLibraryConfig,
  Track,
  importMusicdlPlaylist as apiImportPlaylist,
  downloadMusicdlPlaylist as apiDownloadPlaylist,
  getImportStatus as apiGetImportStatus,
} from '../../services/api';

interface PlaylistImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportLocalTracks?: (tracks: Track[]) => void;
}

function matchTracksLocal(parsed: Track[], local: Track[]): Track[] {
  const localNameMap = new Map<string, Track>();
  for (const t of local) {
    const key = `${t.title.toLowerCase().trim()}||${t.artist.toLowerCase().trim()}`;
    if (!localNameMap.has(key)) {
      localNameMap.set(key, t);
    }
  }

  return parsed.map((p) => {
    const key = `${p.title.toLowerCase().trim()}||${p.artist.toLowerCase().trim()}`;
    const match = localNameMap.get(key);
    return match || p;
  });
}

export function PlaylistImport({ isOpen, onClose, onImportLocalTracks }: PlaylistImportProps) {
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  const [importUrl, setImportUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [importError, setImportError] = useState('');
  const [parsedTracks, setParsedTracks] = useState<Track[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ total: number; completed: number; currentSong: string; status: string } | null>(null);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [libraryPath, setLibraryPath] = useState<string>('');

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleScanLibrary = useCallback(async () => {
    setIsScanning(true);
    setScanError('');
    try {
      const result = await scanLibrary();
      setLocalTracks(result.tracks);
    } catch {
      setScanError('扫描本地音乐库失败，请检查 MUSIC_LIBRARY_PATH 配置');
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && localTracks.length === 0 && !scanError && !isScanning) {
      const timer = setTimeout(() => {
        handleScanLibrary();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, handleScanLibrary, localTracks.length, scanError, isScanning]);

  useEffect(() => {
    if (isOpen && !libraryPath) {
      getLibraryConfig().then((cfg) => setLibraryPath(cfg.musicLibraryPath)).catch(() => {});
    }
  }, [isOpen, libraryPath]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  const handleImportLocal = () => {
    if (localTracks.length > 0 && onImportLocalTracks) {
      onImportLocalTracks(localTracks);
      onClose();
    }
  };

  const handleParsePlaylist = async () => {
    if (!importUrl.trim()) {
      setImportError('请输入网易云音乐歌单链接');
      return;
    }
    setIsParsing(true);
    setImportError('');
    setParsedTracks([]);
    setDownloadComplete(false);
    setDownloadProgress(null);
    try {
      const result = await apiImportPlaylist(importUrl.trim());
      setParsedTracks(result.tracks);
    } catch (err) {
      const message = err instanceof Error ? err.message : '解析失败';
      setImportError(
        message.includes('ECONNREFUSED') || message.includes('fetch')
          ? '音乐下载服务暂不可用，请检查配置'
          : `解析失败: ${message}`
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleStartDownload = async () => {
    setIsDownloading(true);
    setImportError('');
    setDownloadProgress(null);
    setDownloadComplete(false);

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const status = await apiGetImportStatus();
        setDownloadProgress(status);
        if (status.status === 'completed' || status.status === 'failed') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setIsDownloading(false);
          if (status.status === 'completed') {
            setDownloadComplete(true);
          }
        }
      } catch {
        /* empty */
      }
    }, 2000);

    try {
      const targetDir = libraryPath || resolveLibraryPathFallback();
      await apiDownloadPlaylist(importUrl.trim(), targetDir);
    } catch (err) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setIsDownloading(false);
      const message = err instanceof Error ? err.message : '下载失败';
      setImportError(`下载失败: ${message}`);
    }
  };

  const handleImportDownloaded = async () => {
    if (parsedTracks.length > 0 && onImportLocalTracks) {
      const scanResult = await scanLibrary().catch(() => null);
      const localTracksFromScan = scanResult?.tracks || [];
      const matched = matchTracksLocal(parsedTracks, localTracksFromScan);
      onImportLocalTracks(matched);
      onClose();
    }
  };

  function resolveLibraryPathFallback(): string {
    return '/tmp/musicdl-downloads';
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="导入音乐">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-white/70 mb-3">歌单导入</h3>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="粘贴网易云音乐歌单链接..."
              disabled={isParsing || isDownloading}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[var(--aurora-start)]/50 disabled:opacity-50"
            />
            <Button
              variant="gradient"
              size="sm"
              onClick={handleParsePlaylist}
              disabled={isParsing || isDownloading}
            >
              {isParsing ? '解析中...' : '解析歌单'}
            </Button>
          </div>

          {importError && (
            <p className="text-[var(--error)] text-sm mb-3">{importError}</p>
          )}

          {parsedTracks.length > 0 && (
            <div>
              <p className="text-sm text-white/50 mb-3">
                已解析 {parsedTracks.length} 首歌曲
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
                {parsedTracks.slice(0, 20).map((track) => (
                  <div key={track.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt={track.title} className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-xs text-white/30">♪</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{track.title}</p>
                      <p className="text-xs text-white/50 truncate">{track.artist}</p>
                    </div>
                  </div>
                ))}
                {parsedTracks.length > 20 && (
                  <p className="text-xs text-white/30 text-center py-1">
                    还有 {parsedTracks.length - 20} 首...
                  </p>
                )}
              </div>

              {downloadProgress && (
                <div className="mb-3 p-3 rounded-lg bg-white/5">
                  <p className="text-sm text-white/70 mb-1">
                    {downloadProgress.status === 'downloading'
                      ? `正在下载 ${downloadProgress.completed}/${downloadProgress.total}`
                      : downloadProgress.status === 'completed'
                        ? '下载完成'
                        : '部分下载失败'}
                  </p>
                  {downloadProgress.currentSong && downloadProgress.status === 'downloading' && (
                    <p className="text-xs text-white/40 truncate">{downloadProgress.currentSong}</p>
                  )}
                  {downloadProgress.total > 0 && (
                    <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--aurora-start)] to-[var(--aurora-mid)] transition-all duration-500"
                        style={{ width: `${(downloadProgress.completed / downloadProgress.total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3">
                {!downloadComplete ? (
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={handleStartDownload}
                    disabled={isDownloading}
                  >
                    {isDownloading ? '下载中...' : '下载到本地'}
                  </Button>
                ) : (
                  <Button variant="gradient" size="sm" onClick={handleImportDownloaded}>
                    导入全部
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10" />

        <div>
          <h3 className="text-sm font-medium text-white/70 mb-3">本地音乐库</h3>
          {isScanning ? (
            <div className="py-8 text-center text-white/50">扫描中...</div>
          ) : scanError ? (
            <div className="py-4">
              <p className="text-[var(--error)] text-sm mb-4">{scanError}</p>
              <Button variant="ghost" onClick={handleScanLibrary} className="w-full">
                重试
              </Button>
            </div>
          ) : localTracks.length === 0 ? (
            <div className="py-8 text-center text-white/50">
              <p>未找到本地音乐文件</p>
              <p className="text-sm mt-2">设置 MUSIC_LIBRARY_PATH 环境变量以扫描您的音乐目录</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-white/50 mb-3">
                找到 {localTracks.length} 首本地音乐
              </p>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {localTracks.slice(0, 50).map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5"
                  >
                    {track.coverUrl ? (
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center text-xs text-white/30">
                        ♪
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{track.title}</p>
                      <p className="text-xs text-white/50 truncate">{track.artist}</p>
                    </div>
                  </div>
                ))}
                {localTracks.length > 50 && (
                  <p className="text-xs text-white/30 text-center py-2">
                    还有 {localTracks.length - 50} 首...
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="ghost" onClick={onClose}>取消</Button>
                <Button variant="gradient" onClick={handleImportLocal}>
                  导入全部
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
