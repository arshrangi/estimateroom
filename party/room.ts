// ABOUTME: The authoritative per-room WebSocket server; one Durable Object instance per room.
// ABOUTME: Owns presence, deck, hidden votes, and reveal. Vote values never leave the DO until reveal.
import { Server, type Connection, type WSMessage } from 'partyserver'
import { ClientMessageSchema, type ChangeDeckMessage, type JoinMessage, type Participant, type RevealMode, type RoomState, type ServerMessage } from '../shared/protocol'
import { emptyRoomState, publicParticipant } from '../shared/room'
import type { Env } from './env'

interface ConnState {
  participant: Participant
}

const HOST_KEY = 'hostId'
const DECK_KEY = 'deck'
const REVEALED_KEY = 'revealed'
const REVEALMODE_KEY = 'revealMode'

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
    else if (msg.type === 'setRevealMode') await this.handleSetRevealMode(connection, msg.mode)
    else if (msg.type === 'reveal') await this.handleReveal(connection)
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

  async handleVote(connection: Connection, card: string) {
    const participant = (connection.state as ConnState | null)?.participant
    if (!participant || participant.role === 'observer') return
    const deck = (await this.ctx.storage.get<string[]>(DECK_KEY)) ?? null
    if (!deck || !deck.includes(card)) return // INVALID_VOTE (typed error surfaces in a later story)
    // The value is stored server-side only; it never leaves the DO until reveal.
    connection.setState({ participant: { ...participant, vote: card, hasVoted: true } } satisfies ConnState)
    this.broadcast(encode({ type: 'voteStatusChanged', participantId: participant.id, hasVoted: true }))

    const mode = (await this.ctx.storage.get<RevealMode>(REVEALMODE_KEY)) ?? 'host'
    if (mode === 'auto' && this.allVotersVoted()) await this.reveal()
  }

  handleClearVote(connection: Connection) {
    const participant = (connection.state as ConnState | null)?.participant
    if (!participant) return
    connection.setState({ participant: { ...participant, vote: null, hasVoted: false } } satisfies ConnState)
    this.broadcast(encode({ type: 'voteStatusChanged', participantId: participant.id, hasVoted: false }))
  }

  async handleChangeDeck(connection: Connection, msg: ChangeDeckMessage) {
    if (!(await this.isHost(connection))) return
    await this.ctx.storage.put(DECK_KEY, msg.cards)
    this.broadcast(encode({ type: 'deckChanged', deck: msg.cards }))
  }

  async handleSetRevealMode(connection: Connection, mode: RevealMode) {
    if (!(await this.isHost(connection))) return
    await this.ctx.storage.put(REVEALMODE_KEY, mode)
    await this.broadcastState()
  }

  async handleReveal(connection: Connection) {
    if (!(await this.isHost(connection))) return
    await this.reveal()
  }

  async reveal() {
    await this.ctx.storage.put(REVEALED_KEY, true)
    await this.broadcastState()
  }

  onClose(connection: Connection) {
    const participant = (connection.state as ConnState | null)?.participant
    if (!participant) return
    this.broadcast(encode({ type: 'participantLeft', participantId: participant.id }))
  }

  async isHost(connection: Connection): Promise<boolean> {
    const hostId = (await this.ctx.storage.get<string>(HOST_KEY)) ?? null
    const id = (connection.state as ConnState | null)?.participant?.id
    return !!id && id === hostId
  }

  allVotersVoted(): boolean {
    const voters = [...this.getConnections<ConnState>()]
      .map((c) => c.state?.participant)
      .filter((p): p is Participant => !!p && p.role === 'voter')
    return voters.length > 0 && voters.every((p) => p.hasVoted)
  }

  async broadcastState() {
    this.broadcast(encode({ type: 'state', state: await this.buildState() }))
  }

  async buildState(): Promise<RoomState> {
    const hostId = (await this.ctx.storage.get<string>(HOST_KEY)) ?? null
    const deck = (await this.ctx.storage.get<string[]>(DECK_KEY)) ?? null
    const revealed = (await this.ctx.storage.get<boolean>(REVEALED_KEY)) ?? false
    const revealMode = (await this.ctx.storage.get<RevealMode>(REVEALMODE_KEY)) ?? 'host'
    const byId = new Map<string, Participant>()
    for (const c of this.getConnections<ConnState>()) {
      const participant = c.state?.participant
      if (participant) byId.set(participant.id, publicParticipant(participant, revealed))
    }
    return { ...emptyRoomState(this.name), hostId, deck, revealed, revealMode, participants: [...byId.values()] }
  }
}
