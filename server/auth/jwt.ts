import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { randomBytes, createHash } from 'crypto'
import type { JwtPayload } from '../types/auth'

const ISSUER = 'datchi-auth'

const ACCESS_TTL_SECONDS = parseInt(process.env.JWT_ACCESS_TTL_SECONDS || '3600', 10)
const REFRESH_TTL_SECONDS = parseInt(process.env.JWT_REFRESH_TTL_SECONDS || '7776000', 10)

function getSigningKey(): Uint8Array {
  const secret = process.env.JWT_SIGNING_SECRET
  if (!secret) {
    throw new Error('JWT_SIGNING_SECRET is not set')
  }
  return new TextEncoder().encode(secret)
}

export interface AccessTokenClaims {
  employeeId: number
  employeeCode: string
  roles: string[]
  isRoot: boolean
}

export interface IssuedAccessToken {
  token: string
  expiresAt: number
}

export async function signAccessToken(claims: AccessTokenClaims): Promise<IssuedAccessToken> {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const exp = nowSeconds + ACCESS_TTL_SECONDS

  const token = await new SignJWT({
    employee_id: claims.employeeId,
    employee_code: claims.employeeCode,
    roles: claims.roles,
    is_root: claims.isRoot,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(String(claims.employeeId))
    .setIssuer(ISSUER)
    .setIssuedAt(nowSeconds)
    .setExpirationTime(exp)
    .sign(getSigningKey())

  return { token, expiresAt: exp }
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSigningKey(), {
    algorithms: ['HS256'],
    issuer: ISSUER,
  })
  return payload as unknown as JwtPayload
}

export interface IssuedRefreshToken {
  token: string
  tokenHash: string
  expiresAt: Date
}

export function generateRefreshToken(): IssuedRefreshToken {
  const token = randomBytes(48).toString('base64url')
  const tokenHash = hashRefreshToken(token)
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000)
  return { token, tokenHash, expiresAt }
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function assertSigningKeyConfigured(): void {
  getSigningKey()
}

export type { JWTPayload }
