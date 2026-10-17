import { mapTransaction } from './data.jsx'

const API_URL = 'https://wedev-api.sky.pro/api'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const request = async (path, { token, ...options } = {}) => {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new ApiError('Не удалось связаться с сервером. Проверьте подключение к интернету.')
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new ApiError('Сервер вернул некорректный ответ', response.status)
  }

  if (!result || typeof result !== 'object') {
    throw new ApiError('Сервер вернул некорректный ответ', response.status)
  }

  if (!response.ok) {
    throw new ApiError(
      result.error || result.message || `Ошибка запроса (${response.status})`,
      response.status,
    )
  }

  return result
}

const normalizeUser = user => {
  if (!user || typeof user.token !== 'string' || !user.token) {
    throw new ApiError('Сервер не вернул токен авторизации')
  }
  return {
    id: user._id ?? user.id,
    login: user.login,
    name: user.name,
    token: user.token,
  }
}

export const login = async credentials => {
  const { user } = await request('/user/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  return normalizeUser(user)
}

export const register = async credentials => {
  const { user } = await request('/user', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  return normalizeUser(user)
}

export const getTransactions = async token => {
  const transactions = await request('/transactions?sortBy=date', { token })
  if (!Array.isArray(transactions)) throw new ApiError('Сервер вернул неверный список расходов')
  return transactions.map(mapTransaction)
}

export const createTransaction = async (token, transaction) => {
  const result = await request('/transactions', {
    method: 'POST',
    token,
    body: JSON.stringify(transaction),
  })
  if (!Array.isArray(result.transactions)) throw new ApiError('Сервер не вернул обновленный список расходов')
  return result.transactions.map(mapTransaction)
}

export const deleteTransaction = async (token, id) => {
  const result = await request(`/transactions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
  if (!Array.isArray(result.transactions)) throw new ApiError('Сервер не вернул обновленный список расходов')
  return result.transactions.map(mapTransaction)
}

export const getTransactionsByPeriod = async (token, start, end) => {
  const transactions = await request('/transactions/period', {
    method: 'POST',
    token,
    body: JSON.stringify({ start, end }),
  })
  if (!Array.isArray(transactions)) throw new ApiError('Сервер вернул неверный список расходов за период')
  return transactions.map(mapTransaction)
}
