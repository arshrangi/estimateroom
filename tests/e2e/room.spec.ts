// ABOUTME: Multi-client end-to-end coverage of EstimateRoom's critical real-time journeys.
// ABOUTME: create-and-join, a full voting round (hidden cast, reveal, spread, then next round), refresh-proof reconnect, and logo leave paths.
import { test, expect, type Browser, type Page } from '@playwright/test'

// Contexts created off the shared browser don't inherit config `use`, so set baseURL
// (for relative goto) and clipboard permission (create-room copies the link) explicitly.
async function newClient(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext({
    baseURL: 'http://localhost:3000',
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  return ctx.newPage()
}

// The Vue app sets __vue_app__ on the mount root once hydrated; wait for it so click
// handlers are attached before we interact (Playwright is actionable-ready before hydration).
async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(() => !!(document.querySelector('#__nuxt') as unknown as { __vue_app__?: unknown })?.__vue_app__)
}

async function createRoom(page: Page): Promise<string> {
  await page.goto('/')
  await waitForHydration(page)
  await page.getByRole('button', { name: 'Create a room' }).click()
  await page.waitForURL(/\/r\/.+/)
  return page.url()
}

async function visitRoom(page: Page, url: string): Promise<void> {
  await page.goto(url)
  await waitForHydration(page)
}

async function join(page: Page, name: string): Promise<void> {
  await page.getByPlaceholder('e.g. David').fill(name)
  await page.getByRole('button', { name: 'Join', exact: true }).click()
  // Presence round-trips through the party Worker; the row appearing proves the socket is live.
  await expect(row(page, name)).toBeVisible()
}

// The participant's row in the table, located by the name it contains.
function row(page: Page, name: string) {
  return page.getByRole('listitem').filter({ hasText: name })
}

function hand(page: Page) {
  return page.getByRole('group', { name: 'Your cards' })
}

test('create and join: two participants see each other in real time', async ({ browser }) => {
  const host = await newClient(browser)
  const guest = await newClient(browser)

  const url = await createRoom(host)
  await join(host, 'Alice')
  // The first participant is the host.
  await expect(row(host, 'Alice')).toContainText('Host')

  await visitRoom(guest, url)
  await join(guest, 'Bob')

  // Both clients converge on the same roster.
  for (const p of [host, guest]) {
    await expect(row(p, 'Alice')).toBeVisible()
    await expect(row(p, 'Bob')).toBeVisible()
  }

  await host.context().close()
  await guest.context().close()
})

test('voting round: hidden cast, simultaneous reveal, spread, then next round', async ({ browser }) => {
  const host = await newClient(browser)
  const guest = await newClient(browser)

  const url = await createRoom(host)
  await join(host, 'Alice')
  await visitRoom(guest, url)
  await join(guest, 'Bob')

  // Host sets the deck.
  await host.getByRole('button', { name: 'Choose deck' }).click()
  await host.getByRole('button', { name: /^Fibonacci/ }).click()

  // Both cast, each within their own hand so the selector never crosses clients.
  await expect(hand(host)).toBeVisible()
  await expect(hand(guest)).toBeVisible()
  await hand(host).getByRole('button', { name: '8', exact: true }).click()
  await hand(guest).getByRole('button', { name: '5', exact: true }).click()

  // Votes are hidden pre-reveal: the guest sees Alice as "voted", not her value.
  await expect(row(guest, 'Alice')).toContainText('voted')

  // Host reveals; both clients get the values and the spread strip.
  await host.getByRole('button', { name: 'Reveal', exact: true }).click()
  for (const p of [host, guest]) {
    await expect(p.getByRole('status').filter({ hasText: 'Median' })).toBeVisible()
  }
  // The spread is graded by deck steps (5 and 8 are neighbours), with an explainer tooltip.
  await expect(host.getByText('spread: low')).toBeVisible()
  await host.getByRole('button', { name: 'What spread means' }).focus()
  await expect(host.getByRole('tooltip')).toBeVisible()
  // The revealed value is now visible in the roster on the other client.
  await expect(row(guest, 'Alice')).toContainText('8')
  // Revealed rows sort by vote, low first: Bob's 5 outranks Alice's 8 despite join order.
  await expect(host.getByRole('listitem').first()).toContainText('Bob')

  // Discussion continues: Bob raises his 5 to 13 after reveal and everyone sees it live.
  await hand(guest).getByRole('button', { name: '13', exact: true }).click()
  await expect(row(host, 'Bob')).toContainText('13')
  await expect(host.getByRole('status').filter({ hasText: 'Median 10.5' })).toBeVisible()
  // The roster re-sorts live: Alice's 8 is now the low vote.
  await expect(host.getByRole('listitem').first()).toContainText('Alice')

  // The guest clears their own selection post-reveal by clicking it again; both clients
  // see the abstain and the strip's vote count drops, and the guest's hand deselects too.
  // Toggling clear/vote/clear within one JS turn (no round trip between clicks) keeps the
  // vote and clear broadcasts both in flight together, which is what exposes a stale guard
  // wrongly re-selecting the card after the clear broadcast lands.
  await expect(host.getByRole('status').filter({ hasText: '2 votes' })).toBeVisible()
  await hand(guest).getByRole('button', { name: '13', exact: true }).evaluate((el) => {
    const button = el as HTMLButtonElement
    button.click()
    button.click()
    button.click()
  })
  for (const p of [host, guest]) {
    await expect(row(p, 'Bob')).toContainText('Not voted')
    await expect(p.getByRole('status').filter({ hasText: '1 vote' })).toBeVisible()
  }
  await expect(hand(guest).getByRole('button', { pressed: true })).toHaveCount(0)
  await expect(host.getByRole('listitem').first()).toContainText('Alice')
  await expect(host.getByRole('listitem').nth(1)).toContainText('Bob')

  // Re-picking 13 restores the vote for both clients.
  await hand(guest).getByRole('button', { name: '13', exact: true }).click()
  for (const p of [host, guest]) {
    await expect(row(p, 'Bob')).toContainText('13')
  }

  // Starting the next vote clears the round back to voting-in-progress.
  await host.getByRole('button', { name: 'Start next vote' }).click()
  await expect(host.getByText('Median')).toBeHidden()

  await host.context().close()
  await guest.context().close()
})

test('reconnect: a refresh keeps identity and the cast vote', async ({ browser }) => {
  const page = await newClient(browser)

  const url = await createRoom(page)
  await join(page, 'Alice')

  await page.getByRole('button', { name: 'Choose deck' }).click()
  await page.getByRole('button', { name: /^Fibonacci/ }).click()
  const five = hand(page).getByRole('button', { name: '5', exact: true })
  await five.click()
  await expect(five).toHaveAttribute('aria-pressed', 'true')

  // Refresh mid-round.
  await page.reload()
  await waitForHydration(page)
  expect(page.url()).toBe(url)

  // Remembered identity re-enters directly — no Join screen.
  await expect(page.getByRole('button', { name: 'Join', exact: true })).toHaveCount(0)
  await expect(row(page, 'Alice')).toBeVisible()

  // The DO replays state including the participant's own vote.
  await expect(hand(page).getByRole('button', { name: '5', exact: true })).toHaveAttribute('aria-pressed', 'true')

  await page.context().close()
})

test('host leaves via logo: confirm guard, immediate handoff, roster removal', async ({ browser }) => {
  const host = await newClient(browser)
  const guest = await newClient(browser)

  // Outside a live room the wordmark is a plain link home.
  await host.goto('/')
  await waitForHydration(host)
  await expect(host.getByRole('link', { name: 'EstimateRoom' })).toHaveAttribute('href', '/')

  const url = await createRoom(host)
  await join(host, 'Alice')
  await visitRoom(guest, url)
  await join(guest, 'Bob')

  // The logo click does not navigate; it opens the inline confirm.
  await host.getByRole('button', { name: 'EstimateRoom' }).click()
  await expect(host.getByText('Leave room? Host passes to another member.')).toBeVisible()

  // Cancel keeps the host in the room.
  await host.getByRole('button', { name: 'Cancel' }).click()
  await expect(row(host, 'Alice')).toBeVisible()

  // Confirming leaves and lands on the landing page.
  await host.getByRole('button', { name: 'EstimateRoom' }).click()
  await host.getByRole('button', { name: 'Leave', exact: true }).click()
  await host.waitForURL('http://localhost:3000/')

  // The guest is promoted immediately (no 10s grace) and the leaver's row is gone.
  await expect(row(guest, 'Bob')).toContainText('Host')
  await expect(row(guest, 'Alice')).toHaveCount(0)

  await host.context().close()
  await guest.context().close()
})

test('attendee leaves via logo: no confirm, straight home, roster removal', async ({ browser }) => {
  const host = await newClient(browser)
  const guest = await newClient(browser)

  const url = await createRoom(host)
  await join(host, 'Alice')
  await visitRoom(guest, url)
  await join(guest, 'Bob')

  // A non-host gets no confirm; the logo leaves immediately.
  await guest.getByRole('button', { name: 'EstimateRoom' }).click()
  await guest.waitForURL('http://localhost:3000/')

  // The host keeps the room; Bob's row is removed rather than greyed out.
  await expect(row(host, 'Bob')).toHaveCount(0)
  await expect(row(host, 'Alice')).toContainText('Host')

  await host.context().close()
  await guest.context().close()
})

test('deck chosen on the join card seeds the room and is remembered', async ({ browser }) => {
  const host = await newClient(browser)

  await createRoom(host)
  // The creator's Join card includes the deck chooser; pick a non-default preset.
  await host.getByRole('button', { name: /^T-shirt/ }).click()
  await join(host, 'Alice')

  // The room starts with the chosen deck; there is no waiting-for-deck state.
  await expect(host.getByText('Waiting for the host to pick a deck.')).toHaveCount(0)
  await expect(hand(host).getByRole('button', { name: 'M', exact: true })).toBeVisible()
  await expect(hand(host).getByRole('button', { name: '?', exact: true })).toBeVisible()

  // A second created room stops the returning creator at the Join card, deck remembered.
  await createRoom(host)
  await expect(host.getByRole('button', { name: 'Continue as Alice' })).toBeVisible()
  await expect(host.getByRole('button', { name: /^T-shirt/ })).toHaveAttribute('aria-pressed', 'true')

  await host.context().close()
})

test('not voting: opting out mid-round drops you from the waiting list', async ({ browser }) => {
  const host = await newClient(browser)
  const guest = await newClient(browser)

  const url = await createRoom(host)
  await join(host, 'Alice')
  await visitRoom(guest, url)
  // The same choice is offered up front on the join card.
  await expect(guest.getByRole('checkbox', { name: 'Join without voting' })).toBeVisible()
  await join(guest, 'Bob')

  await host.getByRole('button', { name: 'Choose deck' }).click()
  await host.getByRole('button', { name: /^Fibonacci/ }).click()
  await hand(host).getByRole('button', { name: '8', exact: true }).click()

  // Bob is holding the round up.
  await expect(host.getByText('Waiting on 1: Bob.')).toBeVisible()

  // Bob opts out: his hand goes away and the round is no longer waiting on him.
  await guest.getByRole('checkbox', { name: 'Not voting' }).click()
  await expect(guest.getByText("You're not voting this round.")).toBeVisible()
  await expect(hand(guest)).toHaveCount(0)
  for (const p of [host, guest]) {
    await expect(row(p, 'Bob')).toContainText('not voting')
    await expect(p.getByText("Everyone's voted.")).toBeVisible()
  }

  await host.context().close()
  await guest.context().close()
})

test('not voting: the choice survives a refresh', async ({ browser }) => {
  const page = await newClient(browser)

  await createRoom(page)
  await join(page, 'Alice')

  await page.getByRole('checkbox', { name: 'Not voting' }).click()
  await expect(row(page, 'Alice')).toContainText('not voting')

  await page.reload()
  await waitForHydration(page)

  // The join message re-announces the remembered (voting) preference on every reconnect;
  // the room's own record has to win.
  await expect(row(page, 'Alice')).toContainText('not voting')
  await expect(page.getByText("You're not voting this round.")).toBeVisible()

  await page.context().close()
})

test('not voting: opting out pre-reveal discards the cast vote', async ({ browser }) => {
  const page = await newClient(browser)

  await createRoom(page)
  await join(page, 'Alice')
  await page.getByRole('button', { name: 'Choose deck' }).click()
  await page.getByRole('button', { name: /^Fibonacci/ }).click()

  const five = hand(page).getByRole('button', { name: '5', exact: true })
  await five.click()
  await expect(five).toHaveAttribute('aria-pressed', 'true')

  const toggle = page.getByRole('checkbox', { name: 'Not voting' })
  await toggle.click()
  await expect(page.getByText("You're not voting this round.")).toBeVisible()

  // Back to voting: the discarded vote must not come back with the hand.
  await toggle.click()
  await expect(hand(page)).toBeVisible()
  await expect(hand(page).getByRole('button', { pressed: true })).toHaveCount(0)
  await expect(row(page, 'Alice')).toContainText('waiting')

  await page.context().close()
})
