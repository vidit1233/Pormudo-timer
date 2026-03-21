import { useRef, useCallback } from 'react';
import NewMusicModal from './NewMusicModal';

const NUM_STEPS = 28;
const MIN_ANGLE = -90;
const MAX_ANGLE = 90;
const PIXELS_PER_STEP = 10;

function playTickSound(ctxRef) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = ctxRef.current || new Ctx();
    if (!ctxRef.current) ctxRef.current = ctx;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  } catch (_) {}
}

function VolumeWidget({
  volume,
  onVolumeChange,
  onDragHandleMouseDown,
  musicIsPlaying = false,
  musicCurrentTitle = '',
  musicCurrentThumbnail = null,
  musicHasTrack = false,
  onMusicPlay,
  onMusicPause,
  onMusicPrev,
  onMusicNext,
  onOpenNewMusic,
  newMusicModalOpen = false,
  onAddToQueue,
}) {
  const tickCtxRef = useRef(null);
  const knobRef = useRef(null);
  const dragRef = useRef({ startX: 0, startStepIndex: 0, lastStepIndex: -1 });

  const stepIndex = Math.round(volume * (NUM_STEPS - 1));
  const rotation = MIN_ANGLE + (volume * (MAX_ANGLE - MIN_ANGLE));

  const playTick = useCallback(() => {
    playTickSound(tickCtxRef);
  }, []);

  const handleKnobMouseDown = (e) => {
    e.preventDefault();
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startStepIndex: stepIndex,
      lastStepIndex: stepIndex,
    };
    const onMove = (eMove) => {
      const deltaX = eMove.clientX - dragRef.current.startX;
      const stepDelta = Math.round(deltaX / PIXELS_PER_STEP);
      let newStep = dragRef.current.startStepIndex + stepDelta;
      newStep = Math.max(0, Math.min(NUM_STEPS - 1, newStep));
      const newVolume = newStep / (NUM_STEPS - 1);
      if (newStep !== dragRef.current.lastStepIndex) {
        dragRef.current.lastStepIndex = newStep;
        playTick();
      }
      onVolumeChange(newVolume);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="volume-widget">
      <header className="header">
        <h2 className="header-title">VOLUME</h2>
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
        <div className="turntable-widget-base">
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
          <div className="turntable-tonearm" aria-hidden />

          <div className="turntable-knob-wrap">
            <div
              ref={knobRef}
              className="volume-knob"
              role="slider"
              aria-label="Volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(volume * 100)}
              tabIndex={0}
              style={{ transform: `rotate(${rotation}deg)` }}
              onMouseDown={handleKnobMouseDown}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  const newStep = Math.min(NUM_STEPS - 1, stepIndex + 1);
                  playTick();
                  onVolumeChange(newStep / (NUM_STEPS - 1));
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  const newStep = Math.max(0, stepIndex - 1);
                  playTick();
                  onVolumeChange(newStep / (NUM_STEPS - 1));
                }
              }}
            />
          </div>

          <div className="turntable-control-panel">
            <button
              type="button"
              className="turntable-control-btn"
              aria-label="Previous track"
              onClick={onMusicPrev}
              disabled={!musicHasTrack}
            >
              ‹‹
            </button>
            <button
              type="button"
              className="turntable-control-btn"
              aria-label={musicIsPlaying ? 'Pause' : 'Play'}
              onClick={musicIsPlaying ? onMusicPause : onMusicPlay}
              disabled={!musicHasTrack}
            >
              {musicIsPlaying ? '‖' : '▶'}
            </button>
            <button
              type="button"
              className="turntable-control-btn"
              aria-label="Next track"
              onClick={onMusicNext}
              disabled={!musicHasTrack}
            >
              ››
            </button>
          </div>

          {onOpenNewMusic && (
            <button
              type="button"
              className="turntable-new-music-btn"
              aria-label="New music"
              onClick={() => onOpenNewMusic(true)}
            >
              +
            </button>
          )}
        </div>

        <p className="volume-widget-track-name" title={musicCurrentTitle}>
          {musicHasTrack ? musicCurrentTitle || 'Loading…' : 'No track'}
        </p>
        {onOpenNewMusic && (
          <button
            type="button"
            className="volume-widget-new-music-link"
            onClick={() => onOpenNewMusic(true)}
          >
            New music
          </button>
        )}
      </section>

      {newMusicModalOpen && onOpenNewMusic && onAddToQueue && (
        <NewMusicModal
          onClose={() => onOpenNewMusic(false)}
          onAddToQueue={onAddToQueue}
        />
      )}
    </div>
  );
}

export default VolumeWidget;
