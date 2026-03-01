const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const API = API_BASE ? `${API_BASE}/api` : '/api'

export function getSocketUrl() {
  return API_BASE || window.location.origin
}

async function parseJson(res) {
  const text = await res.text()
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    if (text.trimStart().startsWith('<')) {
      throw new Error('Сервер вернул страницу вместо данных. Подождите минуту (бэкенд может запускаться) и попробуйте снова.')
    }
    throw new Error('Сервер недоступен. Попробуйте позже.')
  }
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    throw new Error('Сервер недоступен. Попробуйте позже.')
  }
}

export async function register(username, email, password) {
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data.error || 'Ошибка регистрации')
  return data
}

export async function login(email, password) {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data.error || 'Ошибка входа')
  return data
}

export async function getMe(token) {
  const res = await fetch(`${API}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) return null
  const data = await parseJson(res)
  return data.user
}

export async function getTraffic() {
  const res = await fetch(`${API}/traffic`)
  if (!res.ok) return { totalVisits: 0, onlineNow: 0 }
  try {
    return await parseJson(res)
  } catch {
    return { totalVisits: 0, onlineNow: 0 }
  }
}

export async function recordVisit() {
  try {
    const res = await fetch(`${API}/traffic/visit`, { method: 'POST' })
    if (res.ok) return (await parseJson(res)).totalVisits
  } catch (_) {}
  return null
}
