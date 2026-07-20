import { useRef, useCallback } from 'react';
import {
  MAC_OUTPUT_VOLUME_STEPS,
  knobRotationCssDeg,
  tickPositionOnArc,
  volumeStepIndex,
  pointerAngleCwFromTopDeg,
  stepIndexFromPointerAngleCwFromTop,
} from '../utils/volumeSteps';

/**
 * Step dots on the top arc only (225° → CW → 135°), outside the knob.
 * ViewBox units match px: knob Ø112 → r≈56. Radius nudged outward for a bit more gap from the dial edge.
 */
const TICK_DOT_RADIUS = 72;
const TICK_DOT_R = 1.25;

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
  } catch {
    /* optional tick */
  }
}

function VolumeWidget({ volume, onVolumeChange, onDragHandleMouseDown }) {
  const tickCtxRef = useRef(null);
  const wrapRef = useRef(null);
  const dragRef = useRef({ lastStepIndex: -1 });

  const n = MAC_OUTPUT_VOLUME_STEPS - 1;
  const stepIndex = volumeStepIndex(volume);
  const knobRotation = knobRotationCssDeg(stepIndex);

  const playTick = useCallback(() => {
    playTickSound(tickCtxRef);
  }, []);

  const applyStepFromClient = useCallback(
    (clientX, clientY) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const u = pointerAngleCwFromTopDeg(clientX, clientY, cx, cy);
      const newStep = stepIndexFromPointerAngleCwFromTop(u);
      const newVolume = newStep / n;
      if (newStep !== dragRef.current.lastStepIndex) {
        dragRef.current.lastStepIndex = newStep;
        playTick();
      }
      onVolumeChange(newVolume);
    },
    [n, onVolumeChange, playTick]
  );

  const handleVolumePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.button !== 0) return;
    dragRef.current.lastStepIndex = stepIndex;
    applyStepFromClient(e.clientX, e.clientY);

    const onMove = (eMove) => {
      applyStepFromClient(eMove.clientX, eMove.clientY);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const stepDots = Array.from({ length: MAC_OUTPUT_VOLUME_STEPS }, (_, i) => {
    const p = tickPositionOnArc(i, TICK_DOT_RADIUS);
    return (
      <circle
        key={i}
        cx={p.x}
        cy={p.y}
        r={TICK_DOT_R}
        className={
          i <= stepIndex
            ? 'volume-knob-step-dot volume-knob-step-dot--filled'
            : 'volume-knob-step-dot'
        }
      />
    );
  });

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

      <div className="volume-widget-knob-panel">
        <div className="volume-widget-knob-inner">
          <div
            ref={wrapRef}
            className="volume-knob-with-steps"
            onMouseDown={handleVolumePointerDown}
          >
            <svg
              className="volume-knob-step-ring"
              viewBox="-78 -78 156 156"
              aria-hidden
            >
              {stepDots}
            </svg>
            <div
              className="volume-knob-rotate-wrap"
              style={{ transform: `rotate(${knobRotation}deg)` }}
            >
              <div
                className="audio-player-volume-knob"
                role="slider"
                aria-label="Volume"
                aria-valuemin={0}
                aria-valuemax={n}
                aria-valuenow={stepIndex}
                aria-valuetext={`${stepIndex + 1} of ${MAC_OUTPUT_VOLUME_STEPS}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const newStep = Math.min(n, stepIndex + 1);
                    playTick();
                    onVolumeChange(newStep / n);
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const newStep = Math.max(0, stepIndex - 1);
                    playTick();
                    onVolumeChange(newStep / n);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VolumeWidget;
