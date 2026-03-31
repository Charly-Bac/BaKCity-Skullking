import { useState } from 'react';
import type { ICard } from '../../types/game';
import CardSVG from '../cards/CardSVG';
import { theme } from '../../styles/theme';

interface PlayerHandProps {
  hand: ICard[];
  validCardIds: string[];
  isMyTurn: boolean;
  onPlayCard: (cardId: string) => void;
  selectedCardId?: string | null;
  cardWidth?: number;
  cardHeight?: number;
}

export default function PlayerHand({ hand, validCardIds, isMyTurn, onPlayCard, selectedCardId, cardWidth = 90, cardHeight = 126 }: PlayerHandProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={css.container}>
      <div style={css.label}>
        {isMyTurn ? 'CHOISIS TA CARTE' : 'TA MAIN'}
      </div>
      <div style={css.cardsRow}>
        {hand.map((card) => {
          const isValid = isMyTurn && validCardIds.includes(card.id);
          const isHovered = hoveredId === card.id;
          const isSelected = selectedCardId === card.id;

          let transform = 'translate(0, 0)';
          if (isSelected) {
            transform = 'translate(2px, -10px)';
          } else if (isHovered) {
            transform = 'translate(2px, -8px)';
          }

          return (
            <div
              key={card.id}
              style={{
                ...css.cardWrapper,
                ...(isValid ? css.validCard : {}),
                transform,
              }}
              onMouseEnter={() => setHoveredId(card.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <CardSVG
                card={card}
                width={cardWidth}
                height={cardHeight}
                onClick={isValid ? () => onPlayCard(card.id) : undefined}
                disabled={isMyTurn && !isValid}
                selected={isSelected}
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
