import prisma from '../config/prisma'
import { AuthRequest } from '../middleware/auth'
import { ApiError } from '../utils/ApiError'
import { asyncHandler } from '../utils/asyncHandler'
import { buildUsernameFromAuth } from '../utils/username'

export const syncUser = asyncHandler(async (req, res) => {
  const user = (req as AuthRequest).auth

  if (!user?.email) {
    throw new ApiError(401, 'Authenticated user email is missing')
  }

  const profile = await prisma.users.upsert({
    where: { auth_id: user.sub },
    update: {},
    create: {
      auth_id: user.sub,
      email: user.email,
      username: buildUsernameFromAuth(user.email, user.sub),
      user_role: "user",
    },
  })

  res.status(200).json({
    success: true,
    data: profile,
  })
})
