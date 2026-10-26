export type AuthUser = {
  id: number
  name: string
  email: string
  telegram: string
}

export type RegisterData = {
  name: string
  email: string
  telegram: string
  password: string
  termsAccepted: boolean
}

export type UserSession = {
  id: number
  device: string
  ip: string
  secondsAgo: number
  current: boolean
}

const API_URL = `${import.meta.env.BASE_URL}api`

async function request<T>(endpoint: string, body?: object): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}/${endpoint}.php`, body === undefined
      ? { credentials: 'same-origin' }
      : {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
  } catch {
    throw new Error('Нет связи с сервером')
  }

  const data = await response.json().catch(() => null)
  if (!data) throw new Error('Сервер авторизации недоступен')
  if (!response.ok || !data.ok) throw new Error(data.error || 'Ошибка сервера')
  return data as T
}

function post<T>(endpoint: string, body: object = {}): Promise<T> {
  return request<T>(endpoint, body)
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  return (await request<{ user: AuthUser | null }>('me')).user
}

export async function login(email: string, password: string): Promise<AuthUser> {
  return (await post<{ user: AuthUser }>('login', { email, password })).user
}

export async function register(data: RegisterData): Promise<AuthUser> {
  return (await post<{ user: AuthUser }>('register', data)).user
}

export async function logout(): Promise<void> {
  await post('logout')
}

export async function updateProfile(name: string): Promise<AuthUser> {
  return (await post<{ user: AuthUser }>('profile', { name })).user
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await post('password', { currentPassword, newPassword })
}

export async function fetchSessions(): Promise<UserSession[]> {
  return (await request<{ sessions: UserSession[] }>('sessions')).sessions
}

export async function revokeSession(id: number): Promise<void> {
  await post('session-revoke', { id })
}
