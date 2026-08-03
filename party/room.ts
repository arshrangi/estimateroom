// ABOUTME: The authoritative per-room WebSocket server; one Durable Object instance per room.
// ABOUTME: Participants + votes live in durable storage so a refresh restores identity and vote; connected is derived.
import { Server, type Connection, type WSMessage } from 'partyserver'
import type { AvatarTint } from '../shared/avatars'
import { withQuestionCard } from '../shared/decks'
import { ClientMessageSchema, type ChangeDeckMessage, type JoinMessage, type Participant, type RevealMode, type Role, type RoomState, type ServerMessage, type SetRoleMessage } from '../shared/protocol'
import { publicParticipant } from '../shared/room'
import type { Env } from './env'

/** What we persist per participant. Vote survives disconnects; `connected` is derived from live sockets. */
interface PersistedParticipant {
  id: string
  name: string
  avatar: AvatarTint | null
  role: Role
  vote: string | null
}

type Registry = Record<string, PersistedParticipant>
interface ConnState {
  pid: string
}

const DEFAULT_IDLE_EXPIRY_MS = 60 * 60 * 1000
const DEFAULT_HOST_GRACE_MS = 10 * 1000
const PARTICIPANTS_KEY = 'participants'
const EXPIRED_KEY = 'expired'
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
    else if (msg.type === 'clearVote') await this.handleClearVote(connection)
    else if (msg.type === 'setRevealMode') await this.handleSetRevealMode(connection, msg.mode)
    else if (msg.type === 'reveal') await this.handleReveal(connection)
    else if (msg.type === 'next') await this.handleRoundReset(connection)
    else if (msg.type === 'kick') await this.handleKick(connection, msg.participantId)
    else if (msg.type === 'makeHost') await this.handleMakeHost(connection, msg.participantId)
    else if (msg.type === 'setRole') await this.handleSetRole(connection, msg)
    else if (msg.type === 'leave') await this.handleLeave(connection)
  }

  async handleMakeHost(connection: Connection, participantId: string) {
    if (!(await this.isHost(connection))) return
    const registry = await this.getRegistry()
    if (!registry[participantId]) return
    await this.ctx.storage.put(HOST_KEY, participantId)
    await this.broadcastState()
  }

  // Anyone may opt themselves out of voting, or back in; the host may also set it for someone else.
  async handleSetRole(connection: Connection, msg: SetRoleMessage) {
    const pid = this.pidOf(connection)
    if (!pid) return
    if (msg.participantId !== pid && !(await this.isHost(connection))) return
    const registry = await this.getRegistry()
    const p = registry[msg.participantId]
    if (!p || p.role === msg.role) return
    p.role = msg.role

    // Pre-reveal, a hidden vote from someone who is no longer voting would surface at reveal.
    // Post-reveal the value is already public, so it stays and keeps counting.
    const revealed = (await this.ctx.storage.get<boolean>(REVEALED_KEY)) ?? false
    if (msg.role === 'observer' && !revealed) p.vote = null

    await this.putRegistry(registry)

    // Opting out can be what completes the round; reveal() broadcasts, so return after it.
    const mode = (await this.ctx.storage.get<RevealMode>(REVEALMODE_KEY)) ?? 'host'
    if (!revealed && mode === 'auto' && this.allVotersVoted(registry)) {
      await this.reveal()
      return
    }
    await this.broadcastState()
  }

  async handleJoin(connection: Connection, msg: JoinMessage) {
    if (await this.ctx.storage.get<boolean>(EXPIRED_KEY)) {
      connection.send(encode({ type: 'error', code: 'ROOM_EXPIRED', message: 'This room has expired.' }))
      connection.close(1000, 'expired')
      return
    }
    const registry = await this.getRegistry()
    let hostId = (await this.ctx.storage.get<string>(HOST_KEY)) ?? null
    if (!hostId) {
      hostId = msg.participantId
      await this.ctx.storage.put(HOST_KEY, hostId)
    }
    const existing = registry[msg.participantId]
    registry[msg.participantId] = {
      id: msg.participantId,
      name: msg.name,
      avatar: msg.avatar,
      role: existing?.role ?? msg.role, // the room owns the role once you are in; join only seeds it
      vote: existing?.vote ?? null, // reconnect restores the prior vote
    }
    await this.putRegistry(registry)
    await this.ctx.storage.deleteAlarm() // someone is here now; cancel any pending idle expiry
    connection.setState({ pid: msg.participantId } satisfies ConnState)

    // Personalized snapshot: the joiner sees their own vote; everyone else gets the shared (secret) view.
    connection.send(encode({ type: 'state', state: await this.buildState(msg.participantId) }))
    this.broadcast(encode({ type: 'state', state: await this.buildState() }), [connection.id])
  }

  async handleVote(connection: Connection, card: string) {
    const pid = this.pidOf(connection)
    if (!pid) return
    const registry = await this.getRegistry()
    const p = registry[pid]
    if (!p || p.role === 'observer') return
    const deck = (await this.ctx.storage.get<string[]>(DECK_KEY)) ?? null
    if (!deck || !deck.includes(card)) return // INVALID_VOTE (typed error surfaces in a later story)
    p.vote = card // stored server-side only; never broadcast before reveal
    await this.putRegistry(registry)

    // After reveal, votes are public: broadcast the full state so the change shows live.
    if ((await this.ctx.storage.get<boolean>(REVEALED_KEY)) ?? false) {
      await this.broadcastState()
      return
    }

    this.broadcast(encode({ type: 'voteStatusChanged', participantId: pid, hasVoted: true }))

    const mode = (await this.ctx.storage.get<RevealMode>(REVEALMODE_KEY)) ?? 'host'
    if (mode === 'auto' && this.allVotersVoted(registry)) await this.reveal()
  }

  async handleClearVote(connection: Connection) {
    const pid = this.pidOf(connection)
    if (!pid) return
    const registry = await this.getRegistry()
    const p = registry[pid]
    if (!p) return
    p.vote = null
    await this.putRegistry(registry)

    // After reveal, votes are public: broadcast the full state so the change shows live.
    if ((await this.ctx.storage.get<boolean>(REVEALED_KEY)) ?? false) {
      await this.broadcastState()
      return
    }

    this.broadcast(encode({ type: 'voteStatusChanged', participantId: pid, hasVoted: false }))
  }

  async handleChangeDeck(connection: Connection, msg: ChangeDeckMessage) {
    if (!(await this.isHost(connection))) return
    await this.ctx.storage.put(DECK_KEY, withQuestionCard(msg.cards))
    // Changing the deck clears the round: old card values may not exist in the new deck.
    await this.clearAllVotes()
    await this.ctx.storage.put(REVEALED_KEY, false)
    await this.broadcastState()
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

  // Next resets the round: clear votes and un-reveal (no stored item; re-voting the same item is just another round).
  async handleRoundReset(connection: Connection) {
    if (!(await this.isHost(connection))) return
    await this.clearAllVotes()
    await this.ctx.storage.put(REVEALED_KEY, false)
    await this.broadcastState()
  }

  async handleKick(connection: Connection, participantId: string) {
    if (!(await this.isHost(connection))) return
    const registry = await this.getRegistry()
    if (!registry[participantId]) return
    const next: Registry = {}
    for (const [id, p] of Object.entries(registry)) if (id !== participantId) next[id] = p
    await this.putRegistry(next)
    for (const c of this.getConnections<ConnState>()) {
      if (c.state?.pid === participantId) c.close(1000, 'Removed by host')
    }
    await this.broadcastState()
  }

  // An intentional exit (logo navigation): remove the leaver from the roster, unlike a
  // disconnect, which keeps them greyed out. If they were host, hand off immediately
  // rather than waiting out the disconnect grace.
  async handleLeave(connection: Connection) {
    const pid = this.pidOf(connection)
    if (!pid) return
    const registry = await this.getRegistry()
    if (!registry[pid]) return
    const next: Registry = {}
    for (const [id, p] of Object.entries(registry)) if (id !== pid) next[id] = p
    await this.putRegistry(next)

    const hostId = (await this.ctx.storage.get<string>(HOST_KEY)) ?? null
    if (hostId === pid) {
      // Clear first so that if nobody is connected, the next joiner becomes host
      // (handleJoin promotes the first joiner when no host is stored).
      await this.ctx.storage.delete(HOST_KEY)
      await this.reassignHost(this.connectedIds(connection.id))
    }
    connection.close(1000, 'left')
    await this.broadcastState()
  }

  async onClose(connection: Connection) {
    // A socket dropped: the participant stays in the registry but is now derived as disconnected.
    this.broadcast(encode({ type: 'state', state: await this.buildState(undefined, connection.id) }))
    const connected = this.connectedIds(connection.id)
    const hostId = (await this.ctx.storage.get<string>(HOST_KEY)) ?? null
    if (connected.size === 0) {
      // Empty room: start the idle-expiry countdown.
      await this.ctx.storage.setAlarm(Date.now() + this.idleExpiryMs())
    } else if (hostId && !connected.has(hostId)) {
      // Host left but others remain: give a short grace for them to reconnect before we reassign.
      await this.ctx.storage.setAlarm(Date.now() + this.hostGraceMs())
    }
  }

  async onAlarm() {
    const connected = this.connectedIds()
    if (connected.size === 0) {
      // Expire: wipe state, but leave a tombstone so a later visit can be told the room expired.
      await this.ctx.storage.deleteAll()
      await this.ctx.storage.put(EXPIRED_KEY, true)
      return
    }
    const hostId = (await this.ctx.storage.get<string>(HOST_KEY)) ?? null
    if (hostId && !connected.has(hostId)) await this.reassignHost(connected)
  }

  async reassignHost(connected: Set<string>) {
    const ordered = Object.values(await this.getRegistry()) // insertion order = join order
    const next = ordered.find((p) => p.role === 'voter' && connected.has(p.id)) ?? ordered.find((p) => connected.has(p.id))
    if (!next) return
    await this.ctx.storage.put(HOST_KEY, next.id)
    await this.broadcastState()
  }

  idleExpiryMs(): number {
    const override = Number(this.env.IDLE_EXPIRY_MS)
    return Number.isFinite(override) && override > 0 ? override : DEFAULT_IDLE_EXPIRY_MS
  }

  hostGraceMs(): number {
    const override = Number(this.env.HOST_GRACE_MS)
    return Number.isFinite(override) && override > 0 ? override : DEFAULT_HOST_GRACE_MS
  }

  async reveal() {
    await this.ctx.storage.put(REVEALED_KEY, true)
    await this.broadcastState()
  }

  async clearAllVotes() {
    const registry = await this.getRegistry()
    for (const p of Object.values(registry)) p.vote = null
    await this.putRegistry(registry)
  }

  async isHost(connection: Connection): Promise<boolean> {
    const hostId = (await this.ctx.storage.get<string>(HOST_KEY)) ?? null
    const pid = this.pidOf(connection)
    return !!pid && pid === hostId
  }

  allVotersVoted(registry: Registry): boolean {
    const connected = this.connectedIds()
    const voters = Object.values(registry).filter((p) => p.role === 'voter' && connected.has(p.id))
    return voters.length > 0 && voters.every((p) => p.vote !== null)
  }

  pidOf(connection: Connection): string | undefined {
    return (connection.state as ConnState | null)?.pid
  }

  // excludeConnId lets onClose ignore the socket that is currently closing (it may still be listed).
  connectedIds(excludeConnId?: string): Set<string> {
    const ids = new Set<string>()
    for (const c of this.getConnections<ConnState>()) {
      if (c.id === excludeConnId) continue
      const pid = c.state?.pid
      if (pid) ids.add(pid)
    }
    return ids
  }

  async getRegistry(): Promise<Registry> {
    return (await this.ctx.storage.get<Registry>(PARTICIPANTS_KEY)) ?? {}
  }
  async putRegistry(registry: Registry) {
    await this.ctx.storage.put(PARTICIPANTS_KEY, registry)
  }

  async broadcastState() {
    this.broadcast(encode({ type: 'state', state: await this.buildState() }))
  }

  async buildState(viewerId?: string, excludeConnId?: string): Promise<RoomState> {
    const registry = await this.getRegistry()
    const hostId = (await this.ctx.storage.get<string>(HOST_KEY)) ?? null
    const deck = (await this.ctx.storage.get<string[]>(DECK_KEY)) ?? null
    const revealed = (await this.ctx.storage.get<boolean>(REVEALED_KEY)) ?? false
    const revealMode = (await this.ctx.storage.get<RevealMode>(REVEALMODE_KEY)) ?? 'host'
    const connected = this.connectedIds(excludeConnId)
    const participants = Object.values(registry).map((rp) => {
      const full: Participant = {
        id: rp.id,
        name: rp.name,
        avatar: rp.avatar,
        role: rp.role,
        connected: connected.has(rp.id),
        hasVoted: rp.vote !== null,
        vote: rp.vote,
      }
      return publicParticipant(full, revealed, viewerId)
    })
    return { roomId: this.name, deck, revealMode, hostId, revealed, participants }
  }
}
