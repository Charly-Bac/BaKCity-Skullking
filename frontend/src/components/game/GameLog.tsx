import { useRef, useEffect } from 'react';
import type { ILogEntry } from '../../types/game';
import { theme } from '../../styles/theme';

interface GameLogProps {
  logs: ILogEntry[];
}

export default function GameLog({ logs }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div style={css.container}>
      <h3 style={css.title}>Journal</h3>
      <div style={css.logList}>
        {logs.slice(-50).map((log) => (
          <div key={log.id} style={css.logEntry}>
            <span style={css.logTime}>
              {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span style={css.logMsg}>{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  container: {
    width: 250,
    background: theme.colors.bgLight,
    borderLeft: `1px solid ${theme.colors.border}`,
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    padding: '10px 12px',
    fontSize: 13,
    color: theme.colors.textMuted,
    borderBottom: `1px solid ${theme.colors.border}`,
    margin: 0,
  },
  logList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 10px',
  },
  logEntry: {
    display: 'flex',
    gap: 6,
    marginBottom: 4,
    fontSize: 11,
    lineHeight: 1.4,
  },
  logTime: {
    color: theme.colors.textMuted,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  logMsg: {
    color: theme.colors.textDim,
  },
};
