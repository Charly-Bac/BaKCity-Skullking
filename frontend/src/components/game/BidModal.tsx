import { useState } from 'react';
import { theme } from '../../styles/theme';
import { ScoringMode } from '../../types/game';
import TimerBar from './TimerBar';

interface BidModalProps {
  maxBid: number;
  timeoutMs: number;
  scoringMode: ScoringMode;
  onSubmit: (bid: number, hasCannonball?: boolean) => void;
}

export default function BidModal({ maxBid, timeoutMs, scoringMode, onSubmit }: BidModalProps) {
  const [bid, setBid] = useState(0);
  const [cannonball, setCannonball] = useState(false);

  const handleSubmit = () => {
    onSubmit(bid, scoringMode === ScoringMode.RASCAL ? cannonball : undefined);
  };

  return (
    <div style={css.overlay}>
      <div style={css.modal}>
        <h2 style={css.title}>Combien de plis ?</h2>

        <TimerBar durationMs={timeoutMs} active={timeoutMs > 0} onTimeout={() => onSubmit(0)} />

        <div style={css.bidRow}>
          {Array.from({ length: maxBid + 1 }, (_, i) => (
            <button
              key={i}
              style={{
                ...css.bidBtn,
                ...(bid === i ? css.bidBtnActive : {}),
              }}
              onClick={() => setBid(i)}
            >
              {i}
            </button>
          ))}
        </div>

        {scoringMode === ScoringMode.RASCAL && (
          <label style={css.cannonballLabel}>
            <input
              type="checkbox"
              checked={cannonball}
              onChange={(e) => setCannonball(e.target.checked)}
            />
            Boulet de canon (x1.5 si exact, 0 sinon)
          </label>
        )}

        <button style={css.submitBtn} onClick={handleSubmit}>
          Miser {bid}
        </button>
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
    maxWidth: 400,
  },
  title: {
    textAlign: 'center',
    color: theme.colors.gold,
    fontSize: 20,
    marginBottom: 16,
  },
  bidRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    margin: '16px 0',
  },
  bidBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.bgCard,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  bidBtnActive: {
    background: theme.colors.gold,
    color: theme.colors.bg,
    borderColor: theme.colors.gold,
  },
  cannonballLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: theme.colors.textDim,
    fontSize: 13,
    marginBottom: 16,
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    background: theme.colors.gold,
    color: theme.colors.bg,
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
