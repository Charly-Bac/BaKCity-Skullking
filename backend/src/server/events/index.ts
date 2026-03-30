import { Server, Socket } from 'socket.io';
import { registerRoomEvents } from './room';
import { registerBiddingEvents } from './bidding';
import { registerPlayEvents } from './play';
import { registerPiratePowerEvents } from './pirate-power';
import { registerDebugEvents } from './debug';
import { registerReconnectEvents } from './reconnect';

export function registerAllEvents(socket: Socket, io: Server): void {
  registerRoomEvents(socket, io);
  registerBiddingEvents(socket, io);
  registerPlayEvents(socket, io);
  registerPiratePowerEvents(socket, io);
  registerDebugEvents(socket, io);
  registerReconnectEvents(socket, io);
}
