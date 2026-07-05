<script setup lang="ts">
// ABOUTME: The join surface: capture a name/avatar/observer choice, or one-tap confirm a remembered profile.
// ABOUTME: The room's creator also picks the deck here (remembered per browser). Emits `join` once entered.
import { AVATAR_TINTS, type AvatarTint } from '~~/shared/avatars'
import { DECK_PRESETS } from '~~/shared/decks'
import { hasProfile } from '~~/shared/identity'

const props = defineProps<{ showDeck?: boolean }>()
const emit = defineEmits<{ join: [deck?: string[]] }>()

const { identity, load, save } = useIdentity()
const deckMemory = useDeckMemory()
const chosenDeck = ref<string[] | null>(null)

const name = ref('')
const avatar = ref<AvatarTint | null>(null)
const observer = ref(false)
const editing = ref(false)
const error = ref('')
const ready = ref(false)
const nameInput = ref<HTMLInputElement | null>(null)

// `ready` gates identity-dependent UI so SSR and first client render match (no hydration mismatch).
const returning = computed(() => ready.value && hasProfile(identity.value) && !editing.value)

onMounted(() => {
  load()
  name.value = identity.value.name
  avatar.value = identity.value.avatar
  observer.value = identity.value.observer
  if (props.showDeck) {
    deckMemory.load()
    chosenDeck.value = deckMemory.lastDeck.value ?? DECK_PRESETS[0]!.cards
  }
  ready.value = true
  if (!hasProfile(identity.value)) focusName()
})

// The deck the join carries: the creator's choice, saved as the new remembered deck.
function commitDeck(): string[] | undefined {
  if (!props.showDeck || !chosenDeck.value) return undefined
  deckMemory.save(chosenDeck.value)
  return chosenDeck.value
}

function focusName() {
  nextTick(() => nameInput.value?.focus())
}

function startEdit() {
  editing.value = true
  focusName()
}

function submit() {
  const trimmed = name.value.trim()
  if (!trimmed) {
    error.value = 'Enter a name so the team can see you.'
    focusName()
    return
  }
  save({ name: trimmed, avatar: avatar.value, observer: observer.value })
  emit('join', commitDeck())
}

function pickTint(t: AvatarTint) {
  avatar.value = avatar.value === t ? null : t
}

const tintClass: Record<AvatarTint, string> = {
  slate: 'bg-avatar-slate',
  teal: 'bg-avatar-teal',
  forest: 'bg-avatar-forest',
  clay: 'bg-avatar-clay',
  plum: 'bg-avatar-plum',
}
</script>

<template>
  <section class="mx-auto mt-6 max-w-sm rounded-lg border border-line bg-surface p-6">
    <template v-if="ready">
      <div v-if="returning">
        <h1 class="text-heading font-bold text-ink">Welcome back</h1>
        <div class="mt-4 flex items-center gap-2">
          <UserAvatar :name="identity.name" :tint="identity.avatar" />
          <span class="text-body font-semibold text-ink">{{ identity.name }}</span>
          <span v-if="identity.observer" class="font-mono text-meta text-ink-muted">observer</span>
        </div>
        <div v-if="showDeck" class="mt-4">
          <span class="font-mono text-meta text-ink-soft">Deck</span>
          <div class="mt-2 rounded-sm border border-line bg-bg p-2">
            <DeckPicker :selected="chosenDeck" @pick="(cards) => (chosenDeck = cards)" />
          </div>
        </div>

        <button
          type="button"
          class="mt-5 h-[38px] w-full rounded-sm bg-accent px-4 font-semibold text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
          @click="emit('join', commitDeck())"
        >
          Continue as {{ identity.name }}
        </button>
        <button type="button" class="mt-3 text-meta text-ink-soft underline hover:text-ink" @click="startEdit">
          Not you? Edit
        </button>
      </div>

      <form v-else @submit.prevent="submit">
        <h1 class="text-heading font-bold text-ink">Join the room</h1>

        <label class="mt-4 block">
          <span class="font-mono text-meta text-ink-soft">Your name</span>
          <input
            ref="nameInput"
            v-model="name"
            type="text"
            placeholder="e.g. Priya"
            maxlength="40"
            :aria-invalid="!!error"
            :aria-describedby="error ? 'name-error' : undefined"
            class="mt-1 h-[38px] w-full rounded-sm border border-line bg-bg px-3 text-body text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
            @input="error = ''"
          >
        </label>
        <p v-if="error" id="name-error" role="alert" class="mt-1 text-meta text-outlier">{{ error }}</p>
        <p v-else class="mt-1 text-meta text-ink-muted">No signup. This is just how the team sees you.</p>

        <div class="mt-4">
          <span class="font-mono text-meta text-ink-soft">Avatar</span>
          <div class="mt-2 flex items-center gap-2">
            <UserAvatar :name="name || '?'" :tint="avatar" />
            <button
              v-for="t in AVATAR_TINTS"
              :key="t"
              type="button"
              :aria-label="t"
              :aria-pressed="avatar === t"
              class="size-6 rounded-sm border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
              :class="[tintClass[t], avatar === t ? 'border-accent' : 'border-line']"
              @click="pickTint(t)"
            />
          </div>
        </div>

        <label class="mt-4 flex items-center gap-2">
          <input v-model="observer" type="checkbox" class="size-4 accent-[var(--color-accent-ink)]">
          <span class="text-body text-ink-soft">Join as observer (watch, don't vote)</span>
        </label>

        <div v-if="showDeck" class="mt-4">
          <span class="font-mono text-meta text-ink-soft">Deck</span>
          <div class="mt-2 rounded-sm border border-line bg-bg p-2">
            <DeckPicker :selected="chosenDeck" @pick="(cards) => (chosenDeck = cards)" />
          </div>
        </div>

        <button
          type="submit"
          class="mt-5 h-[38px] w-full rounded-sm bg-accent px-4 font-semibold text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
        >
          Join
        </button>
      </form>
    </template>
  </section>
</template>
