import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../hooks/GameContext';
import { GamePhase, TigressChoice } from '../types/game';
import { theme } from '../styles/theme';
import PlayerSidebar from '../components/game/PlayerSidebar';
import TopBar from '../components/game/TopBar';
import PlayArea from '../components/game/PlayArea';
import PlayerHand from '../components/game/PlayerHand';
import TimerBar from '../components/game/TimerBar';
import BidModal from '../components/game/BidModal';
import TigressModal from '../components/game/TigressModal';
import RoundScoreModal from '../components/game/RoundScoreModal';
import GameLog from '../components/game/GameLog';
import PiratePowerModal from '../components/game/PiratePowerModal';
import DebugPanel from '../components/game/DebugPanel';

export default function GamePage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { state, actions, clearTrickResult, clearRoundScores, clearTigress } = useGame();
  const lastPlayRef = useRef<number>(0);

  // Navigate to game over
  useEffect(() => {
    if (state.gameEndResult) {
      navigate(`/game-over/${roomCode}`);
    }
  }, [state.gameEndResult]);

  const game = state.game;
  if (!game) {
    return (
      <div style={css.loadingContainer}>
        <p>Connexion en cours...</p>
        <button style={css.backBtn} onClick={() => navigate('/')}>Retour</button>
      </div>
    );
  }

  const isMyTurn = state.currentTurnPlayerId === state.playerId;
  const currentTrick = game.currentRound?.tricks[game.currentRound.tricks.length - 1] || null;

  const handlePlayCard = (cardId: string) => {
    const now = Date.now();
    if (now - lastPlayRef.current < 1000) return;
    lastPlayRef.current = now;
    actions.playCard(cardId);
  };

  const handleBidSubmit = (bid: number, hasCannonball?: boolean) => {
    actions.submitBid(bid, hasCannonball);
  };

  const handleTigressChoice = (choice: TigressChoice) => {
    actions.tigressChoice(choice);
    clearTigress();
  };

  const timerMs = game.config.timerSeconds > 0 ? game.config.timerSeconds * 1000 : 0;

  return (
    <div style={css.layout}>
      {/* Left Sidebar: Players */}
      <PlayerSidebar
        players={game.players}
        currentTurnPlayerId={state.currentTurnPlayerId}
        myPlayerId={state.playerId}
      />

      {/* Main Content */}
      <div style={css.main}>
        {/* Top Bar */}
        <TopBar game={game} />

        {/* Back to lobby button */}
        <button style={css.lobbyBtn} onClick={() => {
          actions.leaveRoom();
          navigate('/');
        }}>
          {'\u2190'}
        </button>

        {/* Timer */}
        <TimerBar
          durationMs={timerMs}
          active={isMyTurn && game.phase === GamePhase.PLAYING_TRICK}
        />

        {/* Play Area */}
        <PlayArea trick={currentTrick} players={game.players} />

        {/* Trick result overlay */}
        {state.trickResult && state.trickResult.winnerId && (
          <div style={css.trickOverlay}>
            <div style={css.trickResult}>
              {game.players.find((p) => p.id === state.trickResult!.winnerId)?.name} remporte le pli !
              {state.trickResult.bonuses.length > 0 && (
                <span style={css.bonusText}>
                  {' '}(+{state.trickResult.bonuses.reduce((s, b) => s + b.points, 0)} bonus)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Player Hand */}
        <PlayerHand
          hand={state.hand}
          validCardIds={state.validCardIds}
          isMyTurn={isMyTurn && game.phase === GamePhase.PLAYING_TRICK}
          onPlayCard={handlePlayCard}
        />
      </div>

      {/* Right Sidebar: Log */}
      <GameLog logs={game.logs} />

      {/* === Modals === */}

      {/* Bid Modal */}
      {state.bidRequest && game.phase === GamePhase.BIDDING && (
        <BidModal
          maxBid={state.bidRequest.maxBid}
          timeoutMs={state.bidRequest.timeoutMs}
          scoringMode={game.config.scoringMode}
          onSubmit={handleBidSubmit}
        />
      )}

      {/* Tigress Choice */}
      {state.tigressPending && (
        <TigressModal onChoose={handleTigressChoice} />
      )}

      {/* Pirate Power */}
      {state.piratePowerRequest && game.pendingPiratePower && game.pendingPiratePower.playerId === state.playerId && (
        <PiratePowerModal
          type={state.piratePowerRequest.type}
          pirateName={state.piratePowerRequest.pirateName}
          timeoutMs={state.piratePowerRequest.timeoutMs}
          players={game.players}
          myPlayerId={state.playerId || ''}
          hand={state.hand}
          willDrawnCards={state.willDrawnCards}
          onRosieChoose={(id) => actions.rosieChooseLeader(id)}
          onWillDiscard={(ids) => actions.willDiscard(ids)}
          onRascalBet={(amt) => actions.rascalBet(amt)}
          onDefault={() => {
            // Default action per pirate type
            if (state.piratePowerRequest?.type === 'rosie_choose_leader') actions.rosieChooseLeader(state.playerId || '');
            else if (state.piratePowerRequest?.type === 'rascal_bet') actions.rascalBet(0);
          }}
        />
      )}

      {/* Harry Adjust */}
      {state.harryAdjustRequest && game.pendingPiratePower?.playerId === state.playerId && (
        <div style={css.overlay}>
          <div style={css.harryModal}>
            <h2 style={{ color: theme.colors.gold, textAlign: 'center', marginBottom: 12 }}>Harry - Ajuster la mise</h2>
            <p style={{ color: theme.colors.textDim, textAlign: 'center', marginBottom: 16 }}>
              Mise actuelle : {state.harryAdjustRequest.currentBid}
            </p>
            <TimerBar durationMs={state.harryAdjustRequest.timeoutMs} active={state.harryAdjustRequest.timeoutMs > 0} onTimeout={() => actions.harryAdjustBid(0)} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 }}>
              <button style={css.harryBtn} onClick={() => actions.harryAdjustBid(-1)}>-1</button>
              <button style={css.harryBtn} onClick={() => actions.harryAdjustBid(0)}>Garder</button>
              <button style={css.harryBtn} onClick={() => actions.harryAdjustBid(1)}>+1</button>
            </div>
          </div>
        </div>
      )}

      {/* Round Scores */}
      {state.roundScores && (
        <RoundScoreModal
          scores={state.roundScores.scores}
          roundNumber={state.roundScores.roundNumber}
          players={game.players}
          onClose={clearRoundScores}
        />
      )}

      {/* Debug Panel */}
      <DebugPanel game={game} />
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: theme.colors.bg,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: 20,
    color: theme.colors.textDim,
  },
  backBtn: {
    background: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.textDim,
    padding: '8px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  lobbyBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    background: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.textDim,
    width: 36,
    height: 36,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 18,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trickOverlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 30,
    pointerEvents: 'none',
  },
  trickResult: {
    background: 'rgba(10, 14, 23, 0.9)',
    border: `2px solid ${theme.colors.gold}`,
    borderRadius: 12,
    padding: '12px 24px',
    color: theme.colors.gold,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bonusText: {
    color: theme.colors.green,
    fontSize: 14,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  harryModal: {
    background: theme.colors.bgModal,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 16,
    padding: 24,
    minWidth: 300,
  },
  harryBtn: {
    padding: '12px 24px',
    background: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 8,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
