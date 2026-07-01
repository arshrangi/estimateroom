<script setup lang="ts">
// ABOUTME: The room surface. Opens a WebSocket to the room's Durable Object and holds the authoritative state.
// ABOUTME: Walking-skeleton stage: it shows connection status and the participant count from the state snapshot.
import { PartySocket } from 'partysocket'
import type { RoomState } from '~~/shared/protocol'
import { ServerMessageSchema } from '~~/shared/protocol'

const route = useRoute()
const roomId = computed(() => String(route.params.roomId))

const state = ref<RoomState | null>(null)
const status = ref<'connecting' | 'open' | 'closed'>('connecting')
let socket: PartySocket | null = null

onMounted(() => {
  const host = useRuntimeConfig().public.partyHost
  socket = new PartySocket({ host, party: 'room', room: roomId.value })
  socket.addEventListener('open', () => (status.value = 'open'))
  socket.addEventListener('close', () => (status.value = 'closed'))
  socket.addEventListener('message', (event) => {
    const parsed = ServerMessageSchema.safeParse(JSON.parse(event.data))
    if (parsed.success && parsed.data.type === 'state') state.value = parsed.data.state
  })
})

onBeforeUnmount(() => socket?.close())
</script>

<template>
  <main>
    <p>Room {{ roomId }} — {{ status }}</p>
    <p v-if="state">Connected. Participants: {{ state.participants.length }}</p>
  </main>
</template>
