function Controls({
  isRunning,
  onStart,
  onReset,
  onSkip,
  focusMinutes,
  onFocusMinutesChange,
  breakMinutes,
  onBreakMinutesChange,
}) {
  const canAdjust = !isRunning;

  return (
    <div className="controls">
      {/* Primary start/pause */}
      <div className="control-group">
        <span className="control-label">space</span>
        <button
          className="btn-hw btn-hw-primary btn-hw-lg"
          onClick={onStart}
        >
          {isRunning ? 'pause' : 'start'}
        </button>
      </div>

      {/* Reset */}
      <div className="control-group">
        <span className="control-label">reset</span>
        <button
          className="btn-hw btn-hw-icon"
          onClick={onReset}
          aria-label="Reset"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      {/* Skip */}
      <div className="control-group">
        <span className="control-label">skip</span>
        <button
          className="btn-hw btn-hw-icon"
          onClick={onSkip}
          aria-label="Skip"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </button>
      </div>

      <div className="controls-sep" />

      <div className="controls-duration-group">
        {/* Focus duration */}
        <div className="control-group">
          <span className="control-label">focus</span>
          <div className="duration-buttons">
            <button
              className="btn-hw btn-hw-sm"
              onClick={() => onFocusMinutesChange(-1)}
              disabled={!canAdjust || focusMinutes <= 5}
              aria-label="Decrease focus"
            >
              −
            </button>
            <span className="duration-value">{String(focusMinutes).padStart(2, '0')}</span>
            <button
              className="btn-hw btn-hw-sm"
              onClick={() => onFocusMinutesChange(1)}
              disabled={!canAdjust || focusMinutes >= 60}
              aria-label="Increase focus"
            >
              +
            </button>
          </div>
        </div>

        {/* Break duration - right next to focus */}
        <div className="control-group">
          <span className="control-label">break</span>
          <div className="duration-buttons">
            <button
              className="btn-hw btn-hw-sm"
              onClick={() => onBreakMinutesChange(-1)}
              disabled={!canAdjust || breakMinutes <= 1}
              aria-label="Decrease break"
            >
              −
            </button>
            <span className="duration-value">{String(breakMinutes).padStart(2, '0')}</span>
            <button
              className="btn-hw btn-hw-sm"
              onClick={() => onBreakMinutesChange(1)}
              disabled={!canAdjust || breakMinutes >= 15}
              aria-label="Increase break"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Controls;
