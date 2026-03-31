import type { ISanitizedPlayer } from '../../types/game';
import { theme } from '../../styles/theme';

interface PlayerSidebarProps {
  players: ISanitizedPlayer[];
  currentTurnPlayerId: string | null;
  myPlayerId: string | null;
  firstPlayerId?: string | null;
  phase?: string;
  discardCount?: number;
}

export default function PlayerSidebar({ players, currentTurnPlayerId, myPlayerId, firstPlayerId, phase, discardCount = 0 }: PlayerSidebarProps) {
  const isBidding = phase === 'bidding';

  const leaderId = firstPlayerId ?? null;

  return (
    <div style={css.container}>
      <div style={css.playerList}>
      {players.filter((p) => !p.isGhost).map((player) => {
        const isActive = player.id === currentTurnPlayerId;
        const isMe = player.id === myPlayerId;
        const isLeader = player.id === leaderId;
        const hasBid = player.roundState.bid !== null;
        return (
          <div
            key={player.id}
            style={{
              ...css.playerRow,
              ...(isActive ? css.activeRow : {}),
              ...(isMe ? css.meRow : {}),
            }}
            data-player-id={player.id}
          >
            <div style={css.indicator}>
              {isLeader ? (
                <div style={css.leaderBadge}>{'\u2605'}</div>
              ) : (
                <div style={{
                  ...css.dot,
                  background: player.isDisconnected ? theme.colors.red : theme.colors.green,
                }} />
              )}
            </div>
            <div style={css.info}>
              <div style={css.name}>
                {player.isBot ? '\u{1F916} ' : ''}{player.name}
              </div>
              <div style={css.statsRow}>
                <div style={css.statBadge}>
                  <span style={css.statLabel}>Mise</span>
                  <span style={css.statValue}>
                    {isBidding && !isMe ? (hasBid ? '\u2713' : '-') : (player.roundState.bid ?? '-')}
                  </span>
                </div>
                <div style={{
                  ...css.statBadge,
                  ...(player.roundState.bid !== null && player.roundState.tricksWon > (player.roundState.bid ?? 0)
                    ? css.statOver
                    : player.roundState.bid !== null && player.roundState.tricksWon === (player.roundState.bid ?? 0)
                      ? css.statExact
                      : {}),
                }}>
                  <span style={css.statLabel}>Plis</span>
                  <span style={css.statValue}>{player.roundState.tricksWon}</span>
                </div>
              </div>
            </div>
            <div style={css.score}>{player.score}</div>
          </div>
        );
      })}
      </div>

      {/* Discard pile */}
      {discardCount > 0 && (
        <div style={css.discardRow} data-discard-pile>
          <span style={css.discardIcon}>{'\u2620'}</span>
          <span style={css.discardText}>D&eacute;fausse</span>
          <span style={css.discardCount}>{discardCount}</span>
        </div>
      )}
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  container: {
    width: 220,
    background: theme.colors.bgLight,
    borderRight: `1px solid ${theme.colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  playerList: {
    flex: 1,
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
    width: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  leaderBadge: {
    fontSize: 16,
    color: theme.colors.gold,
    lineHeight: 1,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginBottom: 4,
  },
  statsRow: {
    display: 'flex',
    gap: 6,
  },
  statBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: theme.colors.bgCard,
    borderRadius: 6,
    padding: '2px 8px',
    minWidth: 36,
  },
  statLabel: {
    fontSize: 8,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    lineHeight: 1.2,
  },
  statExact: {
    background: 'rgba(39, 174, 96, 0.2)',
    borderColor: theme.colors.green,
  },
  statOver: {
    background: 'rgba(192, 57, 43, 0.2)',
    borderColor: theme.colors.red,
  },
  score: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    minWidth: 40,
    textAlign: 'right',
  },
  discardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    borderTop: `1px solid ${theme.colors.border}`,
    background: 'rgba(127, 29, 29, 0.15)',
    flexShrink: 0,
  },
  discardIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  discardText: {
    fontSize: 12,
    color: theme.colors.textDim,
    flex: 1,
  },
  discardCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.red,
  },
};
