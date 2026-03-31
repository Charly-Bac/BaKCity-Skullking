import { useEffect, useState, useRef } from 'react';
import type { ITrick, ISanitizedPlayer, IPlayedCard, INumberedCard } from '../../types/game';
import { SpecialCardType, TigressChoice, Suit, TRUMP_SUIT } from '../../types/game';
import CardSVG from '../cards/CardSVG';
import { theme } from '../../styles/theme';

interface PlayAreaProps {
  trick: ITrick | null;
  players: ISanitizedPlayer[];
  trickWinnerId?: string | null;
  trickDestroyed?: boolean;
  bonusPoints?: number;
  cardWidth?: number;
  cardHeight?: number;
}

function isEscapeLike(play: IPlayedCard): boolean {
  if (play.card.kind !== 'special') return false;
  return (
    play.card.type === SpecialCardType.ESCAPE ||
    play.card.type === SpecialCardType.LOOT ||
    (play.card.type === SpecialCardType.TIGRESS && play.tigressChoice === TigressChoice.ESCAPE)
  );
}

function isPirateLike(play: IPlayedCard): boolean {
  if (play.card.kind !== 'special') return false;
  return (
    play.card.type === SpecialCardType.PIRATE ||
    (play.card.type === SpecialCardType.TIGRESS && play.tigressChoice === TigressChoice.PIRATE)
  );
}

function getLeadSuit(plays: IPlayedCard[]): Suit | null {
  for (const play of plays) {
    if (play.card.kind === 'numbered') return play.card.suit;
  }
  return null;
}

function getCurrentLeaderId(plays: IPlayedCard[]): string | null {
  if (plays.length === 0) return null;

  const hasKraken = plays.some(p => p.card.kind === 'special' && p.card.type === SpecialCardType.KRAKEN);
  const hasWhale = plays.some(p => p.card.kind === 'special' && p.card.type === SpecialCardType.WHITE_WHALE);

  if (hasKraken && !hasWhale) return null;
  if (hasKraken && hasWhale) {
    const ki = plays.findIndex(p => p.card.kind === 'special' && p.card.type === SpecialCardType.KRAKEN);
    const wi = plays.findIndex(p => p.card.kind === 'special' && p.card.type === SpecialCardType.WHITE_WHALE);
    if (ki > wi) return null;
  }

  if (hasWhale) {
    const numbered = plays.filter(p => p.card.kind === 'numbered');
    if (numbered.length === 0) {
      return plays.find(p => p.card.kind === 'special' && p.card.type === SpecialCardType.WHITE_WHALE)?.playerId ?? null;
    }
    return numbered.reduce((best, cur) =>
      (cur.card as INumberedCard).value > (best.card as INumberedCard).value ? cur : best
    ).playerId;
  }

  const hasSK = plays.some(p => p.card.kind === 'special' && p.card.type === SpecialCardType.SKULL_KING);
  const sirens = plays.filter(p => p.card.kind === 'special' && p.card.type === SpecialCardType.SIREN);
  const pirates = plays.filter(p => isPirateLike(p));

  if (sirens.length > 0 && hasSK) return sirens[0].playerId;
  if (hasSK) return plays.find(p => p.card.kind === 'special' && p.card.type === SpecialCardType.SKULL_KING)!.playerId;
  if (pirates.length > 0) return pirates[0].playerId;
  if (sirens.length > 0) return sirens[0].playerId;

  const numbered = plays.filter(p => p.card.kind === 'numbered');
  if (numbered.length === 0) return plays[0].playerId;

  const trumps = numbered.filter(p => (p.card as INumberedCard).suit === TRUMP_SUIT);
  if (trumps.length > 0) {
    return trumps.reduce((best, cur) =>
      (cur.card as INumberedCard).value > (best.card as INumberedCard).value ? cur : best
    ).playerId;
  }

  const leadSuit = getLeadSuit(plays);
  if (leadSuit) {
    const suited = numbered.filter(p => (p.card as INumberedCard).suit === leadSuit);
    if (suited.length > 0) {
      return suited.reduce((best, cur) =>
        (cur.card as INumberedCard).value > (best.card as INumberedCard).value ? cur : best
      ).playerId;
    }
  }

  return numbered.reduce((best, cur) =>
    (cur.card as INumberedCard).value > (best.card as INumberedCard).value ? cur : best
  ).playerId;
}

type AnimPhase = 'none' | 'gather' | 'fly' | 'done';

export default function PlayArea({ trick, players, trickWinnerId, trickDestroyed, bonusPoints, cardWidth = 90, cardHeight = 126 }: PlayAreaProps) {
  const [animPhase, setAnimPhase] = useState<AnimPhase>('none');
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null);
  const [newCardId, setNewCardId] = useState<string | null>(null);
  const prevAnimKey = useRef<string | null>(null);
  const prevPlaysCount = useRef(0);

  const animKey = trickWinnerId || (trickDestroyed ? 'destroyed' : null);

  // Track new cards entering the play area
  useEffect(() => {
    const currentCount = trick?.plays.length ?? 0;
    if (currentCount > prevPlaysCount.current && currentCount > 0 && animPhase === 'none' && !animKey) {
      const lastPlay = trick!.plays[currentCount - 1];
      setNewCardId(lastPlay.playerId);
      const t = setTimeout(() => setNewCardId(null), 400);
      prevPlaysCount.current = currentCount;
      return () => clearTimeout(t);
    }
    if (animKey) {
      // Clear entrance animation when trick is resolved
      setNewCardId(null);
    }
    prevPlaysCount.current = currentCount;
  }, [trick?.plays.length, animPhase, animKey]);

  useEffect(() => {
    if (animKey && animKey !== prevAnimKey.current) {
      prevAnimKey.current = animKey;

      if (trickDestroyed) {
        // Discard pile target
        const discardEl = document.querySelector('[data-discard-pile]');
        if (discardEl) {
          const rect = discardEl.getBoundingClientRect();
          setTargetPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        } else {
          // Fallback: bottom-left
          setTargetPos({ x: 110, y: window.innerHeight - 50 });
        }
      } else if (trickWinnerId) {
        const playerEl = document.querySelector(`[data-player-id="${trickWinnerId}"]`);
        if (playerEl) {
          const rect = playerEl.getBoundingClientRect();
          setTargetPos({ x: rect.left + 40, y: rect.top + rect.height / 2 });
        }
      }

      setAnimPhase('gather');
      const t1 = setTimeout(() => setAnimPhase('fly'), 500);
      const t2 = setTimeout(() => setAnimPhase('done'), 1400);

      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    if (!animKey) {
      prevAnimKey.current = null;
      setAnimPhase('none');
    }
  }, [animKey, trickWinnerId, trickDestroyed]);

  if (!trick || trick.plays.length === 0) {
    return (
      <div style={css.container}>
        <p style={css.emptyText}>En attente des cartes...</p>
      </div>
    );
  }

  const leaderId = trick.winnerId ?? getCurrentLeaderId(trick.plays);
  const isAnimating = animPhase !== 'none' && animPhase !== 'done';
  const winnerName = players.find(p => p.id === trickWinnerId)?.name || '';

  return (
    <div style={css.container} data-play-area>
      <style>{`
        @keyframes cardSlideIn {
          0% { transform: translateX(120px) rotate(10deg); opacity: 0; }
          60% { transform: translateX(-5px) rotate(-1deg); opacity: 1; }
          100% { transform: translateX(0) rotate(0deg); opacity: 1; }
        }
      `}</style>
      {/* Result text overlay */}
      {animKey && animPhase !== 'done' && (
        <div style={{
          ...css.winnerOverlay,
          ...(trickDestroyed ? css.destroyedOverlay : {}),
          opacity: animPhase === 'fly' ? 0 : 1,
          transition: 'opacity 0.3s',
        }}>
          {trickDestroyed
            ? 'Pli d\u00e9truit ! \u2620'
            : <>
                {winnerName} remporte le pli !
                {(bonusPoints ?? 0) > 0 && (
                  <span style={css.bonusText}> (+{bonusPoints} bonus)</span>
                )}
              </>
          }
        </div>
      )}

      <div style={{
        ...css.cardsRow,
        ...(isAnimating ? { position: 'relative' as const } : {}),
      }}>
        {trick.plays.map((play, i) => {
          const player = players.find((p) => p.id === play.playerId);
          const isLeader = play.playerId === leaderId;
          const isEscape = isEscapeLike(play);

          // Animation transforms
          // Gather offset: move each card to overlap at center of the row
          const gatherX = -i * (cardWidth + 16) + (trick.plays.length - 1) * (cardWidth + 16) / 2;
          const stackRotation = (i - (trick.plays.length - 1) / 2) * 5;

          const isNewCard = newCardId === play.playerId;

          let animStyle: React.CSSProperties = {};
          if (isNewCard) {
            animStyle = {
              animation: 'cardSlideIn 0.35s ease-out',
            };
          } else if (animPhase === 'gather') {
            animStyle = {
              transform: `translateX(${gatherX}px) rotate(${stackRotation}deg)`,
              transition: 'all 0.4s ease-in-out',
              zIndex: 10 + i,
            };
          } else if (animPhase === 'fly' && targetPos) {
            const containerEl = document.querySelector('[data-play-area]');
            const containerRect = containerEl?.getBoundingClientRect();
            const cx = containerRect ? containerRect.left + containerRect.width / 2 : 400;
            const cy = containerRect ? containerRect.top + containerRect.height / 2 : 300;
            const dx = targetPos.x - cx + gatherX;
            const dy = targetPos.y - cy;
            animStyle = {
              transform: `translate(${dx}px, ${dy}px) scale(0.15) rotate(${stackRotation}deg)`,
              opacity: 0.2,
              transition: 'all 0.8s ease-in',
              zIndex: 10 + i,
            };
          } else if (animPhase === 'done') {
            animStyle = {
              opacity: 0,
              transition: 'none',
            };
          }

          return (
            <div
              key={play.playerId}
              style={{
                ...css.playedCardWrapper,
                ...animStyle,
              }}
            >
              <div style={css.cardContainer}>
                <CardSVG
                  card={play.card}
                  width={cardWidth}
                  height={cardHeight}
                />
                {isLeader && !isEscape && animPhase === 'none' && (
                  <div style={css.starBadge}>&#x2605;</div>
                )}
              </div>
              {animPhase === 'none' && (
                <div style={{ ...css.playerLabel, ...(isLeader ? css.leaderLabel : {}) }}>
                  {player?.name || '???'}
                </div>
              )}
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
    position: 'relative',
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
  cardContainer: {
    position: 'relative',
    display: 'inline-block',
  },
  starBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: theme.colors.gold,
    color: theme.colors.bg,
    fontSize: 14,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
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
  leaderLabel: {
    color: theme.colors.gold,
    fontWeight: 'bold',
  },
  winnerOverlay: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(10, 14, 23, 0.9)',
    border: `2px solid ${theme.colors.gold}`,
    borderRadius: 12,
    padding: '12px 24px',
    color: theme.colors.gold,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    zIndex: 20,
    pointerEvents: 'none',
  },
  destroyedOverlay: {
    borderColor: theme.colors.red,
    color: theme.colors.red,
  },
  bonusText: {
    color: theme.colors.green,
    fontSize: 14,
  },
};
