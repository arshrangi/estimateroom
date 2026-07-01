<script setup lang="ts">
// ABOUTME: The room surface. Gates behind the JoinCard, then opens a WebSocket to the room's Durable Object.
// ABOUTME: Walking-skeleton stage: shows connection status and participant count from the state snapshot.
import { PartySocket } from 'partysocket'
import type { RoomState } from '~~/shared/protocol'
import { ServerMessageSchema } from '~~/shared/protocol'

const route = useRoute()
const roomId = computed(() => String(route.params.roomId))

const entered = ref(false)
const state = ref<RoomState | null>(null)
const status = ref<'connecting' | 'open' | 'closed'>('connecting')
let socket: PartySocket | null = null

function connect() {
  const host = useRuntimeConfig().public.partyHost
  socket = new PartySocket({ host, party: 'room', room: roomId.value })
  socket.addEventListener('open', () => (status.value = 'open'))
  socket.addEventListener('close', () => (status.value = 'closed'))
  socket.addEventListener('message', (event) => {
    const parsed = ServerMessageSchema.safeParse(JSON.parse(event.data))
    if (parsed.success && parsed.data.type === 'state') state.value = parsed.data.state
  })
}

function onJoin() {
  entered.value = true
  connect()
}

onBeforeUnmount(() => socket?.close())
</script>

<template>
  <JoinCard v-if="!entered" @join="onJoin" />
  <section v-else class="mt-4">
    <p class="font-mono text-meta text-ink-soft">Room {{ roomId }} — {{ status }}</p>
    <p v-if="state" class="text-body text-ink">Connected. Participants: {{ state.participants.length }}</p>
  </section>
</template>
