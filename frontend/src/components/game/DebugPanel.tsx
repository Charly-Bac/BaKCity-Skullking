import { useState, useEffect } from 'react';
import { getSocket } from '../../lib/socket';
import type { ICard, ISanitizedGame } from '../../types/game';
import CardSVG from '../cards/CardSVG';
import { theme } from '../../styles/theme';

interface DebugPanelProps {
  game: ISanitizedGame;
}

interface DebugHand {
  playerId: string;
  playerName: string;
  cards: ICard[];
}

export default function DebugPanel({ game }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [allHands, setAllHands] = useState<DebugHand[]>([]);
  const [roundInput, setRoundInput] = useState(game.roundNumber);

  useEffect(() => {
    const socket = getSocket();
    socket.on('debug_all_hands', (data: { hands: DebugHand[] }) => {
      setAllHands(data.hands);
    });
    return () => { socket.off('debug_all_hands'); };
  }, []);

  const viewHands = () => {
    getSocket().emit('debug_view_all_hands');
  };

  const skipPhase = () => {
    getSocket().emit('debug_skip_phase');
  };

  const setRound = () => {
    getSocket().emit('debug_set_round', { roundNumber: roundInput });
  };

  if (!game.isDebugMode) return null;

  return (
    <>
      <button
        style={css.toggleBtn}
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) viewHands(); }}
      >
        {isOpen ? 'X' : 'DBG'}
      </button>

      {isOpen && (
        <div style={css.panel}>
          <div style={css.header}>
            <h3 style={css.title}>Debug Panel</h3>
            <div style={css.phaseInfo}>
              Phase: <strong>{game.phase}</strong> | Round: {game.roundNumber}
            </div>
          </div>

          <div style={css.actions}>
            <button style={css.actionBtn} onClick={viewHands}>Voir toutes les mains</button>
            <button style={css.actionBtn} onClick={skipPhase}>Skip Phase</button>
            <div style={css.roundControl}>
              <input
                type="number"
                min={1}
                max={10}
                value={roundInput}
                onChange={(e) => setRoundInput(Number(e.target.value))}
                style={css.roundInput}
              />
              <button style={css.actionBtn} onClick={setRound}>Aller au round</button>
            </div>
          </div>

          {allHands.length > 0 && (
            <div style={css.handsSection}>
              <h4 style={css.subTitle}>Toutes les mains</h4>
              {allHands.map((hand) => (
                <div key={hand.playerId} style={css.handRow}>
                  <div style={css.handLabel}>{hand.playerName}</div>
                  <div style={css.handCards}>
                    {hand.cards.map((card) => (
                      <CardSVG key={card.id} card={card} width={50} height={70} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={css.stateSection}>
            <h4 style={css.subTitle}>Players State</h4>
            {game.players.filter((p) => !p.isGhost).map((p) => (
              <div key={p.id} style={css.stateRow}>
                <span>{p.name}: </span>
                <span>Bid={p.roundState.bid ?? '-'} </span>
                <span>Won={p.roundState.tricksWon} </span>
                <span>Cards={p.cardCount} </span>
                <span>Score={p.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

const css: Record<string, React.CSSProperties> = {
  toggleBtn: {
    position: 'fixed',
    bottom: 10,
    right: 10,
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: theme.colors.red,
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 'bold',
    zIndex: 100,
  },
  panel: {
    position: 'fixed',
    bottom: 60,
    right: 10,
    width: 450,
    maxHeight: '60vh',
    overflowY: 'auto',
    background: theme.colors.bgModal,
    border: `1px solid ${theme.colors.red}`,
    borderRadius: 12,
    padding: 16,
    zIndex: 99,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    color: theme.colors.red,
    fontSize: 16,
    margin: 0,
  },
  phaseInfo: {
    color: theme.colors.textDim,
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  actionBtn: {
    padding: '6px 12px',
    background: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.textDim,
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'inherit',
  },
  roundControl: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  roundInput: {
    width: 50,
    padding: '4px 8px',
    background: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 4,
    color: theme.colors.text,
    fontSize: 12,
    textAlign: 'center',
  },
  handsSection: {
    marginBottom: 12,
  },
  subTitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
    margin: 0,
  },
  handRow: {
    marginBottom: 8,
  },
  handLabel: {
    color: theme.colors.textDim,
    fontSize: 11,
    marginBottom: 4,
  },
  handCards: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
  },
  stateSection: {
    borderTop: `1px solid ${theme.colors.border}`,
    paddingTop: 8,
  },
  stateRow: {
    fontSize: 11,
    color: theme.colors.textDim,
    marginBottom: 4,
  },
};
