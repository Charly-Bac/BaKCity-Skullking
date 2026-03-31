import { useState } from 'react';
import { theme } from '../../styles/theme';

interface CardInfo {
  name: string;
  emoji: string;
  color: string;
  description: string;
}

const NUMBERED_CARDS: CardInfo[] = [
  { name: 'Jaune', emoji: '\u{1F7E1}', color: theme.suits.treasure_chest, description: 'Valeurs 1-14. Couleur standard.' },
  { name: 'Vert', emoji: '\u{1F7E2}', color: theme.suits.parrot, description: 'Valeurs 1-14. Couleur standard.' },
  { name: 'Violet', emoji: '\u{1F7E3}', color: theme.suits.treasure_map, description: 'Valeurs 1-14. Couleur standard.' },
  { name: 'Noir', emoji: '\u26AB', color: theme.suits.jolly_roger, description: 'Valeurs 1-14. Atout : bat toutes les autres couleurs.' },
];

const SPECIAL_CARDS: CardInfo[] = [
  { name: 'Fuite', emoji: '\u{1F3F3}', color: theme.special.escape, description: 'Ne remporte jamais le pli. 5 cartes dans le jeu.' },
  { name: 'Pirate', emoji: '\u2694', color: theme.special.pirate, description: 'Bat toutes les cartes numérotées et les sir\u00e8nes. 5 pirates avec pouvoirs uniques.' },
  { name: 'Sir\u00e8ne', emoji: '\u{1F9DC}', color: theme.special.siren, description: 'Bat les pirates. Battue par le Skull King (+bonus de capture). 2 cartes.' },
  { name: 'Skull King', emoji: '\u{1F451}', color: theme.special.skull_king, description: 'Bat tout sauf les sir\u00e8nes. Bonus de +40 par pirate capturé. 1 carte.' },
  { name: 'Tigresse', emoji: '\u{1F405}', color: theme.special.tigress, description: 'Choix : jouer comme Pirate ou comme Fuite. 1 carte.' },
  { name: 'Kraken', emoji: '\u{1F419}', color: theme.special.kraken, description: 'Détruit le pli : personne ne le remporte. 1 carte.' },
  { name: 'Baleine', emoji: '\u{1F433}', color: theme.special.white_whale, description: 'La plus haute carte numérotée remporte le pli. 1 carte.' },
  { name: 'Butin', emoji: '\u{1F4B0}', color: theme.special.loot, description: 'Comme une fuite, mais donne un bonus au vainqueur du pli. 2 cartes.' },
];

export default function CardReference() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ ...css.container, width: isOpen ? 260 : 0 }}>
      <button
        style={{
          ...css.toggleBtn,
          right: isOpen ? 260 : 0,
        }}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Fermer la référence' : 'Voir les cartes'}
      >
        {isOpen ? '\u25B6' : '\u25C0'} {!isOpen && 'Cartes'}
      </button>
      {isOpen && (
        <div style={css.content}>
          <h3 style={css.title}>Cartes du jeu</h3>
          <div style={css.scrollArea}>
            <h4 style={css.sectionTitle}>Cartes numérotées</h4>
            {NUMBERED_CARDS.map((card) => (
              <div key={card.name} style={css.cardRow}>
                <span style={{ ...css.cardEmoji, color: card.color }}>{card.emoji}</span>
                <div>
                  <span style={{ ...css.cardName, color: card.color }}>{card.name}</span>
                  <p style={css.cardDesc}>{card.description}</p>
                </div>
              </div>
            ))}

            <h4 style={css.sectionTitle}>Cartes spéciales</h4>
            {SPECIAL_CARDS.map((card) => (
              <div key={card.name} style={css.cardRow}>
                <span style={css.cardEmoji}>{card.emoji}</span>
                <div>
                  <span style={{ ...css.cardName, color: card.color }}>{card.name}</span>
                  <p style={css.cardDesc}>{card.description}</p>
                </div>
              </div>
            ))}

            <h4 style={css.sectionTitle}>Hiérarchie</h4>
            <p style={css.cardDesc}>
              Fuite &lt; Numérotées &lt; Noir (atout) &lt; Pirate &lt; Sir\u00e8ne &lt; Skull King
            </p>
            <p style={css.cardDesc}>
              Sir\u00e8ne bat Pirate et Skull King. Skull King bat Pirate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  container: {
    background: theme.colors.bgLight,
    borderLeft: `1px solid ${theme.colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    transition: 'width 0.2s ease',
    overflow: 'hidden',
    flexShrink: 0,
  },
  toggleBtn: {
    position: 'absolute',
    top: 40,
    zIndex: 10,
    transform: 'translateX(-100%)',
    background: theme.colors.bgLight,
    border: `1px solid ${theme.colors.border}`,
    borderRight: 'none',
    borderRadius: '6px 0 0 6px',
    color: theme.colors.textMuted,
    fontSize: 11,
    padding: '6px 8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'right 0.2s ease',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
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
  cardName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDesc: {
    fontSize: 10,
    color: theme.colors.textDim,
    margin: '2px 0 0 0',
    lineHeight: 1.4,
  },
};
