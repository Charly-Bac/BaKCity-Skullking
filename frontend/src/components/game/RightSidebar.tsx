import { useState, useRef, useEffect } from 'react';
import type { ILogEntry } from '../../types/game';
import { theme } from '../../styles/theme';
import RulesBook from './RulesBook';

interface RightSidebarProps {
  logs: ILogEntry[];
  isMobile?: boolean;
}

type Tab = 'closed' | 'journal' | 'cartes' | 'regles';

interface CardInfo {
  name: string;
  emoji: string;
  color: string;
  count: string;
  description: string;
}

const NUMBERED_CARDS: CardInfo[] = [
  { name: 'Jaune', emoji: '\u{1F7E1}', color: theme.suits.treasure_chest, count: '14', description: 'Valeurs 1-14. Couleur standard.' },
  { name: 'Vert', emoji: '\u{1F7E2}', color: theme.suits.parrot, count: '14', description: 'Valeurs 1-14. Couleur standard.' },
  { name: 'Violet', emoji: '\u{1F7E3}', color: theme.suits.treasure_map, count: '14', description: 'Valeurs 1-14. Couleur standard.' },
  { name: 'Noir', emoji: '\u26AB', color: theme.suits.jolly_roger, count: '14', description: 'Valeurs 1-14. Atout : bat toutes les autres couleurs.' },
];

const SPECIAL_CARDS: CardInfo[] = [
  { name: 'Fuite', emoji: '\u{1F3F3}', color: theme.special.escape, count: 'x5', description: 'Ne remporte jamais le pli.' },
  { name: 'Pirate', emoji: '\u2694', color: theme.special.pirate, count: 'x5', description: 'Bat les numérotées et les sirènes. Chaque pirate a un pouvoir unique (Rosie, Will, Rascal, Juanita, Harry).' },
  { name: 'Sirène', emoji: '\u{1F9DC}', color: theme.special.siren, count: 'x2', description: 'Bat le Skull King (+40 bonus). Battue par les pirates.' },
  { name: 'Skull King', emoji: '\u{1F451}', color: theme.special.skull_king, count: 'x1', description: 'Bat tout sauf les sirènes. Bonus de +40 par pirate capturé.' },
  { name: 'Tigresse', emoji: '\u{1F405}', color: theme.special.tigress, count: 'x1', description: 'Choix : jouer comme Pirate ou comme Fuite.' },
  { name: 'Kraken', emoji: '\u{1F419}', color: theme.special.kraken, count: 'x1', description: 'Détruit le pli : personne ne le remporte.' },
  { name: 'Baleine', emoji: '\u{1F433}', color: theme.special.white_whale, count: 'x1', description: 'La plus haute carte numérotée remporte le pli.' },
  { name: 'Butin', emoji: '\u{1F4B0}', color: theme.special.loot, count: 'x2', description: 'Alliance : bonus si les deux joueurs (butin + vainqueur) réussissent leur mise.' },
];

export default function RightSidebar({ logs, isMobile }: RightSidebarProps) {
  const [tab, setTab] = useState<Tab>('closed');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab === 'journal') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, tab]);

  const isOpen = tab !== 'closed';

  if (isMobile) {
    return (
      <>
        {/* Mobile: floating buttons at bottom-right */}
        <div style={mCss.floatingBtns}>
          {(['journal', 'cartes', 'regles'] as Tab[]).map(t => (
            <button
              key={t}
              style={{ ...mCss.floatingBtn, ...(tab === t ? css.toggleBtnActive : {}) }}
              onClick={() => setTab(tab === t ? 'closed' : t)}
            >
              {t === 'journal' ? 'J' : t === 'cartes' ? 'C' : 'R'}
            </button>
          ))}
        </div>
        {/* Mobile: full overlay when open */}
        {isOpen && (
          <div style={mCss.overlay} onClick={() => setTab('closed')}>
            <div style={mCss.drawer} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={css.title}>{tab === 'journal' ? 'Journal' : tab === 'cartes' ? 'Cartes du jeu' : 'Règles du jeu'}</h3>
                <button style={mCss.closeBtn} onClick={() => setTab('closed')}>{'\u2715'}</button>
              </div>
              <div style={mCss.drawerContent}>
                {tab === 'journal' && logs.slice(-50).map((log) => (
                  <div key={log.id} style={css.logEntry}>
                    <span style={css.logTime}>{new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span style={css.logMsg}>{log.message}</span>
                  </div>
                ))}
                {tab === 'cartes' && (
                  <>
                    <h4 style={css.sectionTitle}>Cartes numérotées</h4>
                    {NUMBERED_CARDS.map(card => (
                      <div key={card.name} style={css.cardRow}>
                        <span style={{ ...css.cardEmoji, color: card.color }}>{card.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={css.cardHeader}><span style={{ ...css.cardName, color: card.color }}>{card.name}</span><span style={css.cardCount}>{card.count}</span></div>
                          <p style={css.cardDesc}>{card.description}</p>
                        </div>
                      </div>
                    ))}
                    <h4 style={css.sectionTitle}>Cartes spéciales</h4>
                    {SPECIAL_CARDS.map(card => (
                      <div key={card.name} style={css.cardRow}>
                        <span style={css.cardEmoji}>{card.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={css.cardHeader}><span style={{ ...css.cardName, color: card.color }}>{card.name}</span><span style={css.cardCount}>{card.count}</span></div>
                          <p style={css.cardDesc}>{card.description}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {tab === 'regles' && <RulesBook />}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div style={css.wrapper}>
      {/* Toggle buttons - outside overflow container */}
      <div style={css.toggleArea}>
        <button
          style={{ ...css.toggleBtn, ...(tab === 'journal' ? css.toggleBtnActive : {}) }}
          onClick={() => setTab(tab === 'journal' ? 'closed' : 'journal')}
        >
          Journal
        </button>
        <button
          style={{ ...css.toggleBtn, ...(tab === 'cartes' ? css.toggleBtnActive : {}) }}
          onClick={() => setTab(tab === 'cartes' ? 'closed' : 'cartes')}
        >
          Cartes
        </button>
        <button
          style={{ ...css.toggleBtn, ...(tab === 'regles' ? css.toggleBtnActive : {}) }}
          onClick={() => setTab(tab === 'regles' ? 'closed' : 'regles')}
        >
          R&egrave;gles
        </button>
      </div>
      <div style={{ ...css.container, width: isOpen ? 260 : 0 }}>

      {/* Journal tab */}
      {tab === 'journal' && (
        <>
          <h3 style={css.title}>Journal</h3>
          <div style={css.scrollArea}>
            {logs.slice(-50).map((log) => (
              <div key={log.id} style={css.logEntry}>
                <span style={css.logTime}>
                  {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span style={css.logMsg}>{log.message}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </>
      )}

      {/* Cartes tab */}
      {tab === 'cartes' && (
        <>
          <h3 style={css.title}>Cartes du jeu</h3>
          <div style={css.scrollArea}>
            <h4 style={css.sectionTitle}>Cartes numérotées</h4>
            {NUMBERED_CARDS.map((card) => (
              <div key={card.name} style={css.cardRow}>
                <span style={{ ...css.cardEmoji, color: card.color }}>{card.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={css.cardHeader}>
                    <span style={{ ...css.cardName, color: card.color }}>{card.name}</span>
                    <span style={css.cardCount}>{card.count}</span>
                  </div>
                  <p style={css.cardDesc}>{card.description}</p>
                </div>
              </div>
            ))}

            <h4 style={css.sectionTitle}>Cartes spéciales</h4>
            {SPECIAL_CARDS.map((card) => (
              <div key={card.name} style={css.cardRow}>
                <span style={css.cardEmoji}>{card.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={css.cardHeader}>
                    <span style={{ ...css.cardName, color: card.color }}>{card.name}</span>
                    <span style={css.cardCount}>{card.count}</span>
                  </div>
                  <p style={css.cardDesc}>{card.description}</p>
                </div>
              </div>
            ))}

            <h4 style={css.sectionTitle}>Hiérarchie</h4>
            <p style={css.cardDesc}>
              Fuite &lt; Numérotées &lt; Noir (atout) &lt; Pirate &lt; Skull King
            </p>
            <p style={css.cardDesc}>
              Triangle : Pirate bat Sirène. Sirène bat Skull King. Skull King bat Pirate.
            </p>
          </div>
        </>
      )}

      {/* Règles tab */}
      {tab === 'regles' && (
        <>
          <h3 style={css.title}>Règles du jeu</h3>
          <div style={css.scrollArea}>
            <RulesBook />
          </div>
        </>
      )}
      </div>
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    display: 'flex',
    flexShrink: 0,
  },
  container: {
    background: theme.colors.bgLight,
    borderLeft: `1px solid ${theme.colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.2s ease',
    overflow: 'hidden',
  },
  toggleArea: {
    position: 'absolute',
    top: 8,
    right: '100%',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  toggleBtn: {
    background: theme.colors.bgLight,
    border: `1px solid ${theme.colors.border}`,
    borderRight: 'none',
    borderRadius: '6px 0 0 6px',
    color: theme.colors.textMuted,
    fontSize: 11,
    padding: '6px 10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    textAlign: 'left',
  },
  toggleBtnActive: {
    background: theme.colors.bgCard,
    color: theme.colors.gold,
    borderColor: theme.colors.gold,
  },
  title: {
    padding: '10px 12px',
    fontSize: 13,
    color: theme.colors.textMuted,
    borderBottom: `1px solid ${theme.colors.border}`,
    margin: 0,
    whiteSpace: 'nowrap',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 12px',
  },
  // Journal styles
  logEntry: {
    display: 'flex',
    gap: 6,
    marginBottom: 4,
    fontSize: 11,
    lineHeight: 1.4,
  },
  logTime: {
    color: theme.colors.textMuted,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  logMsg: {
    color: theme.colors.textDim,
  },
  // Card reference styles
  sectionTitle: {
    fontSize: 11,
    color: theme.colors.gold,
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  cardEmoji: {
    fontSize: 18,
    flexShrink: 0,
    width: 24,
    textAlign: 'center',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardCount: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  cardDesc: {
    fontSize: 10,
    color: theme.colors.textDim,
    margin: '2px 0 0 0',
    lineHeight: 1.4,
  },
};

const mCss: Record<string, React.CSSProperties> = {
  floatingBtns: {
    position: 'fixed',
    bottom: 90,
    right: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    zIndex: 40,
  },
  floatingBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: theme.colors.bgCard,
    border: `2px solid ${theme.colors.border}`,
    color: theme.colors.gold,
    fontSize: 13,
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 45,
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '85%',
    maxWidth: 320,
    background: theme.colors.bgLight,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: theme.colors.textDim,
    fontSize: 20,
    cursor: 'pointer',
  },
  drawerContent: {
    flex: 1,
    overflowY: 'auto',
  },
};
