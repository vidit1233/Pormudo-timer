import { useState, useEffect, useRef } from 'react';
import './App.css';
import Header from './components/Header';
import TimerBlock from './components/TimerBlock';
import SoundPills from './components/SoundPills';
import Controls from './components/Controls';
import Todo from './components/Todo';
import VolumeWidget from './components/VolumeWidget';
import useBackgroundSound from './hooks/useBackgroundSound';
import { getSnappedPosition } from './utils/canvasSnap';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function App() {
  const [focusMinutes, setFocusMinutes] = useState(() => {
    const saved = localStorage.getItem('pomodoro-focus');
    const n = saved ? parseInt(saved, 10) : 15;
    return !isNaN(n) ? Math.max(5, Math.min(60, n)) : 15;
  });
  const [breakMinutes, setBreakMinutes] = useState(() => {
    const saved = localStorage.getItem('pomodoro-break');
    const n = saved ? parseInt(saved, 10) : 5;
    return !isNaN(n) ? Math.max(1, Math.min(15, n)) : 5;
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem('pomodoro-focus');
    const n = saved ? parseInt(saved, 10) : 15;
    const mins = !isNaN(n) ? Math.max(5, Math.min(60, n)) : 15;
    return mins * 60;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('focus');
  const [selectedSound, setSelectedSound] = useState(() => {
    return localStorage.getItem('pomodoro-sound') || 'off';
  });

  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('pomodoro-volume');
    if (saved != null) {
      const v = parseFloat(saved);
      if (!isNaN(v) && v >= 0 && v <= 1) return v;
    }
    return 1;
  });

  const [sessionCount, setSessionCount] = useState(0);

  const [todoItems, setTodoItems] = useState(() => {
    const saved = localStorage.getItem('pomodoro-todo-items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}
    }
    return [];
  });

  const [todoPosition, setTodoPosition] = useState(() => {
    const saved = localStorage.getItem('pomodoro-todo-position');
    const defaultBelow = { x: 0, y: 420 };
    if (saved) {
      try {
        const { x, y } = JSON.parse(saved);
        if (typeof x === 'number' && typeof y === 'number') {
          if (y >= -80 && y <= 80) {
            return defaultBelow;
          }
          const w = typeof window !== 'undefined' ? window.innerWidth : 800;
          const h = typeof window !== 'undefined' ? window.innerHeight : 600;
          const maxX = Math.max(0, w / 2 - 100);
          const maxY = Math.max(0, h / 2 - 100);
          return {
            x: Math.max(-maxX, Math.min(maxX, x)),
            y: Math.max(-maxY, Math.min(maxY, y)),
          };
        }
      } catch (_) {}
    }
    return defaultBelow;
  });

  // Card position for drag-to-move (persisted); clamp so card stays on screen when restored
  const [cardPosition, setCardPosition] = useState(() => {
    const saved = localStorage.getItem('pomodoro-card-position');
    if (saved) {
      try {
        const { x, y } = JSON.parse(saved);
        if (typeof x === 'number' && typeof y === 'number') {
          const w = typeof window !== 'undefined' ? window.innerWidth : 800;
          const h = typeof window !== 'undefined' ? window.innerHeight : 600;
          const maxX = Math.max(0, w / 2 - 100);
          const maxY = Math.max(0, h / 2 - 100);
          return {
            x: Math.max(-maxX, Math.min(maxX, x)),
            y: Math.max(-maxY, Math.min(maxY, y)),
          };
        }
      } catch (_) {}
    }
    return { x: 0, y: 0 };
  });

  const [volumeWidgetPosition, setVolumeWidgetPosition] = useState(() => {
    const saved = localStorage.getItem('pomodoro-volume-widget-position');
    const defaultRight = { x: 420, y: 0 };
    if (saved) {
      try {
        const { x, y } = JSON.parse(saved);
        if (typeof x === 'number' && typeof y === 'number') {
          const w = typeof window !== 'undefined' ? window.innerWidth : 800;
          const h = typeof window !== 'undefined' ? window.innerHeight : 600;
          const maxX = Math.max(0, w / 2 - 100);
          const maxY = Math.max(0, h / 2 - 100);
          return {
            x: Math.max(-maxX, Math.min(maxX, x)),
            y: Math.max(-maxY, Math.min(maxY, y)),
          };
        }
      } catch (_) {}
    }
    return defaultRight;
  });

  const cardWrapperRef = useRef(null);
  const todoWrapperRef = useRef(null);
  const volumeWrapperRef = useRef(null);

  /** Console: union of all module rects + padding. When modules snap together, one chassis wraps them. */
  const [consoleBounds, setConsoleBounds] = useState(null);
  /** For each module: which corners lie on the console perimeter (get rounded); inner junctions stay sharp. */
  const [perimeterCorners, setPerimeterCorners] = useState([]);
  const CONSOLE_PADDING = 20;
  const RADIUS_CARD = 18;

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const refs = [cardWrapperRef, todoWrapperRef, volumeWrapperRef];
      const rects = refs.map((r) => r.current?.getBoundingClientRect()).filter(Boolean);
      if (rects.length === 0) return;
      const left = Math.min(...rects.map((r) => r.left));
      const top = Math.min(...rects.map((r) => r.top));
      const right = Math.max(...rects.map((r) => r.right));
      const bottom = Math.max(...rects.map((r) => r.bottom));
      const cLeft = left - CONSOLE_PADDING;
      const cTop = top - CONSOLE_PADDING;
      const cRight = right + CONSOLE_PADDING;
      const cBottom = bottom + CONSOLE_PADDING;
      setConsoleBounds({
        left: cLeft,
        top: cTop,
        width: cRight - cLeft,
        height: cBottom - cTop,
      });
      const tolerance = 2;
      const corners = rects.map((r) => ({
        topLeft: r.top <= cTop + tolerance && r.left <= cLeft + tolerance,
        topRight: r.top <= cTop + tolerance && r.right >= cRight - tolerance,
        bottomLeft: r.bottom >= cBottom - tolerance && r.left <= cLeft + tolerance,
        bottomRight: r.bottom >= cBottom - tolerance && r.right >= cRight - tolerance,
      }));
      setPerimeterCorners(corners);
    });
    return () => cancelAnimationFrame(raf);
  }, [cardPosition, todoPosition, volumeWidgetPosition]);

  /** Clamp position so widget center stays within a reasonable range of viewport center */
  const clampPosition = (pos, margin = 120) => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 800;
    const h = typeof window !== 'undefined' ? window.innerHeight : 600;
    const maxX = Math.max(0, w / 2 - margin);
    const maxY = Math.max(0, h / 2 - margin);
    return {
      x: Math.max(-maxX, Math.min(maxX, pos.x)),
      y: Math.max(-maxY, Math.min(maxY, pos.y)),
    };
  };

  /**
   * Console modules: single source of truth for layout.
   * When two modules come close, they snap edge-to-edge and the chassis wraps them as one unit.
   * To add a new module: add position state + ref here, render its wrapper, and pass createDragHandler(index).
   */
  const consoleModules = [
    { ref: cardWrapperRef, position: cardPosition, setPosition: setCardPosition },
    { ref: todoWrapperRef, position: todoPosition, setPosition: setTodoPosition },
    { ref: volumeWrapperRef, position: volumeWidgetPosition, setPosition: setVolumeWidgetPosition },
  ];

  const createDragHandler = (index) => (clientX, clientY) => {
    const mod = consoleModules[index];
    const startMouse = { x: clientX, y: clientY };
    const startPosition = { ...mod.position };
    const onMove = (e) => {
      mod.setPosition({
        x: startPosition.x + (e.clientX - startMouse.x),
        y: startPosition.y + (e.clientY - startMouse.y),
      });
    };
    const onUp = (e) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const currentPos = {
        x: startPosition.x + (e.clientX - startMouse.x),
        y: startPosition.y + (e.clientY - startMouse.y),
      };
      const rect = mod.ref.current?.getBoundingClientRect();
      const size = rect ? { width: rect.width, height: rect.height } : { width: 380, height: 400 };
      const otherWidgets = consoleModules
        .filter((_, j) => j !== index)
        .map((m) => {
          const r = m.ref.current?.getBoundingClientRect();
          return {
            x: m.position.x,
            y: m.position.y,
            width: r?.width ?? 380,
            height: r?.height ?? 320,
          };
        });
      const snapped = getSnappedPosition(currentPos, size, otherWidgets);
      mod.setPosition(clampPosition(snapped));
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro-focus', String(focusMinutes));
  }, [focusMinutes]);
  useEffect(() => {
    localStorage.setItem('pomodoro-break', String(breakMinutes));
  }, [breakMinutes]);
  useEffect(() => {
    localStorage.setItem('pomodoro-sound', selectedSound);
  }, [selectedSound]);
  useEffect(() => {
    localStorage.setItem('pomodoro-card-position', JSON.stringify(cardPosition));
  }, [cardPosition]);
  useEffect(() => {
    localStorage.setItem('pomodoro-todo-items', JSON.stringify(todoItems));
  }, [todoItems]);
  useEffect(() => {
    localStorage.setItem('pomodoro-todo-position', JSON.stringify(todoPosition));
  }, [todoPosition]);
  useEffect(() => {
    localStorage.setItem('pomodoro-volume', String(Math.max(0, Math.min(1, volume))));
  }, [volume]);
  useEffect(() => {
    localStorage.setItem('pomodoro-volume-widget-position', JSON.stringify(volumeWidgetPosition));
  }, [volumeWidgetPosition]);

  useBackgroundSound(selectedSound, isRunning, volume);

  // Sync timeLeft only when user changes focus/break duration or mode (not when pausing)
  useEffect(() => {
    if (!isRunning) {
      if (mode === 'focus') {
        setTimeLeft(focusMinutes * 60);
      } else {
        setTimeLeft(breakMinutes * 60);
      }
    }
  }, [focusMinutes, breakMinutes, mode]);

  // Countdown effect
  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning]);

  // When timer hits 0, switch mode and reset
  useEffect(() => {
    if (!isRunning || timeLeft !== 0) return;
    if (mode === 'focus') {
      setSessionCount((c) => c + 1);
      setMode('break');
      setTimeLeft(breakMinutes * 60);
    } else {
      setMode('focus');
      setTimeLeft(focusMinutes * 60);
    }
  }, [timeLeft, isRunning, mode, focusMinutes, breakMinutes]);

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      setTimeLeft(focusMinutes * 60);
    } else {
      setTimeLeft(breakMinutes * 60);
    }
  };

  // Space key toggles start/pause (skip when typing in an input)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        setIsRunning((r) => !r);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSkip = () => {
    if (mode === 'focus') {
      setMode('break');
      setTimeLeft(breakMinutes * 60);
    } else {
      setMode('focus');
      setTimeLeft(focusMinutes * 60);
    }
  };

  const handleDragStart = createDragHandler(0);
  const handleTodoDragStart = createDragHandler(1);
  const handleVolumeWidgetDragStart = createDragHandler(2);

  const handleAddTask = (text) => {
    setTodoItems((prev) => [...prev, { id: genId(), type: 'task', text, completed: false }]);
  };

  const handleAddNote = (text) => {
    setTodoItems((prev) => [...prev, { id: genId(), type: 'note', text }]);
  };

  const handleTodoToggle = (id) => {
    setTodoItems((prev) =>
      prev.map((item) => (item.type === 'task' && item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleTodoDelete = (id) => {
    setTodoItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCompleted = () => {
    setTodoItems((prev) => prev.filter((item) => !(item.type === 'task' && item.completed)));
  };

  /** Border radius only on corners that lie on the console perimeter; inner junctions stay sharp (OP-1 style). */
  const getModuleCardStyle = (index) => {
    const c = perimeterCorners[index];
    if (!c) return {};
    return {
      borderTopLeftRadius: c.topLeft ? RADIUS_CARD : 0,
      borderTopRightRadius: c.topRight ? RADIUS_CARD : 0,
      borderBottomLeftRadius: c.bottomLeft ? RADIUS_CARD : 0,
      borderBottomRightRadius: c.bottomRight ? RADIUS_CARD : 0,
    };
  };

  return (
    <div className="app">
      {consoleBounds && (
        <div
          className="console-chassis"
          style={{
            position: 'fixed',
            left: consoleBounds.left,
            top: consoleBounds.top,
            width: consoleBounds.width,
            height: consoleBounds.height,
            zIndex: 5,
          }}
          aria-hidden
        />
      )}
      <div
        ref={cardWrapperRef}
        className="card-wrapper"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${cardPosition.x}px, ${cardPosition.y}px)`,
          zIndex: 10,
        }}
      >
        <div className="card" style={getModuleCardStyle(0)}>
          <Header onDragHandleMouseDown={handleDragStart} />
          <TimerBlock
            timeLeft={formatTime(timeLeft)}
            mode={mode}
          />
          <SoundPills selectedSound={selectedSound} onSelect={setSelectedSound} />
          <Controls
            isRunning={isRunning}
            onStart={() => setIsRunning((r) => !r)}
            onReset={handleReset}
            onSkip={handleSkip}
            focusMinutes={focusMinutes}
            onFocusMinutesChange={(delta) => setFocusMinutes((m) => Math.max(5, Math.min(60, m + delta)))}
            breakMinutes={breakMinutes}
            onBreakMinutesChange={(delta) => setBreakMinutes((m) => Math.max(1, Math.min(15, m + delta)))}
          />
          <div className="card-footer">
            <span className="card-version">PC-25</span>
          </div>
        </div>
      </div>
      <div
        ref={todoWrapperRef}
        className="card-wrapper"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${todoPosition.x}px, ${todoPosition.y}px)`,
          zIndex: 10,
        }}
      >
        <div className="card" style={getModuleCardStyle(1)}>
          <Todo
            items={todoItems}
            onAddTask={handleAddTask}
            onAddNote={handleAddNote}
            onToggle={handleTodoToggle}
            onDelete={handleTodoDelete}
            onClearCompleted={handleClearCompleted}
            onDragHandleMouseDown={handleTodoDragStart}
          />
        </div>
      </div>
      <div
        ref={volumeWrapperRef}
        className="card-wrapper"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${volumeWidgetPosition.x}px, ${volumeWidgetPosition.y}px)`,
          zIndex: 10,
        }}
      >
        <div className="card" style={getModuleCardStyle(2)}>
          <VolumeWidget
            volume={volume}
            onVolumeChange={setVolume}
            onDragHandleMouseDown={handleVolumeWidgetDragStart}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
