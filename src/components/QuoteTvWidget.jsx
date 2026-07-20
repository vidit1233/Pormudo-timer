import { useState, useEffect, useCallback } from 'react';

const QUOTES = [
  'One focused hour beats a day of distraction.',
  'Small steps every session add up to big outcomes.',
  'Rest is part of the work. Breaks are not optional.',
  'Start messy. Refine with each pomodoro.',
  'The timer is a promise to your future self.',
  'Attention is finite. Spend it on purpose.',
  'Done is better than perfect — then improve.',
  'Close the tabs. Open one task. Begin.',
  'ものづくりは、静かな集中から始まる。',
  'Ship the slice. Celebrate. Repeat.',
  'Your only competitor is yesterday’s drift.',
  'Boredom before breakthrough. Stay with it.',
  'Protect deep work like a meeting with yourself.',
  'Progress whispers; distraction shouts. Listen closer.',
];

function pickIndex(exclude) {
  if (QUOTES.length <= 1) return 0;
  let i;
  do {
    i = Math.floor(Math.random() * QUOTES.length);
  } while (i === exclude);
  return i;
}

function QuoteTvWidget({ onDragHandleMouseDown }) {
  const [quoteIndex, setQuoteIndex] = useState(() => pickIndex(-1));
  const [displayed, setDisplayed] = useState('');
  const fullText = QUOTES[quoteIndex];

  useEffect(() => {
    if (displayed.length >= fullText.length) return;
    const delay = fullText[displayed.length] === ' ' ? 18 : 28;
    const t = window.setTimeout(() => {
      setDisplayed(fullText.slice(0, displayed.length + 1));
    }, delay);
    return () => window.clearTimeout(t);
  }, [displayed, fullText]);

  const nextQuote = useCallback(() => {
    setQuoteIndex((prev) => pickIndex(prev));
    setDisplayed('');
  }, []);

  const isTyping = displayed.length < fullText.length;

  return (
    <div className="quote-tv-widget">
      <header className="header">
        <h2 className="header-title">QUOTE TV</h2>
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

      <div className="timer-block timer-block--quote-crt">
        <div className="quote-tv-vignette" aria-hidden="true" />
        <div className="quote-tv-flicker" aria-hidden="true" />
        <div className="quote-tv-body">
          <p className="quote-tv-channel">BROADCAST // CH-02</p>
          <p className="quote-tv-text" aria-live="polite">
            <span className="quote-tv-chevron">&gt;</span> {displayed}
            <span className={`quote-tv-cursor ${isTyping ? 'quote-tv-cursor--typing' : ''}`} aria-hidden="true" />
          </p>
        </div>
      </div>

      <div className="todo-add-row quote-tv-add-row">
        <div className="control-group">
          <span className="control-label">refresh</span>
          <button
            type="button"
            className="btn-hw btn-hw-primary btn-hw-lg todo-add-btn quote-tv-new-quote-btn"
            onClick={nextQuote}
            aria-label="Refresh quote"
          >
            <span className="quote-tv-refresh-btn-inner">
              <svg
                className="quote-tv-refresh-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
              <span className="quote-tv-refresh-label">refresh</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuoteTvWidget;
