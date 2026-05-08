import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/middleware/auth', () => ({
  requireAuth: [
    (req: any, _res: any, next: any) => {
      req.auth = { sub: 'auth-1', email: 'user@example.com' }
      next()
    },
  ],
  attachUser: (_req: any, _res: any, next: any) => next(),
  requireSelf: (req: any, res: any, next: any) => {
    if (req.params.id !== req.auth?.sub) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    next()
  },
}))

vi.mock('../src/services/challengeService', () => ({
  getAllChallenges: vi.fn(),
  getChallengeDetails: vi.fn(),
  checkInToChallenge: vi.fn(),
  createNewChallenges: vi.fn(),
}))

vi.mock('../src/services/profileService', () => ({
  getUserProfile: vi.fn(),
}))

import app from '../src/app'
import { getAllChallenges, checkInToChallenge } from '../src/services/challengeService'
import { getUserProfile } from '../src/services/profileService'

describe('app routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('serves the health/root endpoint', async () => {
    await request(app)
      .get('/')
      .expect(200)
      .expect('API is running for Shimmering Shrews pretty app!')
  })

  it('mounts the public challenges route', async () => {
    const challenges = [{ id: 1, name: 'Grab a bite' }]
    vi.mocked(getAllChallenges).mockResolvedValue(challenges as any)

    await request(app)
      .get('/challenges')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ success: true, data: challenges })
      })
  })

  it('runs route validation errors through the error middleware', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await request(app)
      .post('/challenges/not-a-number/checkin')
      .expect(400)
      .expect(({ body }) => {
        expect(body).toEqual({
          success: false,
          message: 'Challenge id must be a positive integer',
        })
      })

    expect(checkInToChallenge).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('passes mocked auth into protected profile routes', async () => {
    const profile = { name: 'City_Scout-01' }
    vi.mocked(getUserProfile).mockResolvedValue(profile as any)

    await request(app)
      .get('/api/profile/me')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ success: true, data: profile })
      })

    expect(getUserProfile).toHaveBeenCalledWith('auth-1', 'user@example.com')
  })
})
