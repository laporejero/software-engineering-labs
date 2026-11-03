export interface Session {
    userId: number
    expiresAt: number
    csrfToken: string // random token used to protect state-changing requests.
}

export const sessions = new Map<string, Session>()