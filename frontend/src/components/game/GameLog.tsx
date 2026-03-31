import { useRef, useEffect, useState } from 'react';
import type { ILogEntry } from '../../types/game';
import { theme } from '../../styles/theme';

interface GameLogProps {
  logs: ILogEntry[];
}

export default function GameLog({ logs }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, isOpen]);

  return (
    <div style={{ ...css.container, width: isOpen ? 250 : 0 }}>
      <button
        style={{
          ...css.toggleBtn,
          right: isOpen ? 250 : 0,
        }}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Fermer le journal' : 'Ouvrir le journal'}
      >
        {isOpen ? '\u25B6' : '\u25C0'} {!isOpen && 'Journal'}
      </button>
      {isOpen && (
        <>
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
        </>
      )}
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  container: {
    background: theme.colors.bgLight,
    borderLeft: `1px solid ${theme.colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    transition: 'width 0.2s ease',
    overflow: 'hidden',
    flexShrink: 0,
  },
  toggleBtn: {
    position: 'absolute',
    top: 8,
    zIndex: 10,
    transform: 'translateX(-100%)',
    background: theme.colors.bgLight,
    border: `1px solid ${theme.colors.border}`,
    borderRight: 'none',
    borderRadius: '6px 0 0 6px',
    color: theme.colors.textMuted,
    fontSize: 11,
    padding: '6px 8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'right 0.2s ease',
  },
  title: {
    padding: '10px 12px',
    fontSize: 13,
    color: theme.colors.textMuted,
    borderBottom: `1px solid ${theme.colors.border}`,
    margin: 0,
    whiteSpace: 'nowrap',
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
    whiteSpace: 'nowrap',
  },
};
