import type { ISanitizedPlayer } from '../../types/game';
import { theme } from '../../styles/theme';

interface PlayerSidebarProps {
  players: ISanitizedPlayer[];
  currentTurnPlayerId: string | null;
  myPlayerId: string | null;
}

export default function PlayerSidebar({ players, currentTurnPlayerId, myPlayerId }: PlayerSidebarProps) {
  return (
    <div style={css.container}>
      {players.filter((p) => !p.isGhost).map((player) => {
        const isActive = player.id === currentTurnPlayerId;
        const isMe = player.id === myPlayerId;
        return (
          <div
            key={player.id}
            style={{
              ...css.playerRow,
              ...(isActive ? css.activeRow : {}),
              ...(isMe ? css.meRow : {}),
            }}
          >
            <div style={css.indicator}>
              <div style={{
                ...css.dot,
                background: player.isDisconnected ? theme.colors.red : theme.colors.green,
              }} />
            </div>
            <div style={css.info}>
              <div style={css.name}>
                {player.isBot ? '\u{1F916} ' : ''}{player.name}
              </div>
              <div style={css.stats}>
                M: {player.roundState.bid ?? '-'}{'  '}
                P: {player.roundState.tricksWon}
              </div>
            </div>
            <div style={css.score}>{player.score}</div>
          </div>
        );
      })}
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  container: {
    width: 220,
    background: theme.colors.bgLight,
    borderRight: `1px solid ${theme.colors.border}`,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    overflowY: 'auto',
  },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 10px',
    borderRadius: 8,
    gap: 8,
    transition: 'background 0.2s',
  },
  activeRow: {
    background: 'rgba(212, 168, 67, 0.15)',
    border: `1px solid ${theme.colors.gold}`,
  },
  meRow: {
    borderLeft: `3px solid ${theme.colors.gold}`,
  },
  indicator: {
    width: 12,
    display: 'flex',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  stats: {
    fontSize: 11,
    color: theme.colors.textDim,
    marginTop: 2,
  },
  score: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    minWidth: 40,
    textAlign: 'right',
  },
};
