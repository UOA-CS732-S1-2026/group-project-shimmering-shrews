import { Request, Response, NextFunction } from "express"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_KEY!
)

const supabaseJwtMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return next(new Error("No token provided"))
    }

    // Use Supabase's built-in JWT verification
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.error("❌ Supabase JWT verification failed:", error?.message)
      return next(new Error("Invalid token"))
    }

    // Attach user to request
    ;(req as AuthRequest).auth = {
      sub: user.id,
      email: user.email,
      ...user
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

export const requireAuth = [
  // debugMiddleware,
  supabaseJwtMiddleware,
]

console.log("requireAuth initialised")

export interface AuthRequest extends Request {
  auth?: {
    sub: string
    email?: string
    [key: string]: any
  }
}

export const attachUser = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  console.log("👤 User attached:", req.auth?.sub)
  next()
}