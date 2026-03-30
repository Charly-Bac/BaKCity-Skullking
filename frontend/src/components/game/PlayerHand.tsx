import type { ICard } from '../../types/game';
import CardSVG from '../cards/CardSVG';
import { theme } from '../../styles/theme';

interface PlayerHandProps {
  hand: ICard[];
  validCardIds: string[];
  isMyTurn: boolean;
  onPlayCard: (cardId: string) => void;
  selectedCardId?: string | null;
}

export default function PlayerHand({ hand, validCardIds, isMyTurn, onPlayCard, selectedCardId }: PlayerHandProps) {
  return (
    <div style={css.container}>
      <div style={css.label}>
        {isMyTurn ? 'CHOISIS TA CARTE' : 'TA MAIN'}
      </div>
      <div style={css.cardsRow}>
        {hand.map((card) => {
          const isValid = isMyTurn && validCardIds.includes(card.id);
          return (
            <div
              key={card.id}
              style={{
                ...css.cardWrapper,
                ...(isValid ? css.validCard : {}),
                transform: selectedCardId === card.id ? 'translateY(-10px)' : 'translateY(0)',
              }}
            >
              <CardSVG
                card={card}
                width={90}
                height={126}
                onClick={isValid ? () => onPlayCard(card.id) : undefined}
                disabled={isMyTurn && !isValid}
                highlighted={isValid}
                selected={selectedCardId === card.id}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  container: {
    padding: '12px 20px 20px',
    background: theme.colors.bgLight,
    borderTop: `1px solid ${theme.colors.border}`,
  },
  label: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.gold,
    marginBottom: 10,
    letterSpacing: 2,
  },
  cardsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardWrapper: {
    transition: 'transform 0.15s ease',
  },
  validCard: {
    cursor: 'pointer',
  },
};
