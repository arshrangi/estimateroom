// ABOUTME: The client/server WebSocket message contract, imported by both the Vue client and the Room DO.
// ABOUTME: Single source of truth for message shapes; every inbound message is validated against these schemas.
import { z } from 'zod'
import { AVATAR_TINTS } from './avatars'
import { MAX_CARD_LEN, MAX_DECK_CARDS } from './decks'
import { ParticipantSchema, RevealModeSchema, RoleSchema, RoomStateSchema } from './types'

export { RoomStateSchema }
export type { Participant, RevealMode, Role, RoomState } from './types'

/* ── Client → server ─────────────────────────────────────────── */

/** A participant announces themselves and enters the room. */
export const JoinMessageSchema = z.object({
  type: z.literal('join'),
  participantId: z.string().min(1).max(64),
  name: z.string().min(1).max(40),
  avatar: z.enum(AVATAR_TINTS).nullable(),
  role: RoleSchema,
})
export type JoinMessage = z.infer<typeof JoinMessageSchema>

/** The host sets the room's deck (a preset's cards, or a custom set). */
export const ChangeDeckMessageSchema = z.object({
  type: z.literal('changeDeck'),
  cards: z.array(z.string().min(1).max(MAX_CARD_LEN)).min(1).max(MAX_DECK_CARDS),
})
export type ChangeDeckMessage = z.infer<typeof ChangeDeckMessageSchema>

/** A voter selects a card for the current item. */
export const VoteMessageSchema = z.object({
  type: z.literal('vote'),
  card: z.string().min(1).max(MAX_CARD_LEN),
})
export type VoteMessage = z.infer<typeof VoteMessageSchema>

/** A voter clears their current selection. */
export const ClearVoteMessageSchema = z.object({ type: z.literal('clearVote') })

/** The host sets how the round reveals: on their click, or automatically once all voters have cast. */
export const SetRevealModeMessageSchema = z.object({
  type: z.literal('setRevealMode'),
  mode: RevealModeSchema,
})

/** The host reveals all votes now. */
export const RevealMessageSchema = z.object({ type: z.literal('reveal') })

export const ClientMessageSchema = z.discriminatedUnion('type', [
  JoinMessageSchema,
  ChangeDeckMessageSchema,
  VoteMessageSchema,
  ClearVoteMessageSchema,
  SetRevealModeMessageSchema,
  RevealMessageSchema,
])
export type ClientMessage = z.infer<typeof ClientMessageSchema>

/* ── Server → client ─────────────────────────────────────────── */

/** Full authoritative room snapshot, sent on (re)connect. */
export const StateMessageSchema = z.object({
  type: z.literal('state'),
  state: RoomStateSchema,
})
export type StateMessage = z.infer<typeof StateMessageSchema>

export const ParticipantJoinedSchema = z.object({
  type: z.literal('participantJoined'),
  participant: ParticipantSchema,
})

export const ParticipantLeftSchema = z.object({
  type: z.literal('participantLeft'),
  participantId: z.string(),
})

export const DeckChangedSchema = z.object({
  type: z.literal('deckChanged'),
  deck: z.array(z.string()),
})

/** Pre-reveal vote status. Carries only whether the participant has voted, never the value. */
export const VoteStatusChangedSchema = z.object({
  type: z.literal('voteStatusChanged'),
  participantId: z.string(),
  hasVoted: z.boolean(),
})

export const ServerMessageSchema = z.discriminatedUnion('type', [
  StateMessageSchema,
  ParticipantJoinedSchema,
  ParticipantLeftSchema,
  DeckChangedSchema,
  VoteStatusChangedSchema,
])
export type ServerMessage = z.infer<typeof ServerMessageSchema>
