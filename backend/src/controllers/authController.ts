import { Request, Response } from 'express'
import prisma from '../config/prisma'

export const syncUser = async (req: Request, res: Response) => {
  const user = (req as any).auth

  try {
    const profile = await prisma.users.upsert({
      where: { id: user.sub },
      update: {},
      create: {
        id: user.sub,
        email: user.email,
        username:  user.email.split("@")[0],
        user_role: "user"
      }
    })

    res.json(profile)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to sync user' })
  }
}