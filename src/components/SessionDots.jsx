function SessionDots({ completedCount = 0, activeIndex = null, total = 4 }) {
  return (
    <div className="session-dots">
      {Array.from({ length: total }, (_, i) => {
        let state = '';
        if (i === activeIndex) state = 'active';
        else if (i < completedCount) state = 'filled';
        return (
          <span
            key={i}
            className={`session-dot ${state}`}
          />
        );
      })}
      <span className="session-label">sessions</span>
    </div>
  );
}

export default SessionDots;
