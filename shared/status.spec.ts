// ABOUTME: Tests the voting-status derivation (waiting voters, status text, observer exclusion).
import { describe, expect, it } from 'vitest'
import { votingStatusText, waitingVoters } from './status'
import type { Participant } from './types'

function p(id: string, name: string, role: 'voter' | 'observer', hasVoted: boolean): Participant {
  return { id, name, avatar: null, role, connected: true, hasVoted, vote: null }
}

describe('voting status', () => {
  it('names who we are waiting on', () => {
    const list = [p('1', 'Priya', 'voter', true), p('2', 'Marco', 'voter', false), p('3', 'Dev', 'voter', false)]
    expect(votingStatusText(list)).toBe('Waiting on 2: Marco, Dev.')
    expect(waitingVoters(list).map((x) => x.name)).toEqual(['Marco', 'Dev'])
  })

  it('says everyone voted when no voter is pending', () => {
    expect(votingStatusText([p('1', 'Priya', 'voter', true)])).toBe("Everyone's voted.")
  })

  it('excludes observers from the count', () => {
    const list = [p('1', 'Priya', 'voter', true), p('2', 'Obs', 'observer', false)]
    expect(votingStatusText(list)).toBe("Everyone's voted.")
    expect(waitingVoters(list)).toHaveLength(0)
  })

  it('handles a room with only observers', () => {
    expect(votingStatusText([p('1', 'Obs', 'observer', false)])).toBe('No voters yet.')
  })
})
