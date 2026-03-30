import type { ISanitizedGame } from '../../types/game';
import { theme } from '../../styles/theme';

interface TopBarProps {
  game: ISanitizedGame;
}

export default function TopBar({ game }: TopBarProps) {
  const totalBid = game.players
    .filter((p) => !p.isGhost)
    .reduce((sum, p) => sum + (p.roundState.bid ?? 0), 0);

  const trickNumber = game.currentRound
    ? game.currentRound.tricks.length
    : 0;

  return (
    <div style={css.container}>
      <span style={css.item}>
        MISES: <strong>{totalBid}</strong>
      </span>
      <span style={css.separator}>/</span>
      <span style={css.item}>
        MANCHE: <strong>{game.roundNumber}</strong>/10
      </span>
      <span style={css.separator}>/</span>
      <span style={css.item}>
        PLI: <strong>{trickNumber}</strong>/{game.roundNumber}
      </span>
      {game.isDebugMode && (
        <span style={css.debugBadge}>DEBUG</span>
      )}
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '10px 20px',
    background: theme.colors.bgLight,
    borderBottom: `1px solid ${theme.colors.border}`,
    fontSize: 14,
    color: theme.colors.textDim,
  },
  item: {
    color: theme.colors.textDim,
  },
  separator: {
    color: theme.colors.textMuted,
  },
  debugBadge: {
    background: theme.colors.red,
    color: '#fff',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 12,
  },
};
