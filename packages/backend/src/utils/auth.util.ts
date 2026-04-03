import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-in-production')
const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d'

export interface ITokenPayload extends JWTPayload {
  userId: string
  email: string
}

export async function signAuthToken(payload: Omit<ITokenPayload, keyof JWTPayload>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)
}

export async function verifyAuthToken(token: string): Promise<ITokenPayload> {
  const { payload } = await jwtVerify(token, secret)
  return payload as ITokenPayload
}
