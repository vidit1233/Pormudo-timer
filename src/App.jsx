import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import TimerBlock from './components/TimerBlock';
import SoundPills from './components/SoundPills';
import Controls from './components/Controls';
import Todo from './components/Todo';
import AudioPlayerWidget from './components/AudioPlayerWidget';
import VolumeWidget from './components/VolumeWidget';
import QuoteTvWidget from './components/QuoteTvWidget';
import useBackgroundSound from './hooks/useBackgroundSound';
import useYouTubePlayer from './hooks/useYouTubePlayer';
import { getSnappedPosition, isAdjacentToAny, getNearestWidgetSnapPosition } from './utils/canvasSnap';
import { pullMacOsOutputVolume, pushMacOsOutputVolume } from './utils/macosSystemVolume';
import { snapVolumeToSteps } from './utils/volumeSteps';

const MUSIC_STORAGE_KEY = 'pomodoro-music';
const AUDIO_PLAYER_WIDGET_POSITION_KEY = 'pomodoro-audio-player-widget-position';
const VOLUME_WIDGET_POSITION_KEY = 'pomodoro-volume-module-position';
const LEGACY_VOLUME_WIDGET_POSITION_KEY = 'pomodoro-volume-widget-position';
const QUOTE_WIDGET_POSITION_KEY = 'pomodoro-quote-widget-position';

/** Active items and notes first, then completed tasks (matches list UI). */
function normalizeTodoItemsForCompletedSection(items) {
  if (!Array.isArray(items)) return [];
  const active = [];
  const done = [];
  for (const item of items) {
    if (item?.type === 'task' && item.completed) done.push(item);
    else active.push(item);
  }
  return [...active, ...done];
}

function loadMusicState() {
  try {
    const saved = localStorage.getItem(MUSIC_STORAGE_KEY);
    if (saved) {
      const { queue, currentIndex, isPlaying } = JSON.parse(saved);
      if (Array.isArray(queue) && typeof currentIndex === 'number' && typeof isPlaying === 'boolean') {
        return {
          queue,
          currentIndex: Math.max(0, Math.min(currentIndex, queue.length - 1)),
          isPlaying,
        };
      }
    }
  } catch (_) {}
  return { queue: [], currentIndex: 0, isPlaying: false };
}
function initialMusicState() {
  return loadMusicState();
}

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
      if (!isNaN(v) && v >= 0 && v <= 1) return snapVolumeToSteps(v);
    }
    return snapVolumeToSteps(1);
  });

  const [sessionCount, setSessionCount] = useState(0);

  const [todoItems, setTodoItems] = useState(() => {
    const saved = localStorage.getItem('pomodoro-todo-items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return normalizeTodoItemsForCompletedSection(parsed);
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

  const [audioPlayerWidgetPosition, setAudioPlayerWidgetPosition] = useState(() => {
    const saved =
      localStorage.getItem(AUDIO_PLAYER_WIDGET_POSITION_KEY) ??
      localStorage.getItem(LEGACY_VOLUME_WIDGET_POSITION_KEY);
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

  const [volumeWidgetPosition, setVolumeWidgetPosition] = useState(() => {
    const saved = localStorage.getItem(VOLUME_WIDGET_POSITION_KEY);
    const defaultCorner = { x: 420, y: 380 };
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
    return defaultCorner;
  });

  const [quoteWidgetPosition, setQuoteWidgetPosition] = useState(() => {
    const saved = localStorage.getItem(QUOTE_WIDGET_POSITION_KEY);
    const defaultLeft = { x: -440, y: -20 };
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
    return defaultLeft;
  });

  const [musicState, setMusicState] = useState(initialMusicState);
  const { queue: musicQueue, currentIndex: musicCurrentIndex, isPlaying: musicIsPlaying } = musicState;
  const setMusicQueue = (updater) => {
    setMusicState((prev) => ({ ...prev, queue: typeof updater === 'function' ? updater(prev.queue) : updater }));
  };
  const setMusicCurrentIndex = (updater) => {
    setMusicState((prev) => ({
      ...prev,
      currentIndex: typeof updater === 'function' ? updater(prev.currentIndex) : updater,
    }));
  };
  const setMusicIsPlaying = (updater) => {
    setMusicState((prev) => ({
      ...prev,
      isPlaying: typeof updater === 'function' ? updater(prev.isPlaying) : updater,
    }));
  };

  const youtubePlayer = useYouTubePlayer(
    musicQueue,
    musicCurrentIndex,
    musicIsPlaying,
    setMusicQueue,
    setMusicCurrentIndex,
    setMusicIsPlaying
  );

  const cardWrapperRef = useRef(null);
  const todoWrapperRef = useRef(null);
  const audioPlayerWrapperRef = useRef(null);
  const volumeWrapperRef = useRef(null);
  const quoteWrapperRef = useRef(null);
  const volumeCardRef = useRef(null);

  /** Console: union of all module rects + padding. When modules snap together, one chassis wraps them. */
  const [consoleBounds, setConsoleBounds] = useState(null);
  /** For each module: which corners lie on the console perimeter (get rounded); inner junctions stay sharp. */
  const [perimeterCorners, setPerimeterCorners] = useState([]);
  /** For each module: whether it has a widget snapped to its right or bottom (draw black groove line). */
  const [adjacentEdges, setAdjacentEdges] = useState(() => [
    { right: false, bottom: false },
    { right: false, bottom: false },
    { right: false, bottom: false },
    { right: false, bottom: false },
    { right: false, bottom: false },
  ]);
  const CONSOLE_PADDING = 20;
  const RADIUS_CARD = 18;
  const TOUCH_TOLERANCE = 4; /* px: consider widgets "snapped" for the black line */

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const refs = [cardWrapperRef, todoWrapperRef, audioPlayerWrapperRef, volumeWrapperRef, quoteWrapperRef];
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

      /* Adjacency: widget i has a right neighbor if some widget's left edge touches our right (within TOUCH_TOLERANCE) and overlaps vertically */
      const edges = rects.map((r, i) => {
        const hasRight = rects.some(
          (o, j) =>
            j !== i &&
            Math.abs(o.left - r.right) <= TOUCH_TOLERANCE &&
            o.top < r.bottom &&
            o.bottom > r.top
        );
        const hasBottom = rects.some(
          (o, j) =>
            j !== i &&
            Math.abs(o.top - r.bottom) <= TOUCH_TOLERANCE &&
            o.left < r.right &&
            o.right > r.left
        );
        return { right: hasRight, bottom: hasBottom };
      });
      setAdjacentEdges(edges);
    });
    return () => cancelAnimationFrame(raf);
  }, [cardPosition, todoPosition, audioPlayerWidgetPosition, volumeWidgetPosition, quoteWidgetPosition]);

  useEffect(() => {
    const todoWrap = todoWrapperRef.current;
    const volWrap = volumeWrapperRef.current;
    if (!todoWrap || !volWrap) return;
    const sync = () => {
      const volCard = volumeCardRef.current;
      const h = Math.round(todoWrap.getBoundingClientRect().height);
      const maxW = Math.round(volWrap.getBoundingClientRect().width) || 380;
      if (h > 0 && volCard) {
        const side = Math.max(200, Math.min(h, maxW));
        volCard.style.minHeight = `${side}px`;
        volCard.style.height = `${side}px`;
        volCard.style.width = `${side}px`;
      }
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(todoWrap);
    ro.observe(volWrap);
    return () => ro.disconnect();
  }, [todoItems]);

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
    { ref: audioPlayerWrapperRef, position: audioPlayerWidgetPosition, setPosition: setAudioPlayerWidgetPosition },
    { ref: volumeWrapperRef, position: volumeWidgetPosition, setPosition: setVolumeWidgetPosition },
    { ref: quoteWrapperRef, position: quoteWidgetPosition, setPosition: setQuoteWidgetPosition },
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
      const finalPos = isAdjacentToAny(snapped, size, otherWidgets)
        ? snapped
        : getNearestWidgetSnapPosition(currentPos, size, otherWidgets);
      mod.setPosition(clampPosition(finalPos));
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
    localStorage.setItem(AUDIO_PLAYER_WIDGET_POSITION_KEY, JSON.stringify(audioPlayerWidgetPosition));
  }, [audioPlayerWidgetPosition]);
  useEffect(() => {
    localStorage.setItem(VOLUME_WIDGET_POSITION_KEY, JSON.stringify(volumeWidgetPosition));
  }, [volumeWidgetPosition]);
  useEffect(() => {
    localStorage.setItem(QUOTE_WIDGET_POSITION_KEY, JSON.stringify(quoteWidgetPosition));
  }, [quoteWidgetPosition]);
  useEffect(() => {
    localStorage.setItem(
      MUSIC_STORAGE_KEY,
      JSON.stringify({
        queue: musicQueue,
        currentIndex: musicCurrentIndex,
        isPlaying: musicIsPlaying,
      })
    );
  }, [musicQueue, musicCurrentIndex, musicIsPlaying]);

  useBackgroundSound(selectedSound, isRunning, volume);

  useEffect(() => {
    let cancelled = false;
    pullMacOsOutputVolume().then((sys) => {
      if (cancelled || sys == null) return;
      setVolume(snapVolumeToSteps(sys));
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
  const handleAudioPlayerWidgetDragStart = createDragHandler(2);
  const handleVolumeWidgetDragStart = createDragHandler(3);
  const handleQuoteWidgetDragStart = createDragHandler(4);

  const handleVolumeChange = useCallback((v) => {
    const next = snapVolumeToSteps(v);
    setVolume(next);
    pushMacOsOutputVolume(next);
  }, []);

  const handleAddTask = (text) => {
    setTodoItems((prev) => [...prev, { id: genId(), type: 'task', text, completed: false }]);
  };

  const handleAddNote = (text) => {
    setTodoItems((prev) => [...prev, { id: genId(), type: 'note', text }]);
  };

  const handleTodoToggle = (id) => {
    setTodoItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return prev;
      const item = prev[idx];
      if (item.type !== 'task') return prev;
      const toggled = { ...item, completed: !item.completed };
      const rest = prev.filter((i) => i.id !== id);
      if (!toggled.completed) {
        const insertAt = rest.findIndex((i) => i.type === 'task' && i.completed);
        if (insertAt === -1) return [...rest, toggled];
        return [...rest.slice(0, insertAt), toggled, ...rest.slice(insertAt)];
      }
      return [...rest, toggled];
    });
  };

  const handleTodoReorder = (activeId, overId) => {
    setTodoItems((prev) => {
      const from = prev.findIndex((i) => i.id === activeId);
      const to = prev.findIndex((i) => i.id === overId);
      if (from === -1 || to === -1 || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      const active = [];
      const done = [];
      for (const item of next) {
        if (item.type === 'task' && item.completed) done.push(item);
        else active.push(item);
      }
      return [...active, ...done];
    });
  };

  const handleClearCompleted = () => {
    setTodoItems((prev) => prev.filter((item) => !(item.type === 'task' && item.completed)));
  };

  /** Corner radius on every widget; black groove line only on edges where another widget is snapped. */
  const getModuleCardStyle = (index) => {
    const edge = adjacentEdges[index];
    const style = {
      borderTopLeftRadius: RADIUS_CARD,
      borderTopRightRadius: RADIUS_CARD,
      borderBottomLeftRadius: RADIUS_CARD,
      borderBottomRightRadius: RADIUS_CARD,
    };
    if (edge?.right) style.borderRight = '2px solid #0d0d0d';
    if (edge?.bottom) style.borderBottom = '2px solid #0d0d0d';
    return style;
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
        <div className="card card--tv" style={getModuleCardStyle(0)}>
          <div className="tv-screen-section">
            <Header onDragHandleMouseDown={handleDragStart} />
            <div className="tv-bezel">
              <TimerBlock
                timeLeft={formatTime(timeLeft)}
                mode={mode}
              />
            </div>
          </div>
          <div className="controls-hw-panel">
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
            onReorder={handleTodoReorder}
            onClearCompleted={handleClearCompleted}
            onDragHandleMouseDown={handleTodoDragStart}
          />
        </div>
      </div>
      <div
        ref={audioPlayerWrapperRef}
        className="card-wrapper"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${audioPlayerWidgetPosition.x}px, ${audioPlayerWidgetPosition.y}px)`,
          zIndex: 10,
        }}
      >
        <div className="card" style={getModuleCardStyle(2)}>
          <div ref={youtubePlayer.playerContainerRef} className="youtube-player-hidden" aria-hidden />
          <AudioPlayerWidget
            onDragHandleMouseDown={handleAudioPlayerWidgetDragStart}
            musicIsPlaying={musicIsPlaying}
            musicCurrentTitle={youtubePlayer.currentTitle}
            musicCurrentThumbnail={youtubePlayer.currentThumbnail}
            musicHasTrack={youtubePlayer.hasTrack}
            onMusicPlay={youtubePlayer.play}
            onMusicPause={youtubePlayer.pause}
            onAddToQueue={(videoIds) => {
              setMusicQueue((q) => [...q, ...videoIds]);
              if (musicQueue.length === 0 && videoIds.length > 0) {
                setMusicCurrentIndex(0);
                setMusicIsPlaying(true);
              }
            }}
          />
        </div>
      </div>
      <div
        ref={volumeWrapperRef}
        className="card-wrapper card-wrapper--volume-square"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${volumeWidgetPosition.x}px, ${volumeWidgetPosition.y}px)`,
          zIndex: 10,
        }}
      >
        <div ref={volumeCardRef} className="card card--volume-module" style={getModuleCardStyle(3)}>
          <VolumeWidget
            volume={volume}
            onVolumeChange={handleVolumeChange}
            onDragHandleMouseDown={handleVolumeWidgetDragStart}
          />
        </div>
      </div>
      <div
        ref={quoteWrapperRef}
        className="card-wrapper"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${quoteWidgetPosition.x}px, ${quoteWidgetPosition.y}px)`,
          zIndex: 10,
        }}
      >
        <div className="card" style={getModuleCardStyle(4)}>
          <QuoteTvWidget onDragHandleMouseDown={handleQuoteWidgetDragStart} />
        </div>
      </div>
    </div>
  );
}

export default App;
