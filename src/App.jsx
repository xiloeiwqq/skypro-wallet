import { useState } from 'react'
import './App.css'
import AuthPage from './pages/AuthPage'
import RegistrationPage from './pages/RegistrationPage'
import ExpensesPage from './pages/ExpensesPage'
import AnalysisPage from './pages/AnalysisPage'
import { sampleExpenses } from './data.jsx'

const STORAGE_KEY = 'skypro-wallet-user'
const SESSION_KEY = 'skypro-wallet-session'
const getExpensesKey = user => `skypro-wallet-expenses-${user.login}`

const getInitialExpenses = user => {
  if (!user) return []
  try {
    const saved = localStorage.getItem(getExpensesKey(user))
    if (saved !== null) {
      const parsed = JSON.parse(saved)
      if (!Array.isArray(parsed)) throw new Error('Saved expenses must be an array')
      return parsed
    }
  } catch (error) {
    console.error('Unable to read saved expenses', error)
  }

  return user.login === 'admin' ? sampleExpenses : []
}

const DEMO_USER = {
  name: 'Admin',
  login: 'admin',
  email: 'admin@skypro.ru',
  password: 'admin',
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      if (localStorage.getItem(SESSION_KEY) !== 'active') return null
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? null
    } catch {
      return null
    }
  })
  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem(SESSION_KEY) === 'active' ? 'expenses' : 'login'
    } catch {
      return 'login'
    }
  })
  const [authError, setAuthError] = useState('')
  const [expenses, setExpenses] = useState(() => getInitialExpenses(user))

  const handleExpensesChange = nextExpenses => {
    setExpenses(nextExpenses)
    if (!user) return false
    try {
      localStorage.setItem(getExpensesKey(user), JSON.stringify(nextExpenses))
      return true
    } catch (error) {
      console.error('Unable to save expenses', error)
      return false
    }
  }

  const handleLogin = ({ login, password }) => {
    if (!login.trim() || !password) {
      setAuthError('Заполните все поля')
      return
    }

    let savedUser = null
    try {
      savedUser = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    } catch {
      setAuthError('Не удалось прочитать сохраненные данные')
      return
    }
    const activeUser = savedUser || DEMO_USER

    if (login.trim() === activeUser.login && password === activeUser.password) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeUser))
      localStorage.setItem(SESSION_KEY, 'active')
      setExpenses(getInitialExpenses(activeUser))
      setUser(activeUser)
      setAuthError('')
      setView('expenses')
      return
    }

    setAuthError('Неверный логин или пароль')
  }

  const handleRegister = ({ name, email, password }) => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setAuthError('Заполните все поля')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setAuthError('Введите корректный адрес эл. почты')
      return
    }

    if (password.length < 6) {
      setAuthError('Пароль должен содержать не менее 6 символов')
      return
    }

    const newUser = {
      name: name.trim(),
      login: name.trim().toLowerCase().replace(/\s+/g, ''),
      email: email.trim(),
      password,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
    localStorage.setItem(SESSION_KEY, 'active')
    setExpenses([])
    setUser(newUser)
    setAuthError('')
    setView('expenses')
  }

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY)
    setExpenses([])
    setUser(null)
    setAuthError('')
    setView('login')
  }

  if (view === 'expenses' && user) {
    return (
      <ExpensesPage
        expenses={expenses}
        onExpensesChange={handleExpensesChange}
        onLogout={handleLogout}
        onOpenAnalysis={() => setView('analysis')}
      />
    )
  }

  if (view === 'analysis' && user) {
    return (
      <AnalysisPage
        expenses={expenses}
        onLogout={handleLogout}
        onOpenExpenses={() => setView('expenses')}
      />
    )
  }

  if (view === 'register') {
    return (
      <RegistrationPage
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
