import { theme } from '../../styles/theme';

export default function RulesBook() {
  return (
    <div style={css.container}>
      {/* But du jeu */}
      <section style={css.section}>
        <h3 style={css.heading}>But du jeu</h3>
        <p style={css.text}>
          Skull King est un jeu de plis en <strong style={css.gold}>10 manches</strong>.
          Chaque manche, vous recevez autant de cartes que le num&eacute;ro de la manche
          (1 carte en manche 1, 2 en manche 2... 10 en manche 10).
        </p>
        <p style={css.text}>
          Le but est de <strong style={css.gold}>pr&eacute;dire exactement</strong> le nombre
          de plis que vous allez remporter. Une pr&eacute;diction juste rapporte des points,
          une erreur en fait perdre.
        </p>
      </section>

      {/* Déroulement */}
      <section style={css.section}>
        <h3 style={css.heading}>D&eacute;roulement</h3>
        <ol style={css.list}>
          <li style={css.listItem}>
            <strong style={css.gold}>Distribution</strong> &mdash; Chaque joueur re&ccedil;oit ses cartes.
          </li>
          <li style={css.listItem}>
            <strong style={css.gold}>Mises</strong> &mdash; Chacun annonce combien de plis il pense gagner (0 &agrave; N).
          </li>
          <li style={css.listItem}>
            <strong style={css.gold}>Plis</strong> &mdash; &Agrave; tour de r&ocirc;le, chaque joueur joue une carte.
            Le plus fort remporte le pli.
          </li>
          <li style={css.listItem}>
            <strong style={css.gold}>Score</strong> &mdash; Les points sont calcul&eacute;s selon les mises et les plis remport&eacute;s.
          </li>
        </ol>
      </section>

      {/* Hiérarchie */}
      <section style={css.section}>
        <h3 style={css.heading}>Hi&eacute;rarchie des cartes</h3>
        <p style={css.text}>Ordre de force g&eacute;n&eacute;ral :</p>
        <div style={css.hierarchy}>
          <span style={{ ...css.badge, background: theme.special.escape }}>Fuite</span>
          <span style={css.arrow}>&rarr;</span>
          <span style={{ ...css.badge, background: '#4a6741' }}>Couleurs</span>
          <span style={css.arrow}>&rarr;</span>
          <span style={{ ...css.badge, background: '#555' }}>Noir (atout)</span>
          <span style={css.arrow}>&rarr;</span>
          <span style={{ ...css.badge, background: theme.special.pirate }}>Pirate</span>
          <span style={css.arrow}>&rarr;</span>
          <span style={{ ...css.badge, background: '#b8860b' }}>Skull King</span>
        </div>
        <p style={css.textSmall}>
          <strong>Triangle sp&eacute;cial</strong> : Le Pirate bat la Sir&egrave;ne.
          La Sir&egrave;ne bat le Skull King. Le Skull King bat le Pirate.
        </p>
        <p style={css.textSmall}>
          La <strong>couleur d'entame</strong> (1re carte num&eacute;rot&eacute;e jou&eacute;e)
          d&eacute;termine la couleur du pli. Les cartes hors-couleur ne peuvent pas gagner
          (sauf atout noir et sp&eacute;ciales).
        </p>
      </section>

      {/* Cartes numérotées */}
      <section style={css.section}>
        <h3 style={css.heading}>Cartes num&eacute;rot&eacute;es</h3>
        <p style={css.text}>4 couleurs de 1 &agrave; 14 (56 cartes) :</p>
        <div style={css.colorRow}>
          <span style={{ color: theme.suits.treasure_chest }}>&#x1F7E1; Jaune</span>
          <span style={{ color: theme.suits.parrot }}>&#x1F7E2; Vert</span>
          <span style={{ color: theme.suits.treasure_map }}>&#x1F7E3; Violet</span>
          <span style={{ color: theme.suits.jolly_roger }}>&#x26AB; Noir (atout)</span>
        </div>
        <p style={css.textSmall}>
          Le <strong>Noir</strong> est l'atout : il bat toutes les autres couleurs,
          quelle que soit la valeur.
        </p>
      </section>

      {/* Captures spéciales */}
      <section style={css.section}>
        <h3 style={css.heading}>Captures sp&eacute;ciales</h3>
        <div style={css.ruleBlock}>
          <p style={css.text}>
            <span style={{ color: '#0891b2' }}>&#x1F9DC; Sir&egrave;ne</span> bat le
            <span style={{ color: '#b8860b' }}> &#x1F451; Skull King</span> &rarr;
            <strong style={css.green}> +40 bonus</strong>
          </p>
          <p style={css.text}>
            <span style={{ color: '#b8860b' }}>&#x1F451; Skull King</span> bat les
            <span style={{ color: theme.special.pirate }}> &#x2694; Pirates</span> &rarr;
            <strong style={css.green}> +30 par pirate</strong>
          </p>
          <p style={css.text}>
            <span style={{ color: theme.special.pirate }}>&#x2694; Pirate</span> bat les
            <span style={{ color: '#0891b2' }}> &#x1F9DC; Sir&egrave;nes</span> &rarr;
            <strong style={css.green}> +20 par sir&egrave;ne</strong>
          </p>
          <p style={css.text}>
            Capturer un <strong>14</strong> adverse &rarr;
            <strong style={css.green}> +10</strong> (ou <strong style={css.green}>+20</strong> pour un 14 noir)
          </p>
        </div>
      </section>

      {/* Cartes spéciales */}
      <section style={css.section}>
        <h3 style={css.heading}>Cartes sp&eacute;ciales</h3>

        <div style={css.cardRule}>
          <span style={{ color: theme.special.escape }}>&#x1F3F3; Fuite (x5)</span>
          <p style={css.textSmall}>Ne gagne jamais. Se joue &agrave; tout moment.</p>
        </div>

        <div style={css.cardRule}>
          <span style={{ color: theme.special.pirate }}>&#x2694; Pirate (x5)</span>
          <p style={css.textSmall}>Bat toutes les cartes num&eacute;rot&eacute;es. Le 1er pirate jou&eacute; l'emporte si plusieurs.</p>
        </div>

        <div style={css.cardRule}>
          <span style={{ color: theme.special.siren }}>&#x1F9DC; Sir&egrave;ne (x2)</span>
          <p style={css.textSmall}>Bat le Skull King (+40 bonus). Battue par les pirates. Bat les cartes num&eacute;rot&eacute;es.</p>
        </div>

        <div style={css.cardRule}>
          <span style={{ color: theme.special.skull_king }}>&#x1F451; Skull King (x1)</span>
          <p style={css.textSmall}>Bat tout sauf les sir&egrave;nes. Le plus puissant du jeu.</p>
        </div>

        <div style={css.cardRule}>
          <span style={{ color: theme.special.tigress }}>&#x1F405; Tigresse (x1)</span>
          <p style={css.textSmall}>Au moment de la jouer, choisissez : Pirate ou Fuite.</p>
        </div>

        <div style={css.cardRule}>
          <span style={{ color: theme.special.kraken }}>&#x1F419; Kraken (x1)</span>
          <p style={css.textSmall}>D&eacute;truit le pli : personne ne le remporte.</p>
        </div>

        <div style={css.cardRule}>
          <span style={{ color: theme.special.white_whale }}>&#x1F433; Baleine Blanche (x1)</span>
          <p style={css.textSmall}>Annule toutes les sp&eacute;ciales. La plus haute carte num&eacute;rot&eacute;e (toutes couleurs confondues) gagne.</p>
        </div>

        <div style={css.cardRule}>
          <span style={{ color: theme.special.loot }}>&#x1F4B0; Butin (x2)</span>
          <p style={css.textSmall}>Comme une fuite. Alliance : donne un bonus au vainqueur du pli si <strong>les deux</strong> (joueur du butin + vainqueur) r&eacute;ussissent leur mise.</p>
        </div>
      </section>

      {/* Pouvoirs des pirates */}
      <section style={css.section}>
        <h3 style={css.heading}>Pouvoirs des pirates</h3>
        <p style={css.textSmall}>Activ&eacute;s quand le pirate remporte le pli :</p>

        <div style={css.cardRule}>
          <strong style={{ color: theme.special.pirate }}>Rosie</strong>
          <p style={css.textSmall}>Choisit quel joueur m&egrave;ne le prochain pli.</p>
        </div>
        <div style={css.cardRule}>
          <strong style={{ color: theme.special.pirate }}>Will</strong>
          <p style={css.textSmall}>Pioche 2 cartes puis d&eacute;fausse 2 cartes de sa main.</p>
        </div>
        <div style={css.cardRule}>
          <strong style={{ color: theme.special.pirate }}>Rascal</strong>
          <p style={css.textSmall}>Parie 0, 10 ou 20 points suppl&eacute;mentaires sur sa mise.</p>
        </div>
        <div style={css.cardRule}>
          <strong style={{ color: theme.special.pirate }}>Juanita</strong>
          <p style={css.textSmall}>Regarde les cartes non distribu&eacute;es.</p>
        </div>
        <div style={css.cardRule}>
          <strong style={{ color: theme.special.pirate }}>Harry</strong>
          <p style={css.textSmall}>En fin de manche, ajuste sa mise de -1, 0 ou +1 avant le calcul des scores.</p>
        </div>
      </section>

      {/* Scoring */}
      <section style={css.section}>
        <h3 style={css.heading}>Scoring</h3>

        <h4 style={css.subHeading}>Points de base</h4>
        <ul style={css.list}>
          <li style={css.listItem}><strong>Mise 0 r&eacute;ussie</strong> : +10 &times; num&eacute;ro de manche</li>
          <li style={css.listItem}><strong>Mise &ge; 1 r&eacute;ussie</strong> : +20 par pli mis&eacute;</li>
          <li style={css.listItem}><strong>Mise 0 rat&eacute;e</strong> : -10 &times; num&eacute;ro de manche</li>
          <li style={css.listItem}><strong>Mise &ge; 1 rat&eacute;e</strong> : -10 par pli d'&eacute;cart</li>
        </ul>

        <h4 style={css.subHeading}>Bonus de capture (toujours compt&eacute;s)</h4>
        <p style={css.textSmall}>
          Les bonus sont gagn&eacute;s <strong>ind&eacute;pendamment</strong> de la r&eacute;ussite de la mise :
        </p>
        <ul style={css.list}>
          <li style={css.listItem}>Capturer un <strong>14 couleur</strong> : +10</li>
          <li style={css.listItem}>Capturer un <strong>14 noir</strong> : +20</li>
          <li style={css.listItem}><strong>Skull King</strong> capture un pirate : +30 par pirate</li>
          <li style={css.listItem}><strong>Sir&egrave;ne</strong> capture le Skull King : +40</li>
        </ul>
      </section>
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  container: {
    padding: '4px 0',
  },
  section: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  heading: {
    fontSize: 13,
    color: theme.colors.gold,
    marginBottom: 8,
    marginTop: 0,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subHeading: {
    fontSize: 11,
    color: theme.colors.text,
    marginBottom: 4,
    marginTop: 10,
  },
  text: {
    fontSize: 11,
    color: theme.colors.textDim,
    lineHeight: 1.5,
    margin: '4px 0',
  },
  textSmall: {
    fontSize: 10,
    color: theme.colors.textDim,
    lineHeight: 1.4,
    margin: '2px 0',
  },
  gold: {
    color: theme.colors.gold,
  },
  green: {
    color: theme.colors.green,
  },
  list: {
    margin: '4px 0',
    paddingLeft: 20,
  },
  listItem: {
    fontSize: 11,
    color: theme.colors.textDim,
    lineHeight: 1.6,
  },
  hierarchy: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
    margin: '8px 0',
  },
  badge: {
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  arrow: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  colorRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    fontSize: 11,
    fontWeight: 'bold',
    margin: '6px 0',
  },
  ruleBlock: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 6,
    padding: '6px 8px',
  },
  cardRule: {
    marginBottom: 6,
    paddingLeft: 4,
  },
};
