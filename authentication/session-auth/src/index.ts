import express from 'express'
import { randomBytes } from 'node:crypto'
import { sessions } from './sessions.js'

const app = express()

const testUser = {
    id: 1,
    email: 'user@example.com',
    password: 'password123'
}

app.use(express.json())

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

app.get('/inspect-cookie', (req, res) => {
    res.json({
        cookieHeader: req.headers.cookie ?? null
    })
})

const PORT = 3000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})