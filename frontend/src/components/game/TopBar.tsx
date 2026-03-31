import type { ISanitizedGame } from '../../types/game';
import { theme } from '../../styles/theme';

interface TopBarProps {
  game: ISanitizedGame;
  isMobile?: boolean;
}

export default function TopBar({ game, isMobile }: TopBarProps) {
  const totalBid = game.players
    .filter((p) => !p.isGhost)
    .reduce((sum, p) => sum + (p.roundState.bid ?? 0), 0);

  const trickNumber = game.currentRound
    ? game.currentRound.tricks.length
    : 0;

  return (
    <div style={{ ...css.container, padding: isMobile ? '6px 10px' : '10px 20px', fontSize: isMobile ? 12 : 14 }}>
      <span style={css.item}>
        {isMobile ? 'M:' : 'MISES:'} <strong>{totalBid}</strong>
      </span>
      <span style={css.separator}>/</span>
      <span style={css.item}>
        {isMobile ? '' : 'MANCHE: '}<strong>{game.roundNumber}</strong>/10
      </span>
      <span style={css.separator}>/</span>
      <span style={css.item}>
        {isMobile ? '' : 'PLI: '}<strong>{trickNumber}</strong>/{game.roundNumber}
      </span>
      {game.isDebugMode && (
        <span style={css.debugBadge}>DBG</span>
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
    background: theme.colors.bgLight,
    borderBottom: `1px solid ${theme.colors.border}`,
    color: theme.colors.textDim,
    flexShrink: 0,
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
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 8,
  },
};
