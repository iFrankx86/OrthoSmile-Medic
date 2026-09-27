import crypto from 'crypto'

// Password hashing using PBKDF2 with SHA-512
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha512').toString('hex')
  return { hash, salt: generatedSalt }
}

export function verifyPassword(providedPassword: string, storedHash: string, salt: string): boolean {
  try {
    const { hash } = hashPassword(providedPassword, salt)
    const storedBuffer = Buffer.from(storedHash, 'hex')
    const testBuffer = Buffer.from(hash, 'hex')
    if (storedBuffer.length !== testBuffer.length) return false
    return crypto.timingSafeEqual(storedBuffer, testBuffer)
  } catch {
    return false
  }
}

// Cryptographically secure session token generator
export function generateSecureToken(userId: number): string {
  const randomPart = crypto.randomBytes(24).toString('hex')
  const timestamp = Date.now()
  return `osm_${userId}_${timestamp}_${randomPart}`
}

// In-Memory Rate Limiter for Brute Force Prevention
interface RateLimitEntry {
  attempts: number
  lockedUntil: number
}

const loginAttempts = new Map<string, RateLimitEntry>()

export function checkLoginRateLimit(key: string, maxAttempts = 5, lockDurationMs = 5 * 60 * 1000): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now()
  const entry = loginAttempts.get(key)

  if (!entry) {
    return { allowed: true }
  }

  if (entry.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((entry.lockedUntil - now) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  if (entry.attempts >= maxAttempts) {
    entry.lockedUntil = now + lockDurationMs
    const retryAfterSeconds = Math.ceil(lockDurationMs / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  return { allowed: true }
}

export function recordLoginFailure(key: string, maxAttempts = 5, lockDurationMs = 5 * 60 * 1000) {
  const now = Date.now()
  const entry = loginAttempts.get(key) || { attempts: 0, lockedUntil: 0 }
  entry.attempts += 1
  if (entry.attempts >= maxAttempts) {
    entry.lockedUntil = now + lockDurationMs
  }
  loginAttempts.set(key, entry)
}

export function recordLoginSuccess(key: string) {
  loginAttempts.delete(key)
}

// Input sanitizer to prevent XSS / script injection in stored fields
export function sanitizeString(val: any, maxLength = 500): string {
  if (typeof val !== 'string') return ''
  return val
    .trim()
    .replace(/[<>]/g, '') // strip HTML angle brackets
    .substring(0, maxLength)
}
