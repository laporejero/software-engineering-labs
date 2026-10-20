import type { Request, Response, NextFunction } from 'express'
import { sessions } from '../sessions.js'

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.cookies?.session_id

    if (typeof sessionId !== 'string' || !sessionId) {
        res.status(401).json({
            error: 'authentication required'
        })
        return
    }

    const session = sessions.get(sessionId)

    if (!session) {
        res.status(401).json({ error: 'invalid session' })
        return
    }

    if (session.expiresAt <= Date.now()) {
        sessions.delete(sessionId)

        res.status(401).json({ error: 'session expired' })
        return
    }

    req.userId = session.userId

    next()
}