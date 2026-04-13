import { Request, Response, NextFunction } from "express"
import { expressjwt as jwt } from "express-jwt"
import jwksRsa from "jwks-rsa"

export const requireAuth = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: `${process.env.DATABASE_URL}/auth/v1/keys`
  }) as any,

  audience: "authenticated",
  issuer: `${process.env.DATABASE_URL}/auth/v1`,
  algorithms: ["RS256"]
})

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
  next()
}