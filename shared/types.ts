// ABOUTME: Domain entity schemas and types for a EstimateRoom room (the authoritative state shape).
// ABOUTME: Zod is the single source; TS types are inferred so client, server, and DO never drift.
import { z } from 'zod'
import { AVATAR_TINTS } from './avatars'

/**
 * observer = present but not voting. The UI labels this role "Not voting".
 * Do not rename the value: it is persisted per room in the Durable Object and
 * validated on the client, so any room live at deploy time would reject every
 * state message and appear frozen.
 */
export const RoleSchema = z.enum(['voter', 'observer'])
export type Role = z.infer<typeof RoleSchema>

/** host = host clicks reveal; auto = cards flip once all voters have cast. */
export const RevealModeSchema = z.enum(['host', 'auto'])
export type RevealMode = z.infer<typeof RevealModeSchema>

export const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.enum(AVATAR_TINTS).nullable(),
  role: RoleSchema,
  connected: z.boolean(),
  /** Visible pre-reveal. The vote value itself stays null until reveal (secrecy invariant). */
  hasVoted: z.boolean(),
  vote: z.string().nullable(),
})
export type Participant = z.infer<typeof ParticipantSchema>

export const RoomStateSchema = z.object({
  roomId: z.string(),
  deck: z.array(z.string()).nullable(),
  revealMode: RevealModeSchema,
  hostId: z.string().nullable(),
  revealed: z.boolean(),
  participants: z.array(ParticipantSchema),
})
export type RoomState = z.infer<typeof RoomStateSchema>
