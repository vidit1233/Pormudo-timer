function Header({ onDragHandleMouseDown }) {
  return (
    <header className="header">
      <h1 className="header-title">POMODORO</h1>
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
  );
}

export default Header;
