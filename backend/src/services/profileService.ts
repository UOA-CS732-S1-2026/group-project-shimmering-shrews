import {
  countCompletedChallengesByUserId,
  findBadgesByUserId,
  findRecentCompletedChallengesByUserId,
  findUserProfileByAuthId,
  upsertUserProfileByAuth,
} from '../daos/profileDao'
import { ApiError } from '../utils/ApiError'
import { getXpForLevelStart, getXpForNextLevel } from '../utils/leveling'
import { getActiveStreakCount } from '../utils/streak'
import { isExploratoryUsername } from '../utils/username'

const formatCompletedDate = (date: Date | null) => {
  if (!date) {
    return 'Challenge completed'
  }

  return `Completed on ${date.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`
}

export const getUserProfile = async (
  authId: string,
  email?: string,
  timeZone?: string
) => {
  let profile = await findUserProfileByAuthId(authId)

  if (!profile || !isExploratoryUsername(profile.username)) {
    if (!email) {
      throw new ApiError(404, 'User profile not found')
    }

    profile = await upsertUserProfileByAuth(authId, email)
  }

  const [completedChallenges, badgeRows, recentHistoryRows] = await Promise.all([
    countCompletedChallengesByUserId(profile.id),
    findBadgesByUserId(profile.id),
    findRecentCompletedChallengesByUserId(profile.id),
  ])

  const badgeItems = badgeRows.map((badge) => ({
    id: badge.id,
    name: badge.name,
    description: badge.description ?? 'Badge earned through your city adventures.',
    active_icon: badge.active_url ?? '/profile-placeholder.svg',
    inactive_icon: badge.inactive_url ?? badge.active_url ?? '/profile-placeholder.svg',
    earned: badge.awarded_badge.length > 0,
  }))

  const xpForCurrentLevel = getXpForLevelStart(profile.level)
  const xpForNextLevel = getXpForNextLevel(profile.level)

  return {
    name: profile.username,
    level: profile.level,
    xp: profile.xp_earned,
    streak: getActiveStreakCount(
      profile.streak_count,
      profile.last_completed_challenge,
      new Date(),
      timeZone
    ),
    badges: badgeItems.filter((badge) => badge.earned).length,
    challengesCompleted: completedChallenges,
    xpForCurrentLevel,
    xpForNextLevel,
    badgeItems,
    historyItems: recentHistoryRows.map((item) => ({
      id: item.challenge_id,
      title: item.challenge.name,
      detail: item.challenge.description ?? formatCompletedDate(item.completed_at),
      xp: item.xp_worth,
    })),
  }
}
