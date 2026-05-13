import { expect, test, type Page } from '@playwright/test'

const challenge = {
  id: 42,
  user_id: 8,
  challenge_id: 12,
  status: 'in_progress',
  xp_worth: 50,
  assigned_at: '2026-05-13T04:18:07.374Z',
  accepted_at: null,
  accepted_from_lat: null,
  accepted_from_lng: null,
  completed_at: null,
  cancelled_at: null,
  expired_at: null,
  skipped_at: null,
  challenge: {
    id: 12,
    name: 'Visit the waterfront',
    description: 'Take a short walk by the water.',
    xp_worth: 50,
    challenge_category: {
      id: 3,
      name: 'Outdoor',
    },
    location: {
      id: 9,
      name: 'Auckland Waterfront',
      latitude: -36.8406,
      longitude: 174.7677,
    },
  },
}

const acceptedChallenge = {
  ...challenge,
  status: 'accepted',
  accepted_at: '2026-05-13T04:25:12.587Z',
  accepted_from_lat: -36.8406,
  accepted_from_lng: 174.7677,
}

const completedChallenge = {
  ...acceptedChallenge,
  status: 'completed',
  completed_at: '2026-05-13T04:27:07.947Z',
}

const apiResponse = (data: unknown, message = 'OK') => ({
  success: true,
  message,
  data,
})

async function mockBackend(page: Page) {
  await page.route('https://maps.geoapify.com/**', (route) => route.abort())
  await page.route('https://api.geoapify.com/**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        features: [
          {
            geometry: {
              coordinates: [
                [
                  [174.7677, -36.8406],
                  [174.7677, -36.8406],
                ],
              ],
            },
          },
        ],
      }),
    })
  )

  await page.route('http://mock.api/user-challenges/today**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResponse([challenge])),
    })
  )

  await page.route('http://mock.api/user-challenges/42', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(acceptedChallenge)),
    })
  )

  await page.route('http://mock.api/user-challenges/42/accept', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(acceptedChallenge, 'Challenge accepted')),
    })
  )

  await page.route('http://mock.api/user-challenges/42/checkin', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResponse(
          {
            userChallenge: completedChallenge,
            notification: {
              level: {
                type: 'challenge_completed',
                xpGained: 50,
                previousXp: 100,
                newXp: 150,
                previousLevelXpRequired: 100,
                nextLevelXpRequired: 250,
                levelUp: false,
                previousLevel: 2,
                newLevel: 2,
                xpForLevelStart: 100,
                xpForNextLevelStart: 250,
                message: 'Challenge completed! You earned 50 XP.',
              },
              badgesAwarded: [
                {
                  id: 1,
                  name: 'Waterfront Wanderer',
                  description: 'Completed a waterfront challenge.',
                  activeUrl: null,
                },
              ],
            },
          },
          'Challenge checked in'
        )
      ),
    })
  )

  await page.route('http://mock.api/api/profile/me', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResponse({
          badgeItems: [
            {
              id: 1,
              active_icon: '/badges/generic_award.svg',
              inactive_icon: '/badges/generic_award.svg',
              description: 'Completed your first city quest.',
              earned: true,
              name: 'First Quest',
            },
          ],
          badges: 1,
          challengesCompleted: 3,
          historyItems: [
            {
              id: 10,
              detail: 'Checked in at the waterfront.',
              title: 'Waterfront Walk',
              xp: 50,
            },
          ],
          level: 2,
          name: 'Vivienne',
          streak: 4,
          xp: 150,
          xpForCurrentLevel: 100,
          xpForNextLevel: 250,
        })
      ),
    })
  )

  await page.route('http://mock.api/api/user/leaderboard', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResponse({
          topUsers: [
            {
              rank: 1,
              username: 'Avery',
              xp_earned: 900,
              level: 5,
            },
            {
              rank: 2,
              username: 'Morgan',
              xp_earned: 720,
              level: 4,
            },
          ],
          currentUserRank: {
            rank: 8,
            username: 'Vivienne',
            xp_earned: 151,
            level: 2,
          },
        })
      ),
    })
  )
}

test.beforeEach(async ({ page }) => {
  await mockBackend(page)
})

test('accepts and checks in a daily challenge, then shows XP and badge notifications', async ({ page }) => {
  await page.goto('/challenges')

  await expect(page.getByRole('heading', { name: "Today's Challenges" })).toBeVisible()
  await page.getByText('Visit the waterfront').click()

  await expect(page.getByRole('heading', { name: 'Challenge Details' })).toBeVisible()
  await page.getByRole('button', { name: 'Accept' }).click()
  await expect(page.getByText('Accepted')).toBeVisible()

  await page.getByRole('button', { name: 'Check In' }).click()
  await expect(page.getByText('+50 XP')).toBeVisible()
  await expect(page.getByText('New Badge Unlocked')).toBeVisible({ timeout: 6_000 })
  await expect(page.getByText('Waterfront Wanderer')).toBeVisible()
})

test('loads the profile and leaderboard tabs for an authenticated user', async ({ page }) => {
  await page.goto('/profile')

  await expect(page.getByRole('heading', { name: 'Vivienne' })).toBeVisible()
  await expect(page.getByText('First Quest')).toBeVisible()

  await page.getByRole('tab', { name: 'Leaderboard' }).click()
  await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
  await expect(page.getByText('Avery')).toBeVisible()
  await expect(page.getByText('900 XP')).toBeVisible()
  await expect(page.getByText('Vivienne (You)')).toBeVisible()
})

test('opens the focused map route and returns to challenge detail', async ({ page }) => {
  await page.goto('/map?focusUserChallengeId=42&returnTo=/challenges/42')

  await expect(page.getByText('Follow the line to the challenge')).toBeVisible()
  await expect(page.getByText('Visit the waterfront')).toBeVisible()

  await page.getByRole('button', { name: /return to challenge details/i }).click()
  await expect(page.getByRole('heading', { name: 'Challenge Details' })).toBeVisible()
})
