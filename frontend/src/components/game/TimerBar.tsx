import { useState, useEffect } from 'react';
import { theme } from '../../styles/theme';

interface TimerBarProps {
  durationMs: number;
  onTimeout?: () => void;
  active: boolean;
}

export default function TimerBar({ durationMs, onTimeout, active }: TimerBarProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active || durationMs <= 0) {
      setElapsed(0);
      return;
    }

    setElapsed(0);
    const startTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const newElapsed = now - startTime;
      if (newElapsed >= durationMs) {
        setElapsed(durationMs);
        clearInterval(interval);
        onTimeout?.();
      } else {
        setElapsed(newElapsed);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [active, durationMs]);

  if (!active || durationMs <= 0) return null;

  const progress = Math.min(1, elapsed / durationMs);
  const remaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
  const isLow = remaining <= 5;

  return (
    <div style={css.container}>
      <div style={css.timeLabel}>{remaining}</div>
      <div style={css.barBg}>
        <div
          style={{
            ...css.barFill,
            width: `${(1 - progress) * 100}%`,
            background: isLow ? theme.colors.red : theme.colors.blue,
          }}
        />
      </div>
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 20px',
  },
  timeLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    minWidth: 40,
    textAlign: 'center',
  },
  barBg: {
    flex: 1,
    height: 8,
    background: theme.colors.bgCard,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.1s linear',
  },
};
