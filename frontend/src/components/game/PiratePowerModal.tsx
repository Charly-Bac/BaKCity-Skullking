import { useState } from 'react';
import { PiratePowerType, PirateName } from '../../types/game';
import type { ISanitizedPlayer, ICard } from '../../types/game';
import CardSVG from '../cards/CardSVG';
import TimerBar from './TimerBar';
import { theme } from '../../styles/theme';

interface PiratePowerModalProps {
  type: PiratePowerType;
  pirateName: PirateName;
  timeoutMs: number;
  players: ISanitizedPlayer[];
  myPlayerId: string;
  hand: ICard[];
  willDrawnCards?: ICard[] | null;
  onRosieChoose: (targetPlayerId: string) => void;
  onWillDiscard: (cardIds: [string, string]) => void;
  onRascalBet: (amount: 0 | 10 | 20) => void;
  onDefault: () => void;
}

export default function PiratePowerModal({
  type, pirateName, timeoutMs, players, myPlayerId, hand,
  willDrawnCards, onRosieChoose, onWillDiscard, onRascalBet, onDefault,
}: PiratePowerModalProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const PIRATE_TITLES: Record<string, string> = {
    rosie: 'Rosie - Choisir le meneur',
    will: 'Will - Echanger des cartes',
    rascal: 'Rascal - Parier des points',
    juanita: 'Juanita - Cartes non distribu\u00e9es',
    harry: 'Harry - Ajuster la mise',
  };

  return (
    <div style={css.overlay}>
      <div style={css.modal}>
        <h2 style={css.title}>{PIRATE_TITLES[pirateName] || pirateName}</h2>
        <TimerBar durationMs={timeoutMs} active={timeoutMs > 0} onTimeout={onDefault} />

        {type === PiratePowerType.ROSIE_CHOOSE_LEADER && (
          <div>
            <p style={css.desc}>Qui commence le prochain pli ?</p>
            <div style={css.playerButtons}>
              {players.filter(p => !p.isGhost).map(p => (
                <button
                  key={p.id}
                  style={{
                    ...css.playerBtn,
                    ...(selectedPlayer === p.id ? css.playerBtnActive : {}),
                  }}
                  onClick={() => setSelectedPlayer(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button
              style={css.confirmBtn}
              onClick={() => onRosieChoose(selectedPlayer || myPlayerId)}
              disabled={!selectedPlayer}
            >
              Confirmer
            </button>
          </div>
        )}

        {type === PiratePowerType.WILL_DRAW_DISCARD && (
          <div>
            <p style={css.desc}>D\u00e9faussez 2 cartes de votre main</p>
            <div style={css.cardRow}>
              {hand.map(card => (
                <div key={card.id} onClick={() => {
                  setSelectedCards(prev => {
                    if (prev.includes(card.id)) return prev.filter(id => id !== card.id);
                    if (prev.length >= 2) return prev;
                    return [...prev, card.id];
                  });
                }}>
                  <CardSVG
                    card={card}
                    width={70}
                    height={98}
                    selected={selectedCards.includes(card.id)}
                  />
                </div>
              ))}
            </div>
            <button
              style={css.confirmBtn}
              onClick={() => {
                if (selectedCards.length === 2) {
                  onWillDiscard(selectedCards as [string, string]);
                }
              }}
              disabled={selectedCards.length !== 2}
            >
              D\u00e9fausser ({selectedCards.length}/2)
            </button>
          </div>
        )}

        {type === PiratePowerType.RASCAL_BET && (
          <div>
            <p style={css.desc}>Combien pariez-vous ?</p>
            <div style={css.betButtons}>
              <button style={css.betBtn} onClick={() => onRascalBet(0)}>0 pts</button>
              <button style={css.betBtn} onClick={() => onRascalBet(10)}>10 pts</button>
              <button style={css.betBtn} onClick={() => onRascalBet(20)}>20 pts</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  modal: {
    background: theme.colors.bgModal,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 16,
    padding: 24,
    minWidth: 320,
    maxWidth: 500,
  },
  title: {
    textAlign: 'center',
    color: theme.special.pirate,
    fontSize: 18,
    marginBottom: 12,
  },
  desc: {
    color: theme.colors.textDim,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  playerButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  playerBtn: {
    padding: '10px 16px',
    background: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 8,
    color: theme.colors.text,
    cursor: 'pointer',
    fontSize: 14,
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  playerBtnActive: {
    borderColor: theme.colors.gold,
    background: 'rgba(212,168,67,0.15)',
  },
  confirmBtn: {
    width: '100%',
    padding: '12px',
    background: theme.colors.gold,
    color: theme.colors.bg,
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  cardRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
    cursor: 'pointer',
  },
  betButtons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  betBtn: {
    padding: '12px 24px',
    background: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 8,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
