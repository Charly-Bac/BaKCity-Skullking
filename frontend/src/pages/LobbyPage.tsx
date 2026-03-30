import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../hooks/GameContext';
import { theme } from '../styles/theme';

export default function LobbyPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { state, actions } = useGame();

  useEffect(() => {
    if (state.game?.phase && state.game.phase !== 'lobby') {
      navigate(`/game/${roomCode}`);
    }
  }, [state.game?.phase]);

  const handleLeave = () => {
    actions.leaveRoom();
    navigate('/');
  };

  const game = state.game;
  if (!game) {
    return (
      <div style={css.container}>
        <p style={css.loading}>Connexion...</p>
        <button style={css.backBtn} onClick={() => navigate('/')}>Retour</button>
      </div>
    );
  }

  const isCreator = game.creatorId === state.playerId;
  const playerCount = game.players.filter((p) => !p.isGhost).length;
  const canStart = playerCount >= 2;

  return (
    <div style={css.container}>
      <button style={css.backBtn} onClick={handleLeave}>Retour au lobby</button>

      <div style={css.codeSection}>
        <p style={css.codeLabel}>Code de la salle</p>
        <div style={css.code}>{game.roomCode}</div>
        <button
          style={css.copyBtn}
          onClick={() => navigator.clipboard.writeText(game.roomCode)}
        >
          Copier
        </button>
      </div>

      <div style={css.configDisplay}>
        <span>Scoring: {game.config.scoringMode === 'classic' ? 'Skull King' : 'Rascal'}</span>
        <span>Timer: {game.config.timerSeconds > 0 ? `${game.config.timerSeconds}s` : 'Aucun'}</span>
        {game.config.withExtensions && <span>+ Extensions</span>}
        {game.isDebugMode && <span style={{ color: theme.colors.red }}>DEBUG</span>}
      </div>

      <div style={css.playersSection}>
        <h2 style={css.sectionTitle}>Joueurs ({playerCount}/{game.config.maxPlayers})</h2>
        <div style={css.playerList}>
          {game.players.filter((p) => !p.isGhost).map((p) => (
            <div key={p.id} style={css.playerRow}>
              <span style={css.playerIndicator}>
                {p.isBot ? '\u{1F916}' : '\u{1F3F4}\u200D\u2620\uFE0F'}
              </span>
              <span style={css.playerName}>
                {p.name}
                {p.id === game.creatorId && ' (host)'}
              </span>
              {p.isBot && isCreator && (
                <button
                  style={css.removeBtn}
                  onClick={() => actions.removeBot(p.id)}
                >
                  X
                </button>
              )}
            </div>
          ))}
        </div>

        {playerCount < game.config.maxPlayers && (
          <button
            style={css.addBotBtn}
            onClick={() => actions.addBots(1)}
          >
            + Ajouter un bot
          </button>
        )}
      </div>

      {isCreator && (
        <button
          style={{ ...css.startBtn, ...(canStart ? {} : css.startBtnDisabled) }}
          onClick={() => canStart && actions.startGame()}
          disabled={!canStart}
        >
          {canStart ? 'Lancer la partie' : 'Min. 2 joueurs'}
        </button>
      )}

      {!isCreator && (
        <p style={css.waitingText}>En attente du lancement par l'h{'\u00f4'}te...</p>
      )}
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 500,
    margin: '0 auto',
    padding: '20px',
    minHeight: '100vh',
  },
  loading: {
    textAlign: 'center',
    color: theme.colors.textDim,
    marginTop: 40,
  },
  backBtn: {
    background: 'transparent',
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.textDim,
    padding: '8px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    marginBottom: 20,
    fontFamily: 'inherit',
  },
  codeSection: {
    textAlign: 'center',
    marginBottom: 24,
  },
  codeLabel: {
    color: theme.colors.textDim,
    fontSize: 14,
    marginBottom: 8,
  },
  code: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.gold,
    letterSpacing: 8,
    marginBottom: 8,
  },
  copyBtn: {
    background: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.textDim,
    padding: '6px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'inherit',
  },
  configDisplay: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    color: theme.colors.textDim,
    fontSize: 13,
    marginBottom: 24,
    padding: '8px 16px',
    background: theme.colors.bgCard,
    borderRadius: 8,
  },
  playersSection: {
    background: theme.colors.bgLight,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: theme.colors.gold,
    marginBottom: 12,
  },
  playerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    background: theme.colors.bgCard,
    borderRadius: 8,
  },
  playerIndicator: {
    fontSize: 20,
  },
  playerName: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
  },
  removeBtn: {
    background: 'transparent',
    border: `1px solid ${theme.colors.red}`,
    color: theme.colors.red,
    width: 28,
    height: 28,
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addBotBtn: {
    width: '100%',
    padding: '10px',
    marginTop: 12,
    background: 'transparent',
    border: `1px dashed ${theme.colors.border}`,
    color: theme.colors.textDim,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: 'inherit',
  },
  startBtn: {
    width: '100%',
    padding: '14px 24px',
    background: theme.colors.gold,
    color: theme.colors.bg,
    border: 'none',
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  startBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  waitingText: {
    textAlign: 'center',
    color: theme.colors.textDim,
    fontStyle: 'italic',
  },
};
