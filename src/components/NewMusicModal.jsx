import { useState, useCallback } from 'react';

/**
 * Extract YouTube video ID from URL or raw ID.
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, music.youtube.com/watch?v=ID
 */
export function parseYouTubeVideoId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const beMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (beMatch) return beMatch[1];
  const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vMatch) return vMatch[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

function NewMusicModal({ onClose, onAddToQueue }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setError('');
      const id = parseYouTubeVideoId(input);
      if (!id) {
        setError('Enter a YouTube URL or 11-character video ID');
        return;
      }
      onAddToQueue([id]);
      setInput('');
      onClose();
    },
    [input, onAddToQueue, onClose]
  );

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="new-music-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-music-modal-title"
    >
      <div className="new-music-modal">
        <h2 id="new-music-modal-title" className="new-music-modal-title">
          Add to queue
        </h2>
        <p className="new-music-modal-hint">
          Paste a YouTube or YouTube Music link, or an 11-character video ID.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="new-music-modal-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://music.youtube.com/watch?v=… or video ID"
            autoFocus
            aria-invalid={!!error}
            aria-describedby={error ? 'new-music-error' : undefined}
          />
          {error && (
            <p id="new-music-error" className="new-music-modal-error" role="alert">
              {error}
            </p>
          )}
          <div className="new-music-modal-actions">
            <button type="button" className="new-music-modal-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="new-music-modal-btn new-music-modal-btn--primary">
              Add track
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewMusicModal;
