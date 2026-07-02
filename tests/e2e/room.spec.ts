// ABOUTME: Multi-client end-to-end coverage of EstimateRoom's critical real-time journeys.
// ABOUTME: create-and-join, a full voting round (hidden cast, reveal, spread, re-vote), and refresh-proof reconnect.
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
  await page.getByPlaceholder('e.g. Priya').fill(name)
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

test('voting round: hidden cast, simultaneous reveal, spread, then re-vote', async ({ browser }) => {
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
  await hand(host).getByRole('button', { name: '5', exact: true }).click()
  await hand(guest).getByRole('button', { name: '8', exact: true }).click()

  // Votes are hidden pre-reveal: the guest sees Alice as "voted", not her value.
  await expect(row(guest, 'Alice')).toContainText('voted')

  // Host reveals; both clients get the values and the spread strip.
  await host.getByRole('button', { name: 'Reveal', exact: true }).click()
  for (const p of [host, guest]) {
    await expect(p.getByRole('status').filter({ hasText: 'Median' })).toBeVisible()
  }
  // The revealed value is now visible in the roster on the other client.
  await expect(row(guest, 'Alice')).toContainText('5')

  // Re-vote clears the round back to voting-in-progress.
  await host.getByRole('button', { name: 'Vote again' }).click()
  await host.getByRole('button', { name: 'Clear & re-vote' }).click()
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
