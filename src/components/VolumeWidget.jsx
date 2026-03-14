import { useRef, useCallback } from 'react';

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

function VolumeWidget({ volume, onVolumeChange, onDragHandleMouseDown }) {
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
      <div className="volume-knob-wrap">
        <span className="volume-knob-label volume-knob-label-low" aria-hidden>−</span>
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
        <span className="volume-knob-label volume-knob-label-high" aria-hidden>+</span>
      </div>
    </div>
  );
}

export default VolumeWidget;
