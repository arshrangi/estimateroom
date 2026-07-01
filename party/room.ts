// ABOUTME: The authoritative per-room WebSocket server; one Durable Object instance per room.
// ABOUTME: Handles join, tracks presence via connection state, and broadcasts join/leave. First joiner is host.
import { Server, type Connection, type WSMessage } from 'partyserver'
import { ClientMessageSchema, type ChangeDeckMessage, type JoinMessage, type Participant, type RoomState, type ServerMessage } from '../shared/protocol'
import { emptyRoomState, publicParticipant } from '../shared/room'
import type { Env } from './env'

interface ConnState {
  participant: Participant
}

const HOST_KEY = 'hostId'
const DECK_KEY = 'deck'
const REVEALED_KEY = 'revealed'

function encode(message: ServerMessage): string {
  return JSON.stringify(message)
}

export class Room extends Server<Env> {
  static options = { hibernate: true }

  async onMessage(connection: Connection, message: WSMessage) {
    let data: unknown
    try {
      data = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message as ArrayBuffer))
    } catch {
      return
    }
    const parsed = ClientMessageSchema.safeParse(data)
    if (!parsed.success) return
    const msg = parsed.data
    if (msg.type === 'join') await this.handleJoin(connection, msg)
    else if (msg.type === 'changeDeck') await this.handleChangeDeck(connection, msg)
    else if (msg.type === 'vote') await this.handleVote(connection, msg.card)
    else if (msg.type === 'clearVote') this.handleClearVote(connection)
  }

  async handleVote(connection: Connection, card: string) {
    const participant = (connection.state as ConnState | null)?.participant
    if (!participant || participant.role === 'observer') return
    const deck = (await this.ctx.storage.get<string[]>(DECK_KEY)) ?? null
    if (!deck || !deck.includes(card)) return // INVALID_VOTE (typed error surfaces in a later story)
    // The value is stored server-side only; it never leaves the DO until reveal.
    connection.setState({ participant: { ...participant, vote: card, hasVoted: true } } satisfies ConnState)
    this.broadcast(encode({ type: 'voteStatusChanged', participantId: participant.id, hasVoted: true }))
  }

  handleClearVote(connection: Connection) {
    const participant = (connection.state as ConnState | null)?.participant
    if (!participant) return
    connection.setState({ participant: { ...participant, vote: null, hasVoted: false } } satisfies ConnState)
    this.broadcast(encode({ type: 'voteStatusChanged', participantId: participant.id, hasVoted: false }))
  }

  async handleChangeDeck(connection: Connection, msg: ChangeDeckMessage) {
    const hostId = (await this.ctx.storage.get<string>(HOST_KEY)) ?? null
    const senderId = (connection.state as ConnState | null)?.participant?.id
    if (!senderId || senderId !== hostId) return
    await this.ctx.storage.put(DECK_KEY, msg.cards)
    this.broadcast(encode({ type: 'deckChanged', deck: msg.cards }))
  }

  async handleJoin(connection: Connection, msg: JoinMessage) {
    let hostId = (await this.ctx.storage.get<string>(HOST_KEY)) ?? null
    if (!hostId) {
      hostId = msg.participantId
      await this.ctx.storage.put(HOST_KEY, hostId)
    }

    const participant: Participant = {
      id: msg.participantId,
      name: msg.name,
      avatar: msg.avatar,
      role: msg.role,
      connected: true,
      hasVoted: false,
      vote: null,
    }
    connection.setState({ participant } satisfies ConnState)

    this.broadcast(encode({ type: 'participantJoined', participant }), [connection.id])
    connection.send(encode({ type: 'state', state: await this.buildState() }))
  }

  onClose(connection: Connection) {
    const participant = (connection.state as ConnState | null)?.participant
    if (!participant) return
    this.broadcast(encode({ type: 'participantLeft', participantId: participant.id }))
  }

  async buildState(): Promise<RoomState> {
    const hostId = (await this.ctx.storage.get<string>(HOST_KEY)) ?? null
    const deck = (await this.ctx.storage.get<string[]>(DECK_KEY)) ?? null
    const revealed = (await this.ctx.storage.get<boolean>(REVEALED_KEY)) ?? false
    const byId = new Map<string, Participant>()
    for (const c of this.getConnections<ConnState>()) {
      const participant = c.state?.participant
      if (participant) byId.set(participant.id, publicParticipant(participant, revealed))
    }
    return { ...emptyRoomState(this.name), hostId, deck, revealed, participants: [...byId.values()] }
  }
}
