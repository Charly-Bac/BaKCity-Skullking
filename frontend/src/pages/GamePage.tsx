import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../hooks/GameContext';
import { useResponsive } from '../hooks/useResponsive';
import { GamePhase, TigressChoice } from '../types/game';
import { theme } from '../styles/theme';
import PlayerSidebar from '../components/game/PlayerSidebar';
import TopBar from '../components/game/TopBar';
import PlayArea from '../components/game/PlayArea';
import PlayerHand from '../components/game/PlayerHand';
import TimerBar from '../components/game/TimerBar';
import TurnIndicator from '../components/game/TurnIndicator';
import BidModal from '../components/game/BidModal';
import TigressModal from '../components/game/TigressModal';
import RoundScoreModal from '../components/game/RoundScoreModal';
import RightSidebar from '../components/game/RightSidebar';
import PiratePowerModal from '../components/game/PiratePowerModal';
import DebugPanel from '../components/game/DebugPanel';

export default function GamePage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { state, actions, clearTrickResult, clearRoundScores, clearTigress } = useGame();
  const lastPlayRef = useRef<number>(0);
  const { isMobile, height, cardWidth, cardHeight, playedCardWidth, playedCardHeight } = useResponsive();

  useEffect(() => {
    if (state.gameEndResult) {
      navigate(`/game-over/${roomCode}`);
    }
  }, [state.gameEndResult]);

  const game = state.game;
  if (!game) {
    return (
      <div style={{ ...css.loadingContainer, height }}>
        <p>Connexion en cours...</p>
        <button style={css.backBtn} onClick={() => navigate('/')}>Retour</button>
      </div>
    );
  }

  const isMyTurn = state.currentTurnPlayerId === state.playerId;
  const currentTrick = game.currentRound?.tricks[game.currentRound.tricks.length - 1] || null;

  const handlePlayCard = (cardId: string) => {
    const now = Date.now();
    if (now - lastPlayRef.current < 300) return;
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

  const timerMs = state.playTimeoutMs;

  const firstPlayerId = game.phase === 'bidding' && game.currentRound
    ? game.players[(game.currentRound.dealerIndex + 1) % game.players.length]?.id ?? null
    : game.playOrder?.[0] ?? null;

  const discardCount = game.currentRound?.tricks.filter(t => t.isDestroyed).reduce((sum, t) => sum + t.plays.length, 0) ?? 0;

  return (
    <div style={{ ...css.layout, height }}>
      {/* Left Sidebar: Players (desktop only) */}
      {!isMobile && (
        <PlayerSidebar
          players={game.players}
          currentTurnPlayerId={state.currentTurnPlayerId}
          myPlayerId={state.playerId}
          firstPlayerId={firstPlayerId}
          phase={game.phase}
          discardCount={discardCount}
        />
      )}

      {/* Main Content */}
      <div style={css.main}>
        {/* Top Bar */}
        <TopBar game={game} isMobile={isMobile} />

        {/* Mobile: horizontal player bar */}
        {isMobile && (
          <MobilePlayerBar
            players={game.players}
            currentTurnPlayerId={state.currentTurnPlayerId}
            myPlayerId={state.playerId}
            firstPlayerId={firstPlayerId}
            phase={game.phase}
          />
        )}

        {/* Back to lobby button */}
        {!isMobile && (
          <button style={css.lobbyBtn} onClick={() => {
            actions.leaveRoom();
            navigate('/');
          }}>
            {'\u2190'}
          </button>
        )}

        {/* Turn indicator / Timer */}
        <TurnIndicator
          active={isMyTurn && game.phase === GamePhase.PLAYING_TRICK}
          durationMs={timerMs}
        />

        {/* Play Area */}
        <PlayArea
          trick={state.trickResult?.trick ?? currentTrick}
          players={game.players}
          trickWinnerId={state.trickResult?.winnerId}
          trickDestroyed={state.trickResult?.trick?.isDestroyed && !state.trickResult?.winnerId}
          bonusPoints={state.trickResult ? state.trickResult.bonuses.reduce((s, b) => s + b.points, 0) : 0}
          cardWidth={playedCardWidth}
          cardHeight={playedCardHeight}
        />

        {/* Player Hand */}
        <PlayerHand
          hand={state.hand}
          validCardIds={state.validCardIds}
          isMyTurn={isMyTurn && game.phase === GamePhase.PLAYING_TRICK}
          onPlayCard={handlePlayCard}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
        />
      </div>

      {/* Right Sidebar (desktop: side panel, mobile: drawer) */}
      <RightSidebar logs={game.logs} isMobile={isMobile} />

      {/* === Modals === */}

      {state.bidRequest && game.phase === GamePhase.BIDDING && (
        <BidModal
          maxBid={state.bidRequest.maxBid}
          timeoutMs={state.bidRequest.timeoutMs}
          scoringMode={game.config.scoringMode}
          onSubmit={handleBidSubmit}
        />
      )}

      {state.tigressPending && (
        <TigressModal onChoose={handleTigressChoice} />
      )}

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
            if (state.piratePowerRequest?.type === 'rosie_choose_leader') actions.rosieChooseLeader(state.playerId || '');
            else if (state.piratePowerRequest?.type === 'rascal_bet') actions.rascalBet(0);
          }}
        />
      )}

      {state.harryAdjustRequest && game.pendingPiratePower?.playerId === state.playerId && (
        <div style={css.overlay}>
          <div style={{ ...css.harryModal, minWidth: isMobile ? 'auto' : 300, width: isMobile ? '90%' : 'auto' }}>
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

      {state.roundScores && (
        <RoundScoreModal
          scores={state.roundScores.scores}
          roundNumber={state.roundScores.roundNumber}
          players={game.players}
          readyPlayerIds={state.roundScores.readyPlayerIds || []}
          isReady={state.roundScores.readyPlayerIds?.includes(state.playerId || '') ?? false}
          onReady={() => actions.readyForNextRound()}
        />
      )}

      <DebugPanel game={game} />
    </div>
  );
}

// Mobile horizontal player bar
function MobilePlayerBar({ players, currentTurnPlayerId, myPlayerId, firstPlayerId, phase }: {
  players: any[];
  currentTurnPlayerId: string | null;
  myPlayerId: string | null;
  firstPlayerId: string | null;
  phase: string;
}) {
  const isBidding = phase === 'bidding';

  return (
    <div style={mobileCss.playerBar}>
      {players.filter(p => !p.isGhost).map(player => {
        const isActive = player.id === currentTurnPlayerId;
        const isMe = player.id === myPlayerId;
        const isLeader = player.id === firstPlayerId;
        const hasBid = player.roundState.bid !== null;

        return (
          <div key={player.id} style={{
            ...mobileCss.playerPill,
            ...(isActive ? mobileCss.activePill : {}),
            ...(isMe ? mobileCss.mePill : {}),
          }}>
            {isLeader && <span style={mobileCss.starIcon}>{'\u2605'}</span>}
            <span style={mobileCss.playerName}>
              {player.isBot ? '\u{1F916}' : ''}{player.name.substring(0, 6)}
            </span>
            <span style={mobileCss.playerScore}>{player.score}</span>
            <div style={mobileCss.pillStats}>
              <span style={mobileCss.pillStat}>
                M:{isBidding && !isMe ? (hasBid ? '\u2713' : '-') : (player.roundState.bid ?? '-')}
              </span>
              <span style={mobileCss.pillStat}>P:{player.roundState.tricksWon}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const mobileCss: Record<string, React.CSSProperties> = {
  playerBar: {
    display: 'flex',
    gap: 6,
    padding: '6px 8px',
    overflowX: 'auto',
    background: theme.colors.bgLight,
    borderBottom: `1px solid ${theme.colors.border}`,
    flexShrink: 0,
  },
  playerPill: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: 8,
    background: theme.colors.bgCard,
    minWidth: 60,
    flexShrink: 0,
    gap: 1,
  },
  activePill: {
    background: 'rgba(212, 168, 67, 0.2)',
    border: `1px solid ${theme.colors.gold}`,
  },
  mePill: {
    borderBottom: `2px solid ${theme.colors.gold}`,
  },
  starIcon: {
    fontSize: 10,
    color: theme.colors.gold,
  },
  playerName: {
    fontSize: 9,
    color: theme.colors.text,
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 60,
  },
  playerScore: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.gold,
  },
  pillStats: {
    display: 'flex',
    gap: 4,
  },
  pillStat: {
    fontSize: 8,
    color: theme.colors.textMuted,
  },
};

const css: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
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
