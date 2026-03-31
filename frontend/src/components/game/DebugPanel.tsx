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

  // Auto-refresh hands when game state changes (phase, round, trick)
  useEffect(() => {
    if (isOpen) {
      getSocket().emit('debug_view_all_hands');
    }
  }, [isOpen, game.phase, game.roundNumber, game.currentRound?.tricks?.length]);

  const viewHands = () => {
    getSocket().emit('debug_view_all_hands');
  };

  const skipPhase = () => {
    getSocket().emit('debug_skip_phase');
  };

  const setRound = () => {
    getSocket().emit('debug_set_round', { roundNumber: roundInput });
  };

  const addCard = (cardId: string) => {
    getSocket().emit('debug_add_card', { cardId });
  };

  const QUICK_ADD_CARDS = [
    { id: 'tigress-1', label: 'Tigresse' },
    { id: 'skull_king-1', label: 'Skull King' },
    { id: 'pirate-harry', label: 'Harry' },
    { id: 'pirate-rosie', label: 'Rosie' },
    { id: 'pirate-will', label: 'Will' },
    { id: 'siren-1', label: 'Sir\u00e8ne' },
    { id: 'kraken-1', label: 'Kraken' },
    { id: 'white_whale-1', label: 'Baleine' },
    { id: 'escape-1', label: 'Fuite' },
    { id: 'loot-1', label: 'Butin' },
  ];

  if (!game.isDebugMode) return null;

  const currentTrick = game.currentRound?.tricks?.[game.currentRound.tricks.length - 1];
  const trickCount = game.currentRound?.tricks?.length ?? 0;

  return (
    <>
      <button
        style={css.toggleBtn}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'X' : 'DBG'}
      </button>

      {isOpen && (
        <div style={css.panel}>
          <div style={css.header}>
            <h3 style={css.title}>Debug Panel</h3>
          </div>

          {/* Game Info */}
          <div style={css.infoGrid}>
            <div style={css.infoItem}>
              <span style={css.infoLabel}>Phase</span>
              <span style={css.infoValue}>{game.phase}</span>
            </div>
            <div style={css.infoItem}>
              <span style={css.infoLabel}>Manche</span>
              <span style={css.infoValue}>{game.roundNumber}/10</span>
            </div>
            <div style={css.infoItem}>
              <span style={css.infoLabel}>Pli</span>
              <span style={css.infoValue}>{trickCount}/{game.roundNumber}</span>
            </div>
            <div style={css.infoItem}>
              <span style={css.infoLabel}>Joueur actif</span>
              <span style={css.infoValue}>#{game.currentPlayerIndex + 1}</span>
            </div>
          </div>

          {/* Play Order */}
          <div style={css.section}>
            <span style={css.sectionLabel}>Ordre de jeu: </span>
            <span style={css.infoValueSmall}>
              {game.playOrder.map((id, i) => {
                const p = game.players.find(pl => pl.id === id);
                return p ? `${i + 1}.${p.name}` : id;
              }).join(' > ')}
            </span>
          </div>

          {/* Actions */}
          <div style={css.actions}>
            <button style={css.actionBtn} onClick={viewHands}>Rafra&icirc;chir mains</button>
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

          {/* Quick Add Cards */}
          <div style={css.section}>
            <h4 style={css.subTitle}>Ajouter une carte</h4>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {QUICK_ADD_CARDS.map((c) => (
                <button key={c.id} style={css.actionBtn} onClick={() => addCard(c.id)}>
                  +{c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current Trick */}
          {currentTrick && currentTrick.plays.length > 0 && (
            <div style={css.section}>
              <h4 style={css.subTitle}>Pli en cours</h4>
              <div style={css.trickInfo}>
                <span>Couleur d'entame: <strong>{currentTrick.leadSuit || 'aucune'}</strong></span>
                <span> | Leader: <strong>{game.players.find(p => p.id === currentTrick.leadPlayerId)?.name}</strong></span>
              </div>
              <div style={css.handCards}>
                {currentTrick.plays.map((play) => (
                  <div key={play.playerId} style={{ textAlign: 'center' }}>
                    <CardSVG card={play.card} width={45} height={63} />
                    <div style={css.tinyLabel}>{game.players.find(p => p.id === play.playerId)?.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Hands */}
          {allHands.length > 0 && (
            <div style={css.section}>
              <h4 style={css.subTitle}>Toutes les mains</h4>
              {allHands.map((hand) => (
                <div key={hand.playerId} style={css.handRow}>
                  <div style={css.handLabel}>{hand.playerName} ({hand.cards.length})</div>
                  <div style={css.handCards}>
                    {hand.cards.map((card) => (
                      <CardSVG key={card.id} card={card} width={45} height={63} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Players State */}
          <div style={css.section}>
            <h4 style={css.subTitle}>Joueurs</h4>
            <table style={css.table}>
              <thead>
                <tr>
                  <th style={css.th}>Nom</th>
                  <th style={css.th}>Mise</th>
                  <th style={css.th}>Plis</th>
                  <th style={css.th}>Cartes</th>
                  <th style={css.th}>Score</th>
                </tr>
              </thead>
              <tbody>
                {game.players.filter((p) => !p.isGhost).map((p) => {
                  const hitBid = p.roundState.bid !== null && p.roundState.bid === p.roundState.tricksWon;
                  return (
                    <tr key={p.id}>
                      <td style={css.td}>{p.isBot ? '\u{1F916}' : ''} {p.name}</td>
                      <td style={css.td}>{p.roundState.bid ?? '-'}</td>
                      <td style={{ ...css.td, color: hitBid ? theme.colors.green : (p.roundState.tricksWon > (p.roundState.bid ?? 0) ? theme.colors.red : theme.colors.textDim) }}>
                        {p.roundState.tricksWon}
                      </td>
                      <td style={css.td}>{p.cardCount}</td>
                      <td style={{ ...css.td, fontWeight: 'bold' }}>{p.score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
    width: 480,
    maxHeight: '70vh',
    overflowY: 'auto',
    background: theme.colors.bgModal,
    border: `2px solid ${theme.colors.red}`,
    borderRadius: 12,
    padding: 16,
    zIndex: 99,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    color: theme.colors.red,
    fontSize: 14,
    margin: 0,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6,
    marginBottom: 8,
  },
  infoItem: {
    background: theme.colors.bgCard,
    borderRadius: 6,
    padding: '4px 8px',
    textAlign: 'center',
  },
  infoLabel: {
    display: 'block',
    fontSize: 9,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  infoValue: {
    display: 'block',
    fontSize: 13,
    color: theme.colors.gold,
    fontWeight: 'bold',
  },
  infoValueSmall: {
    fontSize: 10,
    color: theme.colors.textDim,
  },
  section: {
    borderTop: `1px solid ${theme.colors.border}`,
    paddingTop: 6,
    marginTop: 6,
  },
  sectionLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  actions: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  actionBtn: {
    padding: '4px 10px',
    background: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.textDim,
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: 'inherit',
  },
  roundControl: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  roundInput: {
    width: 40,
    padding: '3px 6px',
    background: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 4,
    color: theme.colors.text,
    fontSize: 11,
    textAlign: 'center',
  },
  subTitle: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginBottom: 6,
    margin: '4px 0',
    textTransform: 'uppercase',
  },
  handRow: {
    marginBottom: 6,
  },
  handLabel: {
    color: theme.colors.textDim,
    fontSize: 10,
    marginBottom: 2,
  },
  handCards: {
    display: 'flex',
    gap: 3,
    flexWrap: 'wrap',
  },
  trickInfo: {
    fontSize: 10,
    color: theme.colors.textDim,
    marginBottom: 4,
  },
  tinyLabel: {
    fontSize: 8,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    fontSize: 9,
    color: theme.colors.textMuted,
    padding: '3px 6px',
    textAlign: 'center',
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  td: {
    fontSize: 11,
    color: theme.colors.textDim,
    padding: '3px 6px',
    textAlign: 'center',
  },
};
