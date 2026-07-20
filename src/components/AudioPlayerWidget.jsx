import { useState, useRef, useEffect } from 'react';
import { parseYouTubeVideoId } from '../utils/youtubeVideoId';

function AudioPlayerWidget({
  onDragHandleMouseDown,
  musicIsPlaying = false,
  musicCurrentTitle = '',
  musicCurrentThumbnail = null,
  musicHasTrack = false,
  onMusicPlay,
  onMusicPause,
  onAddToQueue,
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [songLink, setSongLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const linkInputRef = useRef(null);

  useEffect(() => {
    if (linkOpen) linkInputRef.current?.focus();
  }, [linkOpen]);

  const handlePrimaryClick = () => {
    if (!linkOpen) {
      setLinkError('');
      setLinkOpen(true);
      return;
    }
    setLinkError('');
    const id = parseYouTubeVideoId(songLink);
    if (!id) {
      setLinkError('Paste a valid YouTube or YouTube Music link');
      return;
    }
    onAddToQueue?.([id]);
    setSongLink('');
    setLinkOpen(false);
    onMusicPlay?.();
  };

  return (
    <div className="audio-player-widget">
      <header className="header">
        <h2 className="header-title">AUDIO PLAYER</h2>
        <button
          type="button"
          className="header-grid-icon"
          aria-label="Drag to move"
          onMouseDown={(e) => {
            e.preventDefault();
            onDragHandleMouseDown?.(e.clientX, e.clientY);
          }}
        >
          <span className="grid-dot" />
          <span className="grid-dot" />
          <span className="grid-dot" />
          <span className="grid-dot" />
          <span className="grid-dot" />
          <span className="grid-dot" />
          <span className="grid-dot" />
          <span className="grid-dot" />
          <span className="grid-dot" />
        </button>
      </header>
      <section className="turntable-widget" aria-label="Music player">
        <div className="turntable-widget-base turntable-deck">
          <div className="turntable-platter" aria-hidden>
            <div className="turntable-mat" />
            <div className="turntable-vinyl-wrap">
              <div className={`vinyl-disc ${musicIsPlaying ? 'vinyl-disc--playing' : ''}`}>
                <div className="vinyl-grooves" />
                <div className="vinyl-label">
                  {musicCurrentThumbnail ? (
                    <img src={musicCurrentThumbnail} alt="" className="vinyl-label-art" />
                  ) : (
                    <span className="vinyl-label-placeholder">Album</span>
                  )}
                </div>
              </div>
            </div>
            <div className="turntable-spindle" />
          </div>

          <div className="turntable-tonearm-mount">
            <div className="tonearm-deck-reflection" aria-hidden />
            <div className="tonearm-rest-cradle" aria-hidden />
            <button
              type="button"
              className={`tonearm-interact ${musicIsPlaying ? 'tonearm-interact--playing' : ''}`}
              aria-label={
                !musicHasTrack
                  ? 'Add a track to use the tonearm'
                  : musicIsPlaying
                    ? 'Lift tonearm — pause'
                    : 'Lower tonearm onto record — play'
              }
              aria-pressed={musicIsPlaying}
              disabled={!musicHasTrack}
              onClick={() => {
                if (musicIsPlaying) onMusicPause?.();
                else onMusicPlay?.();
              }}
            >
              <span className="tonearm-pivot-base">
                <span className="tonearm-anti-skate" aria-hidden />
                <span className="tonearm-cue-lever" aria-hidden />
                <span className="tonearm-gimbal" aria-hidden />
              </span>
              <span
                className={`tonearm-swing ${musicIsPlaying ? 'tonearm-swing--on-record' : ''}`}
                aria-hidden
              >
                <span className="tonearm-counterweight" aria-hidden />
                <span className="tonearm-tube" aria-hidden />
                <span className="tonearm-headshell" aria-hidden>
                  <span className="tonearm-finger-lift" aria-hidden />
                  <span className="tonearm-cartridge" aria-hidden>
                    <span className="tonearm-stylus" aria-hidden />
                  </span>
                </span>
              </span>
            </button>
          </div>
        </div>

        <p className="audio-player-widget-track-name" title={musicCurrentTitle}>
          {musicHasTrack ? musicCurrentTitle || 'Loading…' : 'No track'}
        </p>
        {onAddToQueue && (
          <div
            className={`audio-player-add-block${linkError ? ' audio-player-add-block--has-error' : ''}`}
          >
            <div className={`audio-player-add-track ${linkOpen ? 'audio-player-add-track--open' : ''}`}>
              <div
                className={`audio-player-link-stack ${linkOpen ? 'audio-player-link-stack--open' : ''}`}
                aria-hidden={!linkOpen}
              >
                <div className="audio-player-link-field">
                  <input
                    ref={linkInputRef}
                    type="text"
                    className="audio-player-link-input"
                    value={songLink}
                    onChange={(e) => {
                      setSongLink(e.target.value);
                      if (linkError) setLinkError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handlePrimaryClick();
                      }
                    }}
                    placeholder="paste your song link"
                    tabIndex={linkOpen ? 0 : -1}
                  />
                  {linkError && (
                    <p className="audio-player-link-error" role="alert">
                      {linkError}
                    </p>
                  )}
                </div>
              </div>
              <div className="control-group audio-player-add-control">
                <span className="control-label">{linkOpen ? 'play' : 'add'}</span>
                <button
                  type="button"
                  className="btn-hw btn-hw-primary btn-hw-lg todo-add-btn"
                  aria-label={linkOpen ? 'Play from link' : 'Add music'}
                  aria-expanded={linkOpen}
                  onClick={handlePrimaryClick}
                >
                  {linkOpen ? 'play' : '+ add'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default AudioPlayerWidget;
