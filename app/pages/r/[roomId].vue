<script setup lang="ts">
// ABOUTME: The room surface. New members and the room's creator (who picks the deck) use the JoinCard;
// ABOUTME: other returning members auto-enter. Shows the live session plus a transient reconnecting banner.
import { hasProfile } from '~~/shared/identity'

const route = useRoute()
const roomId = computed(() => String(route.params.roomId))

// Rooms are ephemeral and invite-only, so they stay out of search indexes;
// the OG copy is what an invite link unfurls to in chat.
const inviteCopy = 'You are invited to estimate. No account needed, just pick a name and vote.'
useSeoMeta({
  title: 'Planning room',
  robots: 'noindex',
  ogTitle: 'Join my planning poker room',
  description: inviteCopy,
  ogDescription: inviteCopy,
})

const store = useRoomStore()
const { identity, load } = useIdentity()
const { status, error, connect, disconnect, reconnect } = useRoomSocket(roomId.value)

const entered = ref(false)

const deckMemory = useDeckMemory()
// Setup-time so the JoinCard sees the prop before its own mount; false during SSR,
// and harmless there because the card renders nothing until client-side ready.
const isCreator = ref(deckMemory.isCreatorOf(roomId.value))
const chosenDeck = ref<string[] | null>(null)

// Seed a just-created room with the deck chosen on the Join card, once the state
// snapshot confirms we are host of a still-deckless room. Guests never carry a deck.
watch(
  () => store.roomState,
  (state) => {
    if (!state || state.deck !== null || !chosenDeck.value) return
    if (state.hostId !== identity.value.participantId) return
    store.changeDeck(chosenDeck.value)
    deckMemory.clearCreated()
  },
)

function enter(deck?: string[]) {
  if (deck) chosenDeck.value = deck
  entered.value = true
  connect()
}

onMounted(() => {
  load()
  // A remembered participant is never dropped to the Join screen, except the creator,
  // who stops at the Join card once to pick the room's deck.
  if (hasProfile(identity.value) && !isCreator.value) enter()
})

onBeforeUnmount(disconnect)
</script>

<template>
  <ErrorSurface v-if="error" :code="error" />
  <JoinCard v-else-if="!entered" :show-deck="isCreator" @join="enter" />

  <div v-else class="mt-4 flex flex-col gap-3">
    <ReconnectingIndicator :show="status === 'reconnecting'" @retry="reconnect" />

    <VotingStatus v-if="!store.revealed" />
    <SpreadSummary v-else />

    <ParticipantTable />

    <p v-if="store.participants.length <= 1" class="text-body text-ink-soft">
      Share the link to get your team in.
    </p>

    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0 flex-1">
        <DeckRow />
      </div>
      <HostControls />
    </div>
  </div>
</template>
