import { Request, Response } from 'express'
import prisma from '../config/prisma'
import { AuthRequest } from '../middleware/auth'

export const syncUser = async (req: AuthRequest, res: Response) => {
  const user = (req as any).auth

  try {
    const profile = await prisma.users.upsert({
      where: { auth_id: user.sub },
      update: {},
      create: {
        auth_id: user.sub,
        email: user.email,
        username:  user.email.split("@")[0],
        user_role: "user"
      }
    })

    res.json(profile)
  } catch (err) {
    console.error("SYNC USER ERROR:", err)
    res.status(500).json({
      success: false,
      message: err,
    })
  }
}