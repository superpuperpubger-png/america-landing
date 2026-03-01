import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const app = express()
const httpServer = createServer(app)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isProd = !!process.env.RENDER || process.env.NODE_ENV === 'production'
const corsOrigins = isProd ? true : ['http://localhost:5173', 'http://127.0.0.1:5173']

const io = new Server(httpServer, {
  cors: { origin: corsOrigins }
})

const JWT_SECRET = process.env.JWT_SECRET || 'america-landing-secret-change-in-production'
const PORT = process.env.PORT || 3001

app.use(cors({ origin: corsOrigins, credentials: true }))
app.use(express.json())

// Static for uploaded media
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}
app.use('/uploads', express.static(uploadsDir))

// Multer config for chat media
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    const base = path.basename(file.originalname || 'file', ext).replace(/[^\w\-]+/g, '_')
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext || ''}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true)
    } else {
      cb(new Error('Разрешены только фото и видео'))
    }
  }
})

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
    onlineNow: io.of('/').sockets.size
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
    const { user, text, type, fileUrl, fileName, fileSize, fileMime } = data || {}
    if (!user || !user.id || !user.username) return

    const base = {
      id: String(Date.now()) + Math.random().toString(36).slice(2),
      userId: user.id,
      username: user.username,
      time: new Date().toISOString()
    }

    let msg = null

    if (type === 'image' || type === 'video') {
      if (!fileUrl) return
      msg = {
        ...base,
        type,
        fileUrl,
        fileName: fileName || null,
        fileSize: typeof fileSize === 'number' ? fileSize : null,
        fileMime: fileMime || null,
        text: (text || '').toString().trim().slice(0, 500) || null
      }
    } else {
      const safeText = (text || '').toString().trim()
      if (!safeText) return
      msg = {
        ...base,
        type: 'text',
        text: safeText.slice(0, 1000)
      }
    }

    messages.push(msg)
    if (messages.length > MAX_MESSAGES) messages.shift()
    io.emit('chat:message', msg)
  })

  socket.on('chat:clear', () => {
    messages.length = 0
    io.emit('chat:cleared')
  })
})

// HTTP upload for chat media (photo/video)
app.post('/api/chat/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Ошибка загрузки файла' })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не получен' })
    }

    const { userId, username, text } = req.body || {}
    if (!userId || !username) {
      return res.status(400).json({ error: 'Нет данных пользователя' })
    }

    const mime = req.file.mimetype || ''
    let msgType = 'file'
    if (mime.startsWith('image/')) msgType = 'image'
    else if (mime.startsWith('video/')) msgType = 'video'

    const base = {
      id: String(Date.now()) + Math.random().toString(36).slice(2),
      userId,
      username,
      time: new Date().toISOString(),
      type: msgType,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname || null,
      fileSize: req.file.size || null,
      fileMime: mime || null
    }

    const safeText = (text || '').toString().trim()
    const msg = safeText ? { ...base, text: safeText.slice(0, 500) } : { ...base, text: null }

    messages.push(msg)
    if (messages.length > MAX_MESSAGES) messages.shift()
    io.emit('chat:message', msg)

    res.json(msg)
  })
})

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}` + (isProd ? ' (production)' : ''))
})
