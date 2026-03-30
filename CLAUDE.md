# BaKCity-Skullking

Jeu de cartes Skull King multijoueur en ligne.

## Stack
- Backend: Node.js + Express + TypeScript + Socket.IO
- Frontend: React 19 + Vite + TypeScript + Socket.IO client
- Monorepo: backend/ et frontend/

## Conventions
- Events Socket.IO: `snake_case`
- Composants React: `PascalCase.tsx`
- Hooks: `use*.ts`
- Types/Interfaces: `PascalCase`, prefixe `I` pour les interfaces de modele
- Constantes: `UPPER_SNAKE_CASE`
- Handlers: `handle*`
- Callback props: `on*`
- Booleens: prefixes `is`, `has`, `can`, `should`

## Architecture
- `game-logic/` = logique pure, JAMAIS d'import Socket.IO/Express/setTimeout
- `server/events/` = handlers Socket.IO (valident + deleguent a game-logic)
- Types canoniques dans `backend/src/game-logic/models/index.ts`
- Types dupliques dans `frontend/src/types/game.ts`

## Commands
- `npm run dev` — lance backend + frontend en parallele
- `npm run dev:backend` — backend seul (port 3001)
- `npm run dev:frontend` — frontend seul (port 5173)
- `npm test` — tests backend (vitest)
- `npm run build` — build prod
