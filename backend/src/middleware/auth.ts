import { Request, Response, NextFunction } from "express"
import { createClient } from "@supabase/supabase-js"

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
      return next(new Error("No token provided"))
    }

    // Use Supabase's built-in JWT verification
    // Uses claims so our server can verify the user without making a round trip to the DB
    const { data, error } = await supabase.auth.getClaims(token)

    if (error || !data?.claims) {
      console.error("❌ Supabase JWT verification failed", error?.message)
      return next(new Error("Invalid token"))
    }

    const { claims } = data

    if (!claims.sub) {
      return next(new Error("Invalid token payload"))
    }

    req.auth = {
      ...claims,
    }

    next()
  } catch (err) {
    console.error("❌ JWT middleware error:", err)
    next(err)
  }
}

const debugMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  console.log("➡️ Incoming request:", req.method, req.path)
  console.log("🔑 Auth header:", req.headers.authorization)
  const token = req.headers.authorization?.split(" ")[1]
  console.log("🧾 Extracted token:", token?.substring(0, 50) + "...")
  next()
}

/* If this is specified, the API can only be called if the user has a session,
 * I.e. user must be signed in
*/
export const requireAuth = [
  // debugMiddleware,
  supabaseJwtMiddleware,
]

/* if this is specified, the user can only make a API call
 * to a path with param :userID if that id matches the ID in their session
 * I.e. a user can only query themself.
*/
export const requireSelf = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.params.id !== req.auth?.sub) {
    return res.status(403).json({ error: 'Forbidden'})
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