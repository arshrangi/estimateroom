// ABOUTME: The authoritative per-room WebSocket server; one Durable Object instance per room.
// ABOUTME: On connect it sends the full room state. Vote values never leave here before reveal.
import { Server, type Connection } from 'partyserver'
import type { ServerMessage } from '../shared/protocol'
import { emptyRoomState } from '../shared/room'
import type { Env } from './env'

export class Room extends Server<Env> {
  static options = { hibernate: true }

  onConnect(connection: Connection) {
    const message: ServerMessage = { type: 'state', state: emptyRoomState(this.name) }
    connection.send(JSON.stringify(message))
  }
}
