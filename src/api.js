const API_BASE = import.meta.env.VITE_API_URL || ''
const API = API_BASE ? `${API_BASE}/api` : '/api'

export function getSocketUrl() {
  return API_BASE || window.location.origin
}

export async function register(username, email, password) {
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Ошибка регистрации')
  return data
}

export async function login(email, password) {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Ошибка входа')
  return data
}

export async function getMe(token) {
  const res = await fetch(`${API}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) return null
  const data = await res.json()
  return data.user
}

export async function getTraffic() {
  const res = await fetch(`${API}/traffic`)
  if (!res.ok) return { totalVisits: 0, onlineNow: 0 }
  return res.json()
}

export async function recordVisit() {
  try {
    const res = await fetch(`${API}/traffic/visit`, { method: 'POST' })
    if (res.ok) return (await res.json()).totalVisits
  } catch (_) {}
  return null
}
