import { useEffect, useState, useRef } from 'react';
import type { IPlayedCard, ISanitizedPlayer } from '../../types/game';
import CardSVG from '../cards/CardSVG';
import { theme } from '../../styles/theme';

interface TrickAnimationProps {
  plays: IPlayedCard[];
  winnerId: string;
  players: ISanitizedPlayer[];
  bonusPoints: number;
}

type Phase = 'show' | 'gather' | 'fly' | 'done';

export default function TrickAnimation({ plays, winnerId, players, bonusPoints }: TrickAnimationProps) {
  const [phase, setPhase] = useState<Phase>('show');
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const winnerName = players.find(p => p.id === winnerId)?.name || '???';

  useEffect(() => {
    // Find target position from sidebar
    const playerEl = document.querySelector(`[data-player-id="${winnerId}"]`);
    if (playerEl) {
      const rect = playerEl.getBoundingClientRect();
      setTargetPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }

    // Phase timeline
    const t1 = setTimeout(() => setPhase('gather'), 400);
    const t2 = setTimeout(() => setPhase('fly'), 900);
    const t3 = setTimeout(() => setPhase('done'), 1800);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [winnerId]);

  if (phase === 'done') return null;

  // Calculate center of play area
  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 400;
  const centerY = typeof window !== 'undefined' ? window.innerHeight * 0.4 : 300;

  return (
    <div ref={containerRef} style={css.overlay}>
      {/* Winner text */}
      <div style={{
        ...css.winnerText,
        opacity: phase === 'fly' ? 0 : 1,
        transition: 'opacity 0.3s',
      }}>
        {winnerName} remporte le pli !
        {bonusPoints > 0 && (
          <span style={css.bonusText}> (+{bonusPoints} bonus)</span>
        )}
      </div>

      {/* Animated cards */}
      {plays.map((play, i) => {
        const cardCount = plays.length;
        const spread = 100;
        const startX = centerX + (i - (cardCount - 1) / 2) * spread;
        const startY = centerY;

        let x = startX;
        let y = startY;
        let scale = 1;
        let opacity = 1;
        let rotation = 0;

        if (phase === 'gather') {
          x = centerX;
          y = centerY;
          rotation = (i - (cardCount - 1) / 2) * 8;
        } else if (phase === 'fly' && targetPos) {
          x = targetPos.x;
          y = targetPos.y;
          scale = 0.2;
          opacity = 0.3;
          rotation = 0;
        }

        return (
          <div
            key={play.playerId}
            style={{
              position: 'fixed',
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
              transition: phase === 'show'
                ? 'none'
                : phase === 'gather'
                  ? 'all 0.4s ease-in-out'
                  : 'all 0.8s ease-in',
              opacity,
              zIndex: 60 + i,
              pointerEvents: 'none',
            }}
          >
            <CardSVG card={play.card} width={70} height={98} />
          </div>
        );
      })}
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 55,
    pointerEvents: 'none',
  },
  winnerText: {
    position: 'absolute',
    top: 40,
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
    zIndex: 65,
  },
  bonusText: {
    color: theme.colors.green,
    fontSize: 14,
  },
};
