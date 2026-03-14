function TimerBlock({ timeLeft = '15:00', mode = 'focus' }) {
  return (
    <div className="timer-block">
      <div className="timer-block-scanlines" aria-hidden="true" />
      <div className="timer-task-section">
        <div className="timer-task-heading">
          <p className="timer-task-prompt">What are you working on?</p>
        </div>
        <p className="timer-task-tags">track · task · intention</p>
      </div>

      <div className="timer-display-row">
        <span className="timer-display">{timeLeft}</span>
        <div className="timer-mode-labels">
          <div className={`mode-label ${mode === 'focus' ? 'active' : ''}`}>
            <span className="mode-dot" />
            focus
          </div>
          <div className={`mode-label ${mode === 'break' ? 'active' : ''}`}>
            <span className="mode-dot" />
            break
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimerBlock;
