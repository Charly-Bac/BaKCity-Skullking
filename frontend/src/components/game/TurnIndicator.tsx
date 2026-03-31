import { useState, useEffect } from 'react';

interface TurnIndicatorProps {
  active: boolean;
  durationMs: number;
  onTimeout?: () => void;
}

export default function TurnIndicator({ active, durationMs, onTimeout }: TurnIndicatorProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }

    if (durationMs <= 0) {
      setProgress(1);
      return;
    }

    setProgress(1);
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = 1 - elapsed / durationMs;
      if (remaining <= 0) {
        setProgress(0);
        clearInterval(interval);
        onTimeout?.();
      } else {
        setProgress(remaining);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [active, durationMs]);

  if (!active) return null;

  const hasTimer = durationMs > 0;
  const isLow = hasTimer && progress < 0.2;
  const remaining = hasTimer ? Math.max(0, Math.ceil(progress * durationMs / 1000)) : null;
  const halfWidth = hasTimer ? `${progress * 50}%` : '50%';

  const gradient = isLow
    ? 'linear-gradient(90deg, transparent 0%, #c0392b 40%, #e74c3c 50%, #c0392b 60%, transparent 100%)'
    : 'linear-gradient(90deg, transparent 0%, #0a1628 10%, #1a3a5c 30%, #2980b9 45%, #5dade2 50%, #2980b9 55%, #1a3a5c 70%, #0a1628 90%, transparent 100%)';

  return (
    <div style={css.container}>
      {remaining !== null && (
        <div style={css.timeLabel}>{remaining}</div>
      )}
      <div style={css.barBg}>
        <div
          style={{
            ...css.barFill,
            width: hasTimer ? `${progress * 100}%` : '100%',
            background: gradient,
            transition: hasTimer ? 'width 0.05s linear' : 'none',
          }}
        />
      </div>
      {remaining !== null && (
        <div style={css.timeLabel}>{remaining}</div>
      )}
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    flexShrink: 0,
  },
  barBg: {
    flex: 1,
    height: 6,
    background: '#0a0e17',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
  },
  barFill: {
    height: '100%',
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#5dade2',
    minWidth: 24,
    textAlign: 'center',
    padding: '0 4px',
  },
};
