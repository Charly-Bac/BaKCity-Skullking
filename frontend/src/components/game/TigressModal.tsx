import { TigressChoice } from '../../types/game';
import { theme } from '../../styles/theme';

interface TigressModalProps {
  onChoose: (choice: TigressChoice) => void;
}

export default function TigressModal({ onChoose }: TigressModalProps) {
  return (
    <div style={css.overlay}>
      <div style={css.modal}>
        <h2 style={css.title}>Tigresse</h2>
        <p style={css.desc}>Choisissez le rôle de la Tigresse</p>
        <div style={css.buttons}>
          <button style={css.pirateBtn} onClick={() => onChoose(TigressChoice.PIRATE)}>
{'\u2694'} Pirate
          </button>
          <button style={css.escapeBtn} onClick={() => onChoose(TigressChoice.ESCAPE)}>
            {'\u{1F3F3}'} Fuite
          </button>
        </div>
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
    textAlign: 'center',
  },
  title: {
    color: theme.special.tigress,
    fontSize: 22,
    marginBottom: 8,
  },
  desc: {
    color: theme.colors.textDim,
    fontSize: 14,
    marginBottom: 20,
  },
  buttons: {
    display: 'flex',
    gap: 16,
  },
  pirateBtn: {
    flex: 1,
    padding: '14px 20px',
    background: theme.special.pirate,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  escapeBtn: {
    flex: 1,
    padding: '14px 20px',
    background: theme.special.escape,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
