import { vi } from 'vitest'

/**
 * Shared unit-test DAO mocks.
 *
 * Service unit tests import these mocks before importing the service under
 * test. The helper centralizes repeated DAO mock registration while keeping each
 * test responsible for its own return values and assertions.
 */
const daoMocks = vi.hoisted(() => ({
  badgeDaoMocks: {
    badgeDAO: {
      getBadgesForUser: vi.fn(),
    },
  },
  challengeDaoMocks: {
    completeUserChallenge: vi.fn(),
    completeUserChallengeByUserChallengeId: vi.fn(),
    createChallenges: vi.fn(),
    findActiveChallengeById: vi.fn(),
    findAllActiveChallenges: vi.fn(),
    findChallengeCategoriesByNames: vi.fn(),
  },
  locationDaoMocks: {
    createLocations: vi.fn(),
    getLocationsWithoutChallenges: vi.fn(),
  },
  profileDaoMocks: {
    countCompletedChallengesByUserId: vi.fn(),
    findBadgesByUserId: vi.fn(),
    findRecentCompletedChallengesByUserId: vi.fn(),
    findUserProfileByAuthId: vi.fn(),
    syncUserProfileByAuth: vi.fn(),
    upsertUserProfileByAuth: vi.fn(),
  },
  userChallengeDaoMocks: {
    findUserChallengeForUser: vi.fn(),
    findUserChallenges: vi.fn(),
    userChallengeDAO: {
      acceptUserChallenge: vi.fn(),
      cancelUserChallenge: vi.fn(),
      createTodayUserChallenges: vi.fn(),
      expireOpenChallengesBeforeDate: vi.fn(),
      getTodayUserChallengesByUserId: vi.fn(),
    },
  },
  userDaoMocks: {
    userDAO: {
      getProfileByAuthId: vi.fn(),
      getUserByAuthId: vi.fn(),
    },
  },
}))

export const {
  badgeDaoMocks,
  challengeDaoMocks,
  locationDaoMocks,
  profileDaoMocks,
  userChallengeDaoMocks,
  userDaoMocks,
} = daoMocks

vi.mock('../../src/daos/challengeDao', () => challengeDaoMocks)
vi.mock('../../src/daos/locationDao', () => locationDaoMocks)
vi.mock('../../src/daos/profileDao', () => profileDaoMocks)
vi.mock('../../src/daos/userChallengeDao', () => userChallengeDaoMocks)
vi.mock('../../src/daos/userDao', () => userDaoMocks)
vi.mock('../../src/daos/badgeDAO', () => badgeDaoMocks)
