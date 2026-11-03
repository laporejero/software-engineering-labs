import type { Session } from '../sessions.ts'

declare global {
    namespace Express {
        interface Request {
            // The authenticated user's ID.
            userId?: number
            
            // The validated server-side session.
            session?: Session
        }
    }
}

export {}