import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface PlaylistImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (url: string) => void;
}

export function PlaylistImport({ isOpen, onClose, onImport }: PlaylistImportProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    if (!url.trim()) {
      setError('请输入歌单链接');
      return;
    }
    
    if (!url.includes('music.163.com/playlist')) {
      setError('请输入有效的网易云音乐歌单链接');
      return;
    }
    
    setError('');
    onImport(url);
    setUrl('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="导入网易云歌单">
      <div className="space-y-4">
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
            placeholder="https://music.163.com/playlist?id=..."
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--aurora-mid)] focus:ring-1 focus:ring-[var(--aurora-mid)] transition-all"
          />
          {error && <p className="text-[var(--error)] text-sm mt-2">{error}</p>}
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button variant="gradient" onClick={handleImport}>导入</Button>
        </div>
      </div>
    </Modal>
  );
}
