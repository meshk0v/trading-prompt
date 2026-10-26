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

const API_URL = `${import.meta.env.BASE_URL}api`

async function post<T>(endpoint: string, body: object = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}/${endpoint}.php`, {
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

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${API_URL}/me.php`, { credentials: 'same-origin' })
  const data = await response.json()
  return data.user ?? null
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
