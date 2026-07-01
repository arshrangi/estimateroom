// ABOUTME: Manages the room WebSocket: connect, (re)announce join on every open, route messages to the store.
// ABOUTME: partysocket auto-reconnects with backoff; on reconnect the DO replays state and our own vote is restored.
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

  function connect() {
    closing = false
    socket = new PartySocket({ host: useRuntimeConfig().public.partyHost, party: 'room', room: roomId })

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
        // Restore our own selection after a reconnect (the personalized snapshot includes our vote).
        const me = msg.state.participants.find((p) => p.id === identity.value.participantId)
        if (me && me.vote !== null) store.setMyVote(me.vote)
      } else if (msg.type === 'voteStatusChanged') {
        store.applyVoteStatus(msg.participantId, msg.hasVoted)
      } else if (msg.type === 'error') {
        error.value = msg.code
        closing = true // a fatal room error: stop reconnecting
        status.value = 'closed'
        socket?.close()
      }
    })
  }

  function disconnect() {
    closing = true
    socket?.close()
    socket = null
    store.reset()
  }

  return { status, error, connect, disconnect }
}
