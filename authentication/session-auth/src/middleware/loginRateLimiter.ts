import type { Request, Response, NextFunction } from 'express'

// Max number of login attempts allowed per IP address.
const MAX_ATTEMPTS = 5

// Duration of the rate-limit window: 60 seconds.
const WINDOW_MS = 60 * 1000

// Tracks login attempts for a single IP address.
interface LoginAttempt {
    count: number
    resetAt: number
}

// In-memory storage keyed by IP address.
const attempts = new Map<string, LoginAttempt>()

// Remove expired rate-limit record once per window.
const cleanupInterval = setInterval(() => {
    const now = Date.now()

    // Examine every stored IP address and its attempt record.
    for (const [ip, record] of attempts) {
        // Remove entries whose rate-limit window has expired
        if (now >= record.resetAt) {
            attempts.delete(ip)
        }
    }
}, WINDOW_MS)

// Allow Node.js to exit naturally without waiting for this timer.
// The cleanup still runs while the server process is active.
cleanupInterval.unref()

export const loginRateLimiter = (req: Request, res: Response, next: NextFunction) => {
    // User Express's client IP address as the rate-limit key.
    const ip = req.ip ?? 'unknown'

    // Capture the current time in milliseconds.
    const now = Date.now()

    // Look up the IP address's existing attempt record.
    const record = attempts.get(ip)

    // Start a new window if no record exists or the old one expired.
    if (!record || now >= record.resetAt) {
        attempts.set(ip, {
            count: 1,
            resetAt: now + WINDOW_MS
        })

        return next()
    }

    // Reject attempts after the maximum has already been reached.
    if (record.count >= MAX_ATTEMPTS) {
        // Tell the client how many seconds remain before retrying.
        const retryAfter = Math.ceil((record.resetAt - now) / 1000)

        res.setHeader('Retry-After', retryAfter.toString())

        return res.status(429).json({
            error: 'too many login attempts'
        })
    }

    // Count the current request before allowing it through.
    record.count += 1

    next()
}