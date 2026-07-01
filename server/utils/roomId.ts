// ABOUTME: Mints the cryptographically-random, URL-safe id that identifies (and gates access to) a room.
// ABOUTME: The link built from this id is the room's only access control.
import { nanoid } from 'nanoid'

export function createRoomId(): string {
  return nanoid()
}
