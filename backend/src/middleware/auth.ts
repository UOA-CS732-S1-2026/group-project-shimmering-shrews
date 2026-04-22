import { Request, Response, NextFunction } from "express"
import { createClient, type User } from "@supabase/supabase-js"
import { ApiError } from "../utils/ApiError"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_KEY!
)

export interface AuthRequest extends Request {
  auth?: {
    sub: string
    email?: string
    user: User
  }
}

const supabaseJwtMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return next(new ApiError(401, "No token provided"))
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return next(new ApiError(401, "Invalid token"))
    }

    ;(req as AuthRequest).auth = {
      sub: user.id,
      email: user.email,
      user,
    }

    next()
  } catch (err) {
    next(err)
  }
}

export const requireAuth = [supabaseJwtMiddleware]
