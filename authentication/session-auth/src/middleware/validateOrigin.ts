import type { Request, Response, NextFunction } from 'express'

// The origin allowed to initiate browser requests in this lab.
const trustedOrigin = 'http://localhost:3000'

export const validateOrigin = (req: Request, res: Response, next: NextFunction) => {
    // Read the Origin header supplied by the client.
    const origin = req.get('Origin')

    // Reject missing or untrusted origins.
    if (origin !== trustedOrigin) {
        return res.status(403).json({
            error: 'untrusted request origin'
        })
    }

    // Origin is trusted; continue processing the request.
    next()
}