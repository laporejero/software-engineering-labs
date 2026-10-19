export interface Session {
    userId: number
    expiresAt: number
}

export const sessions = new Map<string, Session>()