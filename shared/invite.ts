// ABOUTME: Builds the shareable room join URL from an origin and room id.
// ABOUTME: The link is the room's only access control, so its shape is the join route.
export function inviteUrl(origin: string, roomId: string): string {
  return `${origin}/r/${roomId}`
}
