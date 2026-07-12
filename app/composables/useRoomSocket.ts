// ABOUTME: Manages the room WebSocket: connect, (re)announce join on every open, route messages to the store.
// ABOUTME: partysocket auto-reconnects with backoff; we also retry immediately on demand and when the browser wakes.
import { PartySocket } from 'partysocket'
import type { ClientMessage, ErrorCode } from '~~/shared/protocol'
import { ServerMessageSchema } from '~~/shared/protocol'

export type ConnectionStatus = 'connecting' | 'open' | 'reconnecting' | 'closed'

export function useRoomSocket(roomId: string) {
  const store = useRoomStore()
  const { identity } = useIdentity()
  const status = ref<ConnectionStatus>('connecting')
  const error = ref<ErrorCode | null>(null)
  let socket: PartySocket | null = null
  let closing = false

  function announceJoin() {
    const join: ClientMessage = {
      type: 'join',
      participantId: identity.value.participantId,
      name: identity.value.name,
      avatar: identity.value.avatar,
      role: identity.value.observer ? 'observer' : 'voter',
    }
    socket?.send(JSON.stringify(join))
  }

  // Skip the backoff wait and reopen now. No-op if the socket is healthy or we
  // closed it on purpose (a refresh, or a fatal room error).
  function reconnect() {
    if (closing || !socket || status.value === 'open') return
    status.value = 'reconnecting'
    socket.reconnect()
  }

  // The tab regaining focus is a strong signal a stalled socket can reopen now.
  function reconnectWhenVisible() {
    if (document.visibilityState === 'visible') reconnect()
  }

  function connect() {
    closing = false
    socket = new PartySocket({
      host: useRuntimeConfig().public.partyHost,
      party: 'room',
      room: roomId,
      // The default backoff waits 3s–10s between tries, long enough to look stuck.
      // Tighten it so a dropped socket reopens within ~0.5s–4s.
      minReconnectionDelay: 500,
      maxReconnectionDelay: 4000,
    })

    store.bindTransport((msg) => socket?.send(JSON.stringify(msg)))

    socket.addEventListener('open', () => {
      status.value = 'open'
      announceJoin() // re-announce on reconnect so the DO replays state
    })

    // partysocket keeps retrying after a drop; surface that as "reconnecting" unless we closed on purpose.
    socket.addEventListener('close', () => {
      status.value = closing ? 'closed' : 'reconnecting'
    })

    socket.addEventListener('message', (event: MessageEvent) => {
      let data: unknown
      try {
        data = JSON.parse(event.data)
      } catch {
        return
      }
      const parsed = ServerMessageSchema.safeParse(data)
      if (!parsed.success) return
      const msg = parsed.data
      if (msg.type === 'state') {
        store.applyState(msg.state)
        // Keep our hand in sync with the server's view of our vote. Once revealed, votes are
        // public and authoritative, so sync unconditionally (including back to null on clear).
        // Pre-reveal, broadcasts mask votes to null, so only restore a real reconnect snapshot.
        const me = msg.state.participants.find((p) => p.id === identity.value.participantId)
        if (me && (msg.state.revealed || me.vote !== null)) store.setMyVote(me.vote)
      } else if (msg.type === 'voteStatusChanged') {
        store.applyVoteStatus(msg.participantId, msg.hasVoted)
      } else if (msg.type === 'error') {
        error.value = msg.code
        closing = true // a fatal room error: stop reconnecting
        status.value = 'closed'
        socket?.close()
      }
    })

    if (import.meta.client) {
      window.addEventListener('online', reconnect)
      document.addEventListener('visibilitychange', reconnectWhenVisible)
    }
  }

  function disconnect() {
    closing = true
    if (import.meta.client) {
      window.removeEventListener('online', reconnect)
      document.removeEventListener('visibilitychange', reconnectWhenVisible)
    }
    socket?.close()
    socket = null
    store.unbindTransport()
    store.reset()
  }

  return { status, error, connect, disconnect, reconnect }
}
