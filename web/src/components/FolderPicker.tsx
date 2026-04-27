import { useEffect, useState, useCallback } from 'react';
import { browse } from '../api';

interface FolderPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}

export function FolderPicker({ open, onClose, onSelect }: FolderPickerProps) {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [parent, setParent] = useState<string | null>(null);
  const [entries, setEntries] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useCallback(async (target?: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await browse(target);
      setCurrentPath(result.path);
      setParent(result.parent);
      setEntries(result.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot read directory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) navigate();
  }, [open, navigate]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-low w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-high">
          <div>
            <p className="font-mono text-[10px] text-on-surface-variant tracking-[0.3em] uppercase">
              SELECT FOLDER TO SCAN
            </p>
            <p className="font-mono text-xs text-primary mt-1 truncate" title={currentPath}>
              {currentPath || 'Loading...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-xs text-on-surface-variant hover:text-primary px-3 py-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <p className="px-5 py-3 font-mono text-xs text-error">{error}</p>
          )}
          {loading && entries.length === 0 && (
            <p className="px-5 py-3 font-mono text-xs text-on-surface-variant">Loading...</p>
          )}

          {parent && parent !== currentPath && (
            <button
              onClick={() => navigate(parent)}
              className="w-full text-left px-5 py-2 font-mono text-sm hover:bg-surface-container-high text-on-surface-variant"
            >
              ../
            </button>
          )}

          {entries.length === 0 && !loading && !error && (
            <p className="px-5 py-3 font-mono text-xs text-on-surface-variant/60">
              No subfolders here. Pick this folder, or go back.
            </p>
          )}

          {entries.map((name) => (
            <button
              key={name}
              onClick={() => navigate(`${currentPath}/${name}`)}
              className="w-full text-left px-5 py-2 font-mono text-sm hover:bg-surface-container-high text-primary"
            >
              {name}/
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-surface-container-high flex justify-end gap-3">
          <button
            onClick={onClose}
            className="font-mono text-xs px-4 py-2 text-on-surface-variant hover:text-primary"
          >
            CANCEL
          </button>
          <button
            onClick={() => { if (currentPath) onSelect(currentPath); }}
            disabled={!currentPath}
            className="btn-neon px-6 py-2 text-xs"
          >
            SCAN_THIS_FOLDER
          </button>
        </div>
      </div>
    </div>
  );
}
