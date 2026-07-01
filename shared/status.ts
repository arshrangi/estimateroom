// ABOUTME: Derives the pre-reveal voting status ("who are we waiting on") from the participant list.
// ABOUTME: Observers never count toward voting; the facilitator reads this to call out pending voters.
import type { Participant } from './types'

export function waitingVoters(participants: Participant[]): Participant[] {
  return participants.filter((p) => p.role !== 'observer' && !p.hasVoted)
}

export function votingStatusText(participants: Participant[]): string {
  const voters = participants.filter((p) => p.role !== 'observer')
  if (voters.length === 0) return 'No voters yet.'
  const waiting = voters.filter((p) => !p.hasVoted)
  if (waiting.length === 0) return "Everyone's voted."
  return `Waiting on ${waiting.length}: ${waiting.map((p) => p.name).join(', ')}.`
}
