import { useState, useRef, useEffect } from 'react';

function Todo({
  items,
  onAddTask,
  onAddNote,
  onToggle,
  onDelete,
  onClearCompleted,
  onDragHandleMouseDown,
}) {
  const [inputText, setInputText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isAdding && inputRef.current) inputRef.current.focus();
  }, [isAdding]);

  const handleAddClick = () => {
    setIsAdding(true);
    setInputText('');
  };

  const saveTask = () => {
    const text = inputText.trim();
    if (text) onAddTask(text);
    setInputText('');
    setIsAdding(false);
  };

  const cancelAdd = () => {
    setInputText('');
    setIsAdding(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTask();
    }
    if (e.key === 'Escape') cancelAdd();
  };

  const handleBlur = () => {
    if (inputText.trim()) saveTask();
    else cancelAdd();
  };

  return (
    <div className="todo-widget">
      <header className="header">
        <h2 className="header-title">TO DO</h2>
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

      <div className="todo-display">
        <ul className="todo-list">
        {isAdding && (
          <li className="todo-item todo-item-inline-add">
            <span className="todo-checkbox" aria-hidden>
              <span className="todo-checkbox-dot" />
            </span>
            <input
              ref={inputRef}
              type="text"
              className="todo-inline-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder="Task…"
              autoComplete="off"
              aria-label="New task"
            />
          </li>
        )}
        {items.map((item) => (
          <li key={item.id} className={`todo-item ${item.type === 'task' && item.completed ? 'completed' : ''}`}>
            {item.type === 'task' ? (
              <button
                type="button"
                className="todo-checkbox"
                onClick={() => onToggle(item.id)}
                aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
                aria-pressed={item.completed}
              >
                <span className={`todo-checkbox-dot ${item.completed ? 'completed' : ''}`} />
              </button>
            ) : (
              <span className="todo-note-bullet" aria-hidden />
            )}
            <span className="todo-item-label">{item.text}</span>
            <button
              type="button"
              className="btn-hw btn-hw-icon todo-delete"
              onClick={() => onDelete(item.id)}
              aria-label="Delete"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </li>
        ))}
        </ul>
      </div>

      <div className="todo-add-row">
        <div className="control-group">
          <span className="control-label">add</span>
          <button type="button" className="btn-hw btn-hw-primary btn-hw-lg todo-add-btn" onClick={handleAddClick}>
            + Add
          </button>
        </div>
        <div className="controls-sep" aria-hidden />
        <div className="control-group">
          <span className="control-label">deleted</span>
          <button
            type="button"
            className="btn-hw btn-hw-icon"
            onClick={onClearCompleted}
            aria-label="Clear completed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Todo;
