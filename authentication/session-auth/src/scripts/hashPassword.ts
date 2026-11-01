import argon2 from 'argon2'

const password = 'password123'

const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id
})

console.log(passwordHash)