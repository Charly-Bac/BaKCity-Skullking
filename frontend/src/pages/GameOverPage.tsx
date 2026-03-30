import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../hooks/GameContext';
import { theme } from '../styles/theme';

export default function GameOverPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { state, actions } = useGame();

  const result = state.gameEndResult;
  const game = state.game;

  return (
    <div style={css.container}>
      <h1 style={css.title}>Partie Termin{'\u00e9'}e !</h1>

      {result && (
        <div style={css.winner}>
          {'\u{1F451}'} {result.winnerName} remporte la victoire !
        </div>
      )}

      {result && (
        <div style={css.scoresSection}>
          <h2 style={css.subtitle}>Classement Final</h2>
          <table style={css.table}>
            <thead>
              <tr>
                <th style={css.th}>#</th>
                <th style={{ ...css.th, textAlign: 'left' }}>Joueur</th>
                <th style={css.th}>Score</th>
              </tr>
            </thead>
            <tbody>
              {game?.players
                .filter((p) => !p.isGhost)
                .sort((a, b) => b.score - a.score)
                .map((player, i) => (
                  <tr key={player.id}>
                    <td style={css.td}>{i + 1}</td>
                    <td style={{ ...css.td, textAlign: 'left', fontWeight: i === 0 ? 'bold' : 'normal' }}>
                      {player.name}
                    </td>
                    <td style={{ ...css.td, fontWeight: 'bold', color: i === 0 ? theme.colors.gold : theme.colors.text }}>
                      {player.score}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      <div style={css.buttons}>
        <button style={css.rematchBtn} onClick={() => actions.rematch()}>
          Revanche
        </button>
        <button style={css.lobbyBtn} onClick={() => {
          actions.leaveRoom();
          navigate('/');
        }}>
          Retour au lobby
        </button>
      </div>
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 500,
    margin: '0 auto',
    padding: '40px 20px',
    minHeight: '100vh',
    textAlign: 'center',
  },
  title: {
    fontSize: 36,
    color: theme.colors.gold,
    marginBottom: 20,
  },
  winner: {
    fontSize: 22,
    color: theme.colors.gold,
    padding: '16px 24px',
    background: 'rgba(212,168,67,0.1)',
    border: `1px solid ${theme.colors.gold}`,
    borderRadius: 12,
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.textDim,
    marginBottom: 12,
  },
  scoresSection: {
    background: theme.colors.bgLight,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '8px',
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.textMuted,
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  td: {
    padding: '10px 8px',
    textAlign: 'center',
    fontSize: 16,
    color: theme.colors.text,
  },
  buttons: {
    display: 'flex',
    gap: 12,
  },
  rematchBtn: {
    flex: 1,
    padding: '14px',
    background: theme.colors.gold,
    color: theme.colors.bg,
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  lobbyBtn: {
    flex: 1,
    padding: '14px',
    background: 'transparent',
    color: theme.colors.textDim,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 8,
    fontSize: 16,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
