import express from 'express'
import { randomBytes } from 'node:crypto'
import { sessions } from './sessions.js'
import cookieParser from 'cookie-parser'
import { authenticate } from './middleware/authenticate.js'
import { notes } from './data/note.js'
import argon2 from 'argon2'
import { validateCsrf } from './middleware/validateCsrf.js'
import { validateOrigin } from './middleware/validateOrigin.js'

const app = express()

const testUser = {
    id: 1,
    email: 'user@example.com',
    passwordHash: '$argon2id$v=19$m=65536,p=4,t=3$IVI7YuuDoYHtvFT3HRbnug$rLi2ldInaWcZEHU23M7t4+xp+SjAXwtUGERQBsEw/VQ'
}

app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
})

app.post('/login', validateOrigin, async (req, res) => {
    const { email, password } = req.body

    if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        !email ||
        !password
    ) {
        return res.status(400).json({
            error: 'email and password are required'
        })
    }

    if (email !== testUser.email) {
        return res.status(401).json({
            error: 'invalid credentials'
        })
    }

    const passwordIsValid = await argon2.verify(testUser.passwordHash, password)

    if (!passwordIsValid) {
        return res.status(401).json({
            error: 'invalid credentials'
        })
    }

    // Generate an ID for this session
    const sessionId = randomBytes(32).toString('hex')

    // Generate an unpredictable CSRF token for this session.
    const csrfToken = randomBytes(32).toString('hex')

    const expiresAt = Date.now() + 60 * 60 * 1000 // 1 hour
    // const expiresAt = Date.now() + 10000

    sessions.set(sessionId, {
        userId: testUser.id,
        expiresAt,
        csrfToken
    })

    res.cookie('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 1000
    })

    return res.status(200).json({
        message: 'Login successful'
    })
})

app.post('/logout', authenticate, validateOrigin, validateCsrf, (req, res) => {
    const sessionId = req.cookies.session_id as string

    sessions.delete(sessionId)

    res.clearCookie('session_id', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    })

    return res.status(200).json({
        message: 'Logout successful'
    })
})

app.get('/test-auth', authenticate, (req, res) => {
    res.json({
        message: 'Authenticated request',
        userId: req.userId
    })
})

app.get('/notes/:id', authenticate, (req, res) => {
    const id = Number(req.params.id)
    const userId = req.userId

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'invalid note ID'
        })
    }

    const note = notes.find(note => note.id === id)

    if (!note) {
        return res.status(404).json({
            error: 'note not found'
        })
    }

    if (note.userId !== userId) {
        return res.status(403).json({
            error: 'access forbidden'
        })
    }

    return res.status(200).json(note)
})

app.get('/csrf-token', authenticate, (req, res) => {
    const session = req.session

    if (!session) {
        return res.status(401).json({
            error: 'authentication required'
        })
    }

    // Prevent browsers and intermediaries from caching the token.
    res.setHeader('Cache-Control', 'no-store')

    // Return only the CSRF token, not the session ID.
    return res.status(200).json({
        csrfToken: session.csrfToken
    })
})

const PORT = 3000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})