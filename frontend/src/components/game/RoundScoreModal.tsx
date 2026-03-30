import type { IScoreEntry, ISanitizedPlayer } from '../../types/game';
import { theme } from '../../styles/theme';

interface RoundScoreModalProps {
  scores: IScoreEntry;
  roundNumber: number;
  players: ISanitizedPlayer[];
  onClose: () => void;
}

export default function RoundScoreModal({ scores, roundNumber, players, onClose }: RoundScoreModalProps) {
  return (
    <div style={css.overlay}>
      <div style={css.modal}>
        <h2 style={css.title}>Scores - Manche {roundNumber}</h2>
        <table style={css.table}>
          <thead>
            <tr>
              <th style={css.th}>Joueur</th>
              <th style={css.th}>Mise</th>
              <th style={css.th}>Plis</th>
              <th style={css.th}>Base</th>
              <th style={css.th}>Bonus</th>
              <th style={css.th}>Manche</th>
              <th style={css.th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {scores.scores.map((s) => {
              const player = players.find((p) => p.id === s.playerId);
              const hitBid = s.bid === s.tricksWon;
              return (
                <tr key={s.playerId}>
                  <td style={css.td}>{player?.name || '???'}</td>
                  <td style={css.td}>{s.bid}</td>
                  <td style={css.td}>{s.tricksWon}</td>
                  <td style={{ ...css.td, color: s.basePoints >= 0 ? theme.colors.green : theme.colors.red }}>
                    {s.basePoints > 0 ? '+' : ''}{s.basePoints}
                  </td>
                  <td style={{ ...css.td, color: theme.colors.gold }}>
                    {s.bonusPoints > 0 ? `+${s.bonusPoints}` : s.bonusPoints}
                  </td>
                  <td style={{
                    ...css.td,
                    fontWeight: 'bold',
                    color: hitBid ? theme.colors.green : theme.colors.red,
                  }}>
                    {s.roundScore > 0 ? '+' : ''}{s.roundScore}
                  </td>
                  <td style={{ ...css.td, fontWeight: 'bold' }}>{s.totalScore}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button style={css.closeBtn} onClick={onClose}>Continuer</button>
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
    maxWidth: 600,
    width: '90%',
  },
  title: {
    textAlign: 'center',
    color: theme.colors.gold,
    fontSize: 20,
    marginBottom: 16,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: 16,
  },
  th: {
    padding: '6px 8px',
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.textMuted,
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  td: {
    padding: '8px',
    textAlign: 'center',
    fontSize: 14,
    color: theme.colors.text,
  },
  closeBtn: {
    width: '100%',
    padding: '10px',
    background: theme.colors.gold,
    color: theme.colors.bg,
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
