import { useState, useRef, useEffect, useMemo } from 'react';

function Todo({
  items,
  onAddTask,
  onAddNote,
  onToggle,
  onReorder,
  onClearCompleted,
  onDragHandleMouseDown,
}) {
  const [inputText, setInputText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [overId, setOverId] = useState(null);
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

  const handleReorderDragStart = (e, item) => {
    e.stopPropagation();
    const li = e.currentTarget.closest('li.todo-item');
    if (li && e.dataTransfer?.setDragImage) {
      const rect = li.getBoundingClientRect();
      e.dataTransfer.setDragImage(li, Math.round(e.clientX - rect.left), Math.round(e.clientY - rect.top));
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
    setDraggingId(item.id);
  };

  const handleReorderDragEnd = () => {
    setDraggingId(null);
    setOverId(null);
  };

  const handleReorderDragOver = (e, itemId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverId(itemId);
  };

  const handleReorderDrop = (e, targetItem) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== targetItem.id) onReorder?.(sourceId, targetItem.id);
    handleReorderDragEnd();
  };

  const { activeItems, completedTasks } = useMemo(() => {
    const active = [];
    const done = [];
    for (const item of items) {
      if (item.type === 'task' && item.completed) done.push(item);
      else active.push(item);
    }
    return { activeItems: active, completedTasks: done };
  }, [items]);

  const renderTodoRow = (item) => (
    <li
      key={item.id}
      className={`todo-item ${item.type === 'task' && item.completed ? 'completed' : ''} ${draggingId === item.id ? 'todo-item--dragging' : ''} ${overId === item.id && draggingId !== item.id ? 'todo-item--drop-target' : ''}`}
      onDragOver={(e) => handleReorderDragOver(e, item.id)}
      onDrop={(e) => handleReorderDrop(e, item)}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOverId((id) => (id === item.id ? null : id));
      }}
    >
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
      <span
        className="todo-reorder-handle"
        draggable
        onDragStart={(e) => handleReorderDragStart(e, item)}
        onDragEnd={handleReorderDragEnd}
        aria-label="Drag to reorder"
        title="Drag to reorder"
      >
        <svg className="todo-reorder-icon" width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <circle cx="3" cy="3" r="1.75" />
          <circle cx="9" cy="3" r="1.75" />
          <circle cx="3" cy="9" r="1.75" />
          <circle cx="9" cy="9" r="1.75" />
        </svg>
      </span>
    </li>
  );

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
        {activeItems.map((item) => renderTodoRow(item))}
        {completedTasks.length > 0 && (
          <li className="todo-completed-section-heading">
            <span>Completed</span>
          </li>
        )}
        {completedTasks.map((item) => renderTodoRow(item))}
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
