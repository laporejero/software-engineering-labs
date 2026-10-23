import express from 'express'
import { randomBytes } from 'node:crypto'
import { sessions } from './sessions.js'
import cookieParser from 'cookie-parser'
import { authenticate } from './middleware/authenticate.js'
import { notes } from './data/note.js'

const app = express()

const testUser = {
    id: 1,
    email: 'user@example.com',
    password: 'password123'
}

app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
})

app.post('/login', (req, res) => {
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

    if (
        email !== testUser.email || 
        password !== testUser.password
    ) {
        return res.status(401).json({
            error: 'invalid credentials'
        })
    }

    const sessionId = randomBytes(32).toString('hex')

    const expiresAt = Date.now() + 60 * 60 * 1000
    // const expiresAt = Date.now() + 10000

    sessions.set(sessionId, {
        userId: testUser.id,
        expiresAt
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

app.post('/logout', authenticate, (req, res) => {
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

const PORT = 3000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})