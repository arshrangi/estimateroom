// ABOUTME: Manages the room WebSocket: connect, announce join on open, and route server messages to the store.
// ABOUTME: The store is the read-side replica; this composable is the only thing that talks to the socket.
import { PartySocket } from 'partysocket'
import type { ClientMessage } from '~~/shared/protocol'
import { ServerMessageSchema } from '~~/shared/protocol'

export function useRoomSocket(roomId: string) {
  const store = useRoomStore()
  const { identity } = useIdentity()
  const status = ref<'connecting' | 'open' | 'closed'>('connecting')
  let socket: PartySocket | null = null

  function connect() {
    const host = useRuntimeConfig().public.partyHost
    socket = new PartySocket({ host, party: 'room', room: roomId })

    store.bindTransport((msg) => socket?.send(JSON.stringify(msg)))

    socket.addEventListener('open', () => {
      status.value = 'open'
      const join: ClientMessage = {
        type: 'join',
        participantId: identity.value.participantId,
        name: identity.value.name,
        avatar: identity.value.avatar,
        role: identity.value.observer ? 'observer' : 'voter',
      }
      socket?.send(JSON.stringify(join))
    })

    socket.addEventListener('close', () => (status.value = 'closed'))

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
      if (msg.type === 'state') store.applyState(msg.state)
      else if (msg.type === 'participantJoined') store.applyJoined(msg.participant)
      else if (msg.type === 'participantLeft') store.applyLeft(msg.participantId)
      else if (msg.type === 'deckChanged') store.applyDeckChanged(msg.deck)
    })
  }

  function disconnect() {
    socket?.close()
    socket = null
    store.unbindTransport()
    store.reset()
  }

  return { status, connect, disconnect }
}
