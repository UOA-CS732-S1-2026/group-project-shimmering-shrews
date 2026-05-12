import { badgeDAO } from '../daos/badgeDAO'
import { userDAO } from '../daos/userDao'
import { AuthRequest } from '../middleware/auth'

export const UserService = {
	/**
	 * Gets the profile info and badges of the targetUser. If targetUserId field is not supplied,
	 * get the user info of the user making the call.
	 * 
	 * Users can only get their only profile info, but this is setup such that it is possible to expand this
	 * so that admins can also fetch user details.
	 * 
	 * @param authUserId the id of the user making the call
	 * @param targetUserId the id of the user to get the profile data of. If this field is not supplied, get auth user instead.
	 * @returns the user profile data, or a 403 forbidden status code if they're unauthorised to view that info
	 */
	async getProfile(authUserId: string, targetUserId?: string) {
		// if no targetID is provided, use the id of the user making the call
		const authId = targetUserId ?? authUserId

		// only the current user can get their profile info (suppports adding admin support later)
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
  async getLeaderboard(authUserId: string) {
    const { topUsers, currentUserRank } = await userDAO.getLeaderboard(authUserId)

    const topUsersWithRank = topUsers.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      xp_earned: user.xp_earned,
      level: user.level,
      isCurrentUser: user.auth_id === authUserId,
    }))

    return {
      topUsers: topUsersWithRank,
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
