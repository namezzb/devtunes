import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { scanLibrary, Track } from '../../services/api';

interface PlaylistImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (url: string) => void;
  onImportLocalTracks?: (tracks: Track[]) => void;
}

type ImportTab = 'local' | 'netease';

const SUPPORTED_URL_PATTERNS = ['163cn.tv', 'y.music.163.com', 'music.163.com'];

const isValidNeteaseUrl = (inputUrl: string): boolean => {
  return SUPPORTED_URL_PATTERNS.some(pattern => inputUrl.includes(pattern));
};

async function resolveUrlViaBackend(url: string): Promise<string> {
  const response = await fetch('/api/playlist/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await response.json();
  if (data.success && data.data.id) {
    return data.data.resolvedUrl || url;
  }
  return url;
}

export function PlaylistImport({ isOpen, onClose, onImport, onImportLocalTracks }: PlaylistImportProps) {
  const [activeTab, setActiveTab] = useState<ImportTab>('local');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  const handleScanLibrary = async () => {
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
  };

  const handleTabChange = (tab: ImportTab) => {
    setActiveTab(tab);
    if (tab === 'local' && localTracks.length === 0 && !scanError && !isScanning) {
      handleScanLibrary();
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'local' && localTracks.length === 0 && !scanError && !isScanning) {
      const timer = setTimeout(() => {
        handleScanLibrary();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleImportLocal = () => {
    if (localTracks.length > 0 && onImportLocalTracks) {
      onImportLocalTracks(localTracks);
      onClose();
    }
  };

  const handleImportNetease = async () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError('请输入歌单链接');
      return;
    }

    if (!isValidNeteaseUrl(trimmedUrl)) {
      setError(
        '请输入有效的网易云音乐歌单链接\n支持格式：\n• https://163cn.tv/xxx\n• https://y.music.163.com/m/playlist?id=xxx\n• https://music.163.com/playlist?id=xxx'
      );
      return;
    }

    setError('');
    setIsResolving(true);

    try {
      let finalUrl = trimmedUrl;
      if (trimmedUrl.includes('163cn.tv') || trimmedUrl.includes('y.music.163.com')) {
        finalUrl = await resolveUrlViaBackend(trimmedUrl);
      }
      onImport(finalUrl);
      setUrl('');
      onClose();
    } catch {
      setError('解析链接失败，请重试');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="导入音乐">
      <div className="space-y-4">
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
          <button
            onClick={() => handleTabChange('local')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'local'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            本地音乐库
          </button>
          <button
            onClick={() => handleTabChange('netease')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'netease'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            网易云歌单
          </button>
        </div>

        {activeTab === 'local' && (
          <div>
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
        )}

        {activeTab === 'netease' && (
          <div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                歌单链接
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError('');
                }}
                placeholder="https://163cn.tv/... 或 https://music.163.com/playlist?id=..."
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--aurora-mid)] focus:ring-1 focus:ring-[var(--aurora-mid)] transition-all"
              />
              {error && <p className="text-[var(--error)] text-sm mt-2 whitespace-pre-line">{error}</p>}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={onClose}>取消</Button>
              <Button variant="gradient" onClick={handleImportNetease} disabled={isResolving}>
                {isResolving ? '解析中...' : '导入'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
