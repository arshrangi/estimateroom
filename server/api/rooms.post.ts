// ABOUTME: POST /api/rooms mints a new room and returns its id. The only HTTP write in the app.
// ABOUTME: Returns { roomId } directly (camelCase, no wrapper); the room's live state lives in its Durable Object.
export default defineEventHandler(() => {
  return { roomId: createRoomId() }
})
