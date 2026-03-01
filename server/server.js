import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const app = express()
const httpServer = createServer(app)

const isProd = !!process.env.RENDER || process.env.NODE_ENV === 'production'
const corsOrigins = isProd ? true : ['http://localhost:5173', 'http://127.0.0.1:5173']

const io = new Server(httpServer, {
  cors: { origin: corsOrigins }
})

const JWT_SECRET = process.env.JWT_SECRET || 'america-landing-secret-change-in-production'
const PORT = process.env.PORT || 3001

app.use(cors({ origin: corsOrigins, credentials: true }))
app.use(express.json())

// In-memory store (in production use DB)
const users = []
const messages = []
const MAX_MESSAGES = 300
let totalVisits = 0

// Traffic: increment visits
app.post('/api/traffic/visit', (req, res) => {
  totalVisits++
  res.json({ totalVisits })
})

app.get('/api/traffic', (req, res) => {
  res.json({
    totalVisits,
    onlineNow: io.engine.clientsCount
  })
})

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Заполните все поля' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль не менее 6 символов' })
    }
    if (users.some(u => u.email === email)) {
      return res.status(400).json({ error: 'Такой email уже зарегистрирован' })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = {
      id: String(Date.now()),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword
    }
    users.push(user)
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET)
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email }
    })
  } catch (e) {
    res.status(500).json({ error: 'Ошибка регистрации' })
  }
})

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Введите email и пароль' })
    }
    const user = users.find(u => u.email === email.trim().toLowerCase())
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' })
    }
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return res.status(401).json({ error: 'Неверный email или пароль' })
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET)
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email }
    })
  } catch (e) {
    res.status(500).json({ error: 'Ошибка входа' })
  }
})

// Get current user
app.get('/api/me', (req, res) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Нет токена' })
  }
  try {
    const token = auth.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = users.find(u => u.id === decoded.id)
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' })
    res.json({ user: { id: user.id, username: user.username, email: user.email } })
  } catch (e) {
    res.status(401).json({ error: 'Неверный токен' })
  }
})

// Socket.IO: chat
io.on('connection', (socket) => {
  socket.on('chat:history', () => {
    socket.emit('chat:history', messages.slice(-100))
  })

  socket.on('chat:message', (data) => {
    const { user, text } = data
    if (!user || !text || !text.trim()) return
    const msg = {
      id: String(Date.now()) + Math.random().toString(36).slice(2),
      userId: user.id,
      username: user.username,
      text: text.trim().slice(0, 1000),
      time: new Date().toISOString()
    }
    messages.push(msg)
    if (messages.length > MAX_MESSAGES) messages.shift()
    io.emit('chat:message', msg)
  })
})

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}` + (isProd ? ' (production)' : ''))
})
