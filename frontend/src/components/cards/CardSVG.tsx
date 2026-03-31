import type { ICard } from '../../types/game';
import { SpecialCardType, Suit } from '../../types/game';
import { theme } from '../../styles/theme';

interface CardSVGProps {
  card: ICard | null;
  width?: number;
  height?: number;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  showBack?: boolean;
}

const SUIT_SYMBOLS: Record<string, string> = {
  parrot: '\u{1F7E2}',
  treasure_map: '\u{1F7E3}',
  treasure_chest: '\u{1F7E1}',
  jolly_roger: '\u26AB',
};

const SUIT_NAMES: Record<string, string> = {
  parrot: 'Vert',
  treasure_map: 'Violet',
  treasure_chest: 'Jaune',
  jolly_roger: 'Noir',
};

const SPECIAL_SYMBOLS: Record<string, string> = {
  escape: '\u{1F3F3}',
  pirate: '\u2694',
  tigress: '\u{1F405}',
  skull_king: '\u{1F451}',
  siren: '\u{1F9DC}',
  kraken: '\u{1F419}',
  white_whale: '\u{1F433}',
  loot: '\u{1F4B0}',
};

const SPECIAL_NAMES: Record<string, string> = {
  escape: 'Fuite',
  pirate: 'Pirate',
  tigress: 'Tigresse',
  skull_king: 'Skull King',
  siren: 'Sir\u00e8ne',
  kraken: 'Kraken',
  white_whale: 'Baleine',
  loot: 'Butin',
};

const PIRATE_DISPLAY: Record<string, string> = {
  rosie: 'Rosie',
  will: 'Will',
  rascal: 'Rascal',
  juanita: 'Juanita',
  harry: 'Harry',
};

export default function CardSVG({
  card,
  width = 100,
  height = 140,
  onClick,
  disabled = false,
  selected = false,
  highlighted = false,
  showBack = false,
}: CardSVGProps) {
  if (showBack || !card) {
    return (
      <svg width={width} height={height} viewBox="0 0 100 140" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
        <rect x="2" y="2" width="96" height="136" rx="8" fill="#1a2235" stroke="#2a3650" strokeWidth="2" />
        <text x="50" y="75" textAnchor="middle" fontSize="36" fill="#3a4a6a">{'\u2620'}</text>
      </svg>
    );
  }

  const opacity = disabled ? 0.4 : 1;

  const wrapperStyle: React.CSSProperties = {
    cursor: onClick && !disabled ? 'pointer' : 'default',
    display: 'inline-block',
  };

  if (card.kind === 'numbered') {
    const suitColor = theme.suits[card.suit as keyof typeof theme.suits] || '#888';
    const bgColor = theme.suitBg[card.suit as keyof typeof theme.suitBg] || '#111';
    const symbol = SUIT_SYMBOLS[card.suit] || '?';
    const borderColor = selected ? theme.colors.gold
      : disabled ? '#333' : suitColor;

    return (
      <div style={wrapperStyle} onClick={!disabled ? onClick : undefined} data-card-id={card.id}>
      <svg
        width={width} height={height} viewBox="0 0 100 140"
        style={{ opacity, transition: 'transform 0.15s' }}
      >
        <rect x="2" y="2" width="96" height="136" rx="8" fill={bgColor} stroke={borderColor} strokeWidth={selected ? 3 : 2} />
        <circle cx="22" cy="22" r="14" fill={suitColor} opacity="0.2" />
        <text x="22" y="28" textAnchor="middle" fontSize="16" fontWeight="bold" fill={suitColor}>{card.value}</text>
        <text x="50" y="85" textAnchor="middle" fontSize="32">{symbol}</text>
        <text x="50" y="125" textAnchor="middle" fontSize="10" fill={suitColor}>{SUIT_NAMES[card.suit]}</text>
      </svg>
      </div>
    );
  }

  // Special card
  const specialColor = theme.special[card.type as keyof typeof theme.special] || '#888';
  const symbol = SPECIAL_SYMBOLS[card.type] || '?';

  // Pirates: show "Pirate" as label, name below. Others: show card name.
  const isPirate = card.type === SpecialCardType.PIRATE;
  const primaryLabel = isPirate ? 'Pirate' : (SPECIAL_NAMES[card.type] || card.type);
  const secondaryLabel = isPirate && card.pirateName ? (PIRATE_DISPLAY[card.pirateName] || card.pirateName) : null;

  // Special card background colors
  const specialBgColors: Record<string, string> = {
    escape: '#0d1a2e',
    pirate: '#1a0808',
    tigress: '#1a1008',
    skull_king: '#0d0d0d',
    siren: '#081a1e',
    kraken: '#1a0a0a',
    white_whale: '#1a1e22',
    loot: '#1a1408',
  };
  const specialBg = specialBgColors[card.type] || '#0d1220';

  return (
    <div style={wrapperStyle} onClick={!disabled ? onClick : undefined} data-card-id={card.id}>
    <svg
      width={width} height={height} viewBox="0 0 100 140"
      style={{ opacity, transition: 'transform 0.15s' }}
    >
      <rect x="2" y="2" width="96" height="136" rx="8" fill={specialBg} stroke={selected ? theme.colors.gold : specialColor} strokeWidth={selected ? 3 : 2} />
      <rect x="6" y="6" width="88" height="128" rx="6" fill="none" stroke={specialColor} strokeWidth="1" opacity="0.3" />
      <text x="50" y="65" textAnchor="middle" fontSize="36">{symbol}</text>
      <text x="50" y="95" textAnchor="middle" fontSize="11" fontWeight="bold" fill={specialColor}>{primaryLabel}</text>
      {secondaryLabel && (
        <text x="50" y="112" textAnchor="middle" fontSize="10" fill="#8a9ab5">{secondaryLabel}</text>
      )}
    </svg>
    </div>
  );
}
