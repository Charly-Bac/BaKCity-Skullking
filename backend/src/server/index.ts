import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerAllEvents } from './events';

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);
  registerAllEvents(socket, io);

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/debug/games', (_req, res) => {
  const { gameManager } = require('./GameManager');
  const games: any[] = [];
  // Access private map via any
  const gm = gameManager as any;
  if (gm.games) {
    for (const [id, game] of gm.games) {
      games.push({
        id,
        roomCode: game.roomCode,
        phase: game.phase,
        roundNumber: game.roundNumber,
        playerCount: game.players.length,
        players: game.players.map((p: any) => ({
          id: p.id, name: p.name, isBot: p.isBot,
          bid: p.roundState.bid, tricksWon: p.roundState.tricksWon,
          handSize: p.hand.length,
        })),
        currentPlayerIndex: game.currentPlayerIndex,
        trickCount: game.currentRound?.tricks?.length ?? 0,
      });
    }
  }
  res.json({ games });
});

app.get('/debug/scores/:roomCode', (req, res) => {
  const { gameManager } = require('./GameManager');
  const game = gameManager.getGameByRoomCode(req.params.roomCode);
  if (!game) return res.json({ error: 'Game not found' });

  res.json({
    roomCode: game.roomCode,
    phase: game.phase,
    roundNumber: game.roundNumber,
    scoringMode: game.config.scoringMode,
    players: game.players.map((p: any) => ({
      id: p.id, name: p.name, isBot: p.isBot, totalScore: p.score,
    })),
    roundScores: game.scores,
    logs: game.logs.slice(-100),
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Server] Skull King running on port ${PORT}`);
});

export { io };
