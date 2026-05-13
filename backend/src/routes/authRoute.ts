import { Router } from 'express'
import { createClient } from "@supabase/supabase-js"
import { syncUser } from '../controllers/authController'
import { requireAuth } from '../middleware/auth'

const router = Router()

// Single shared Supabase client instance for session validation.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_KEY!
)

// Validates a Supabase JWT token and returns the user's ID and email if valid.
router.get("/validate-session", async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ valid: false })
    }

    const token = authHeader.split(" ")[1]
    if (!token) {
      return res.status(401).json({ valid: false })
    }

    const { data, error } = await supabase.auth.getClaims(token)
    if (error || !data?.claims) {
      return res.status(401).json({ valid: false })
    }

    return res.json({
      valid: true,
      user: {
        id: data.claims.sub,
        email: data.claims.email,
      }
    })
  } catch (err) {
    return res.status(500).json({ valid: false })
  }
})

// Syncs the authenticated user's profile with the database after login.
router.post('/sync-user', requireAuth, syncUser)

export default router