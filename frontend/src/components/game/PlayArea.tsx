import type { ITrick, ISanitizedPlayer } from '../../types/game';
import CardSVG from '../cards/CardSVG';
import { theme } from '../../styles/theme';

interface PlayAreaProps {
  trick: ITrick | null;
  players: ISanitizedPlayer[];
}

export default function PlayArea({ trick, players }: PlayAreaProps) {
  if (!trick || trick.plays.length === 0) {
    return (
      <div style={css.container}>
        <p style={css.emptyText}>En attente des cartes...</p>
      </div>
    );
  }

  return (
    <div style={css.container}>
      <div style={css.cardsRow}>
        {trick.plays.map((play) => {
          const player = players.find((p) => p.id === play.playerId);
          const isWinner = trick.winnerId === play.playerId;
          return (
            <div key={play.playerId} style={css.playedCardWrapper}>
              <CardSVG
                card={play.card}
                width={90}
                height={126}
                highlighted={isWinner}
              />
              <div style={{ ...css.playerLabel, ...(isWinner ? css.winnerLabel : {}) }}>
                {player?.name || '???'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    fontSize: 16,
  },
  cardsRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  playedCardWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  playerLabel: {
    fontSize: 12,
    color: theme.colors.textDim,
    textAlign: 'center',
    maxWidth: 90,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  winnerLabel: {
    color: theme.colors.gold,
    fontWeight: 'bold',
  },
};
