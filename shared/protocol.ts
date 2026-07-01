// ABOUTME: The client/server WebSocket message contract, imported by both the Vue client and the Room DO.
// ABOUTME: Single source of truth for message shapes; every inbound message is validated against these schemas.
import { z } from 'zod'
import { RoomStateSchema } from './types'

export { RoomStateSchema }
export type { Participant, RevealMode, Role, RoomState } from './types'

/** Full authoritative room snapshot, sent on (re)connect. */
export const StateMessageSchema = z.object({
  type: z.literal('state'),
  state: RoomStateSchema,
})
export type StateMessage = z.infer<typeof StateMessageSchema>

/** Messages the server (Room DO) sends to clients. */
export const ServerMessageSchema = z.discriminatedUnion('type', [StateMessageSchema])
export type ServerMessage = z.infer<typeof ServerMessageSchema>
