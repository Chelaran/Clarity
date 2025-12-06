/**
 * Утилита для работы с API
 * Использует переменную окружения NEXT_PUBLIC_API_URL или дефолтное значение
 */

const getApiUrl = (): string => {
  // NEXT_PUBLIC_ переменные доступны и на клиенте, и на сервере
  // Используем переменную окружения или дефолт
  // В Docker Compose через nginx используем относительный путь /api
  // Для локальной разработки можно использовать http://localhost:8080
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
  
  // Если это относительный путь, возвращаем как есть
  // Если это полный URL (начинается с http), возвращаем его
  if (apiUrl.startsWith('http')) {
    return apiUrl
  }
  
  // Для относительных путей возвращаем как есть (nginx проксирует)
  return apiUrl
}

export const API_URL = getApiUrl()

/**
 * Создает полный URL для API эндпоинта
 */
export const apiUrl = (endpoint: string): string => {
  const baseUrl = API_URL.replace(/\/$/, '') // Убираем trailing slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${baseUrl}${path}`
}

/**
 * Выполняет fetch запрос с авторизацией
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = apiUrl(endpoint)
  
  // Получаем токен из localStorage (только в браузере)
  let token: string | null = null
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

