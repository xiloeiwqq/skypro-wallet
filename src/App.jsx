import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { ApiError, createTransaction, deleteTransaction, getTransactions, login, register } from './api.js'
import AuthPage from './pages/AuthPage'
import RegistrationPage from './pages/RegistrationPage'
import ExpensesPage from './pages/ExpensesPage'
import AnalysisPage from './pages/AnalysisPage'
import { categoryByLabel } from './data.jsx'

const USER_KEY = 'skypro-wallet-user'

const getSavedUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    if (!user?.token) {
      if (user) localStorage.removeItem(USER_KEY)
      return null
    }

    if (Object.hasOwn(user, 'password')) {
      const safeUser = { ...user }
      delete safeUser.password
      localStorage.setItem(USER_KEY, JSON.stringify(safeUser))
      return safeUser
    }
    return user
  } catch (error) {
    console.error('Unable to read saved user', error)
    return null
  }
}

function App() {
  const [user, setUser] = useState(getSavedUser)
  const [view, setView] = useState(() => (getSavedUser() ? 'expenses' : 'login'))
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [expenses, setExpenses] = useState([])
  const [expensesLoading, setExpensesLoading] = useState(Boolean(user))
  const [expensesError, setExpensesError] = useState('')
  const [mutationLoading, setMutationLoading] = useState(false)

  const saveUser = authenticatedUser => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser))
    } catch (error) {
      console.error('Unable to save authenticated user', error)
      throw new Error('Не удалось сохранить авторизацию в браузере')
    }
  }

  const handleLogin = async ({ login: username, password }) => {
    if (!username.trim() || !password) {
      setAuthError('Заполните все поля')
      return
    }
    setAuthLoading(true)
    setAuthError('')
    try {
      const authenticatedUser = await login({ login: username.trim(), password })
      saveUser(authenticatedUser)
      setExpensesLoading(true)
      setExpensesError('')
      setUser(authenticatedUser)
      setExpenses([])
      setView('expenses')
    } catch (error) {
      setAuthError(error instanceof ApiError ? error.message : error.message || 'Не удалось войти')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegister = async ({ name, email, password }) => {
    const trimmedName = name.trim()
    const username = trimmedName.toLowerCase().replace(/\s+/g, '')
    if (!trimmedName || !email.trim() || !password.trim()) {
      setAuthError('Заполните все поля')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setAuthError('Введите корректный адрес эл. почты')
      return
    }
    if (trimmedName.length < 3 || username.length < 3 || password.length < 3) {
      setAuthError('Имя, логин и пароль должны содержать не менее 3 символов')
      return
    }

    setAuthLoading(true)
    setAuthError('')
    try {
      const authenticatedUser = await register({
        login: username,
        name: trimmedName,
        password,
      })
      saveUser(authenticatedUser)
      setExpensesLoading(true)
      setExpensesError('')
      setUser(authenticatedUser)
      setExpenses([])
      setView('expenses')
    } catch (error) {
      setAuthError(error instanceof ApiError ? error.message : error.message || 'Не удалось зарегистрироваться')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem(USER_KEY)
    } catch (error) {
      console.error('Unable to clear saved user', error)
    }
    setExpenses([])
    setUser(null)
    setAuthError('')
    setExpensesError('')
    setView('login')
  }, [])

  const handleSessionExpired = useCallback(() => {
    handleLogout()
    setAuthError('Сессия завершилась. Войдите снова.')
  }, [handleLogout])

  const loadExpenses = async () => {
    if (!user?.token) return
    try {
      setExpenses(await getTransactions(user.token))
      setExpensesError('')
    } catch (error) {
      setExpensesError(error.message || 'Не удалось загрузить расходы')
      if (error.status === 401) handleSessionExpired()
    } finally {
      setExpensesLoading(false)
    }
  }

  const retryExpenses = () => {
    setExpensesLoading(true)
    setExpensesError('')
    loadExpenses()
  }

  useEffect(() => {
    if (!user?.token) return undefined
    let active = true
    getTransactions(user.token)
      .then(transactions => {
        if (!active) return
        setExpenses(transactions)
        setExpensesError('')
      })
      .catch(error => {
        if (!active) return
        setExpensesError(error.message || 'Не удалось загрузить расходы')
        if (error.status === 401) handleSessionExpired()
      })
      .finally(() => {
        if (active) setExpensesLoading(false)
      })
    return () => {
      active = false
    }
  }, [user?.token, handleSessionExpired])

  const handleCreateExpense = async expense => {
    if (!user?.token) throw new Error('Необходимо войти в аккаунт')
    setMutationLoading(true)
    try {
      const nextExpenses = await createTransaction(user.token, {
        description: expense.description,
        sum: expense.amount,
        category: categoryByLabel[expense.category],
        date: expense.date,
      })
      setExpenses(nextExpenses)
    } catch (error) {
      if (error.status === 401) handleSessionExpired()
      throw error
    } finally {
      setMutationLoading(false)
    }
  }

  const handleDeleteExpense = async id => {
    if (!user?.token) throw new Error('Необходимо войти в аккаунт')
    setMutationLoading(true)
    try {
      setExpenses(await deleteTransaction(user.token, id))
    } catch (error) {
      if (error.status === 401) handleSessionExpired()
      throw error
    } finally {
      setMutationLoading(false)
    }
  }

  if (user && view === 'expenses') {
    return (
      <ExpensesPage
        expenses={expenses}
        loading={expensesLoading}
        loadError={expensesError}
        mutationLoading={mutationLoading}
        onCreateExpense={handleCreateExpense}
        onDeleteExpense={handleDeleteExpense}
        onRetry={retryExpenses}
        onLogout={handleLogout}
        onOpenAnalysis={() => setView('analysis')}
      />
    )
  }

  if (user && view === 'analysis') {
    return (
      <AnalysisPage
        expenses={expenses}
        token={user.token}
        onLogout={handleLogout}
        onUnauthorized={handleSessionExpired}
        onOpenExpenses={() => setView('expenses')}
      />
    )
  }

  if (view === 'register') {
    return (
      <RegistrationPage
        loading={authLoading}
        onSwitchToLogin={() => {
          setView('login')
          setAuthError('')
        }}
        onSubmit={handleRegister}
        errorMessage={authError}
      />
    )
  }

  return (
    <AuthPage
      loading={authLoading}
      onSwitchToRegister={() => {
        setView('register')
        setAuthError('')
      }}
      onSubmit={handleLogin}
      errorMessage={authError}
    />
  )
}

export default App
