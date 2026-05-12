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
    [key: string]: any
  }
}

const supabaseJwtMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return next(new ApiError(401, "No token provided"))
    }

    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) {
      return next(new ApiError(401, "Invalid token"))
    }

    if (!data.user.id) {
      return next(new ApiError(401, "Invalid token payload"))
    }

    req.auth = {
      sub: data.user.id,
      email: data.user.email,
    }
    next()
  } catch (err) {
    next(err)
  }
}

console.log("requireAuth initialised")

export const attachUser = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  console.log("👤 User attached:", req.auth?.sub)
  next()
}

export const requireAuth = [supabaseJwtMiddleware]

export const requireSelf = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const requestedUserId = req.params.id
  const authenticatedUserId = req.auth?.sub

  // Authorization compares immutable auth IDs exactly and case-sensitively.
  // Empty IDs are treated as missing auth data so malformed requests cannot
  // accidentally pass the ownership check.
  if (!requestedUserId || !authenticatedUserId || requestedUserId !== authenticatedUserId) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  next()
}
