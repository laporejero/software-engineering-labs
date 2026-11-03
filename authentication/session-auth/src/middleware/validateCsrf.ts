import type { Request, Response, NextFunction } from 'express'
import { timingSafeEqual } from 'node:crypto'

export const validateCsrf = (req: Request, res: Response, next: NextFunction) => {
    // Retrieve the authenticated user's session.
    const session = req.session

    if (!session) {
        return res.status(401).json({
            error: 'authentication required'
        })
    }

    // Read the CSRF token explicitly supplied by the client
    const submittedToken = req.get('X-CSRF-Token')

    if (!submittedToken) {
        return res.status(403).json({
            error: 'invalid CSRF token'
        })
    }

    // Convert both tokens into buffers for secure comparison.
    const expected = Buffer.from(session.csrfToken, 'utf8')
    const received = Buffer.from(submittedToken, 'utf8')

    // Reject tokens with different lengths before comparing
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
        return res.status(403).json({
            error: 'invalid CSRF token'
        })
    }

    // CSRF validation passed. Continue to the route handler.
    next()
}