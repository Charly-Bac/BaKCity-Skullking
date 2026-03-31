import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/GameContext';
import { ScoringMode } from '../types/game';
import { theme } from '../styles/theme';

export default function HomePage() {
  const navigate = useNavigate();
  const { state, actions, resetState } = useGame();

  const [playerName, setPlayerName] = useState(() => localStorage.getItem('sk_name') || '');
  const [joinCode, setJoinCode] = useState('');
  const [botCount, setBotCount] = useState(3);
  const [showCreate, setShowCreate] = useState(false);
  const [isDebug, setIsDebug] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<0 | 15 | 30 | 45 | 60>(30);
  const [scoringMode, setScoringMode] = useState<ScoringMode>(ScoringMode.CLASSIC);
  const [withExtensions, setWithExtensions] = useState(true);

  // Reset state when arriving at home
  useEffect(() => {
    resetState();
  }, []);

  useEffect(() => {
    if (state.roomCode && state.game) {
      localStorage.setItem('sk_name', playerName);
      if (state.game.phase === 'lobby') {
        navigate(`/lobby/${state.roomCode}`);
      } else {
        navigate(`/game/${state.roomCode}`);
      }
    }
  }, [state.roomCode, state.game?.phase]);

  const handleQuickPlay = () => {
    if (!playerName.trim()) return;
    localStorage.setItem('sk_name', playerName);
    actions.quickStart(playerName.trim(), botCount, {
      isDebugMode: isDebug,
      withExtensions,
      scoringMode,
    });
  };

  const handleCreateRoom = () => {
    if (!playerName.trim()) return;
    localStorage.setItem('sk_name', playerName);
    actions.createRoom(playerName.trim(), {
      timerSeconds,
      scoringMode,
      withExtensions,
      isDebugMode: isDebug,
      maxPlayers: 8,
    });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !joinCode.trim()) return;
    localStorage.setItem('sk_name', playerName);
    actions.joinRoom(joinCode.trim().toUpperCase(), playerName.trim());
  };

  return (
    <div style={css.container}>
      <div style={css.header}>
        <h1 style={css.title}>SKULL KING</h1>
        <p style={css.subtitle}>Le jeu de plis pirate</p>
      </div>

      {state.error && (
        <div style={css.error}>{state.error}</div>
      )}

      <div style={css.nameSection}>
        <input
          style={css.input}
          placeholder="Ton nom de pirate..."
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={20}
        />
      </div>

      {/* Quick Play */}
      <div style={css.section}>
        <h2 style={css.sectionTitle}>Partie Rapide (vs Bots)</h2>
        <div style={css.row}>
          <label style={css.label}>Nombre de bots :</label>
          <div style={css.botSelector}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                style={{ ...css.botBtn, ...(botCount === n ? css.botBtnActive : {}) }}
                onClick={() => setBotCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <button style={css.primaryBtn} onClick={handleQuickPlay} disabled={!playerName.trim()}>
          Jouer
        </button>
      </div>

      {/* Join Room */}
      <div style={css.section}>
        <h2 style={css.sectionTitle}>Rejoindre une salle</h2>
        <div style={css.row}>
          <input
            style={{ ...css.input, ...css.codeInput }}
            placeholder="CODE"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={5}
          />
          <button style={css.primaryBtn} onClick={handleJoinRoom} disabled={!playerName.trim() || !joinCode.trim()}>
            Rejoindre
          </button>
        </div>
      </div>

      {/* Create Room */}
      <div style={css.section}>
        <h2 style={css.sectionTitle}>Cr{'\u00e9'}er une salle</h2>
        {!showCreate ? (
          <button style={css.secondaryBtn} onClick={() => setShowCreate(true)}>
            Configurer
          </button>
        ) : (
          <div style={css.config}>
            <div style={css.configRow}>
              <label style={css.label}>Timer par action :</label>
              <select
                style={css.select}
                value={timerSeconds}
                onChange={(e) => setTimerSeconds(Number(e.target.value) as any)}
              >
                <option value={0}>Pas de timer</option>
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={45}>45s</option>
                <option value={60}>60s</option>
              </select>
            </div>

            <div style={css.configRow}>
              <label style={css.label}>Scoring :</label>
              <select
                style={css.select}
                value={scoringMode}
                onChange={(e) => setScoringMode(e.target.value as ScoringMode)}
              >
                <option value="classic">Skull King (classique)</option>
                <option value="rascal">Rascal</option>
              </select>
            </div>

            <div style={css.configRow}>
              <label style={css.checkLabel}>
                <input
                  type="checkbox"
                  checked={withExtensions}
                  onChange={(e) => setWithExtensions(e.target.checked)}
                />
                Extensions (Kraken, Baleine, Butin)
              </label>
            </div>

            <div style={css.configRow}>
              <label style={css.checkLabel}>
                <input
                  type="checkbox"
                  checked={isDebug}
                  onChange={(e) => setIsDebug(e.target.checked)}
                />
                Mode Debug
              </label>
            </div>

            <button style={css.primaryBtn} onClick={handleCreateRoom} disabled={!playerName.trim()}>
              Cr{'\u00e9'}er la salle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 500,
    margin: '0 auto',
    padding: '20px 16px',
    minHeight: '100dvh',
  },
  header: {
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 'clamp(32px, 8vw, 48px)' as any,
    color: theme.colors.gold,
    fontFamily: "'Georgia', serif",
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textDim,
    fontStyle: 'italic',
  },
  error: {
    background: 'rgba(192,57,43,0.2)',
    border: `1px solid ${theme.colors.red}`,
    color: theme.colors.red,
    padding: '10px 16px',
    borderRadius: 8,
    marginBottom: 20,
    textAlign: 'center',
  },
  nameSection: {
    marginBottom: 30,
  },
  section: {
    background: theme.colors.bgLight,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: theme.colors.gold,
    marginBottom: 16,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap' as const,
  },
  label: {
    color: theme.colors.textDim,
    fontSize: 14,
    minWidth: 120,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 8,
    color: theme.colors.text,
    fontSize: 16,
    outline: 'none',
    fontFamily: 'inherit',
  },
  codeInput: {
    width: 120,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: 'bold',
    fontSize: 20,
  },
  botSelector: {
    display: 'flex',
    gap: 6,
  },
  botBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.bgCard,
    color: theme.colors.textDim,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 'bold',
  },
  botBtnActive: {
    background: theme.colors.gold,
    color: theme.colors.bg,
    borderColor: theme.colors.gold,
  },
  primaryBtn: {
    width: '100%',
    padding: '12px 24px',
    background: theme.colors.gold,
    color: theme.colors.bg,
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  secondaryBtn: {
    width: '100%',
    padding: '12px 24px',
    background: 'transparent',
    color: theme.colors.gold,
    border: `1px solid ${theme.colors.gold}`,
    borderRadius: 8,
    fontSize: 16,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  config: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  configRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  select: {
    padding: '8px 12px',
    background: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 8,
    color: theme.colors.text,
    fontSize: 14,
    outline: 'none',
    flex: 1,
  },
  checkLabel: {
    color: theme.colors.textDim,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
};
