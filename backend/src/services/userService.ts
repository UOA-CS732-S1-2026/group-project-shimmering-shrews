import { userDAO } from '../daos/userDao'

export const UserService = {
  // Retrieves the profile info and badges of a user.
  // Users can only access their own profile; setup supports expanding for admin access.
  async getProfile(authUserId: string, targetUserId?: string) {
    // If no targetID is provided, use the id of the user making the call
    const authId = targetUserId ?? authUserId

    // Only the current user can get their profile info (supports adding admin support later)
    if (authId !== authUserId) {
      const err = new Error("Forbidden") as Error & { statusCode?: number }
      err.statusCode = 403
      throw err
    }

    const user = await userDAO.getProfileByAuthId(authId)
    if (!user) {
      const err = new Error("User not found") as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }

    return {
      ...user,
      badges: user.awarded_badge.map((b) => ({
        id: b.badge.id,
        name: b.badge.name,
        description: b.badge.description,
        active_icon: b.badge.active_url,
        // Keep inactive_icon faithful to the badge row. Tests cover this because
        // the frontend badge UI depends on active/inactive assets being distinct
        // when the database provides both.
        inactive_icon: b.badge.inactive_url ?? b.badge.active_url,
        earnedAt: b.earned_at,
        earned: true,
      })),
    }
  },

  // Returns the top 10 users ranked by XP and the current user's rank.
  // Maps raw database results to ranked entries and flags the current user with isCurrentUser.
  async getLeaderboard(authUserId: string) {
    const { topUsers, currentUserRank } = await userDAO.getLeaderboard(authUserId)

    const topUsersWithRank = topUsers.map((user, index) => ({
      rank: index + 1, // rank is 1-based
      username: user.username,
      xp_earned: user.xp_earned,
      level: user.level,
      isCurrentUser: user.auth_id === authUserId,
    }))

    return {
      topUsers: topUsersWithRank,
      // null if the current user is already in the top 10
      currentUserRank: currentUserRank
        ? {
            rank: currentUserRank.rank,
            username: currentUserRank.username,
            xp_earned: currentUserRank.xp_earned,
            level: currentUserRank.level,
          }
        : null,
    }
  }
}