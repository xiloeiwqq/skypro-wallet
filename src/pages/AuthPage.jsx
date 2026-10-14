import { useState } from 'react'

const AuthPage = ({ onSwitchToRegister, onSubmit, errorMessage }) => {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = event => {
    event.preventDefault()
    onSubmit({ login, password })
  }

  return (
    <>
      <header className="topbar">
        <div className="logo-wrap">
          <img src="/Vector.svg" alt="Skypro.Wallet" className="brand-logo" />
        </div>
      </header>

      <main className="auth-screen">
        <section className="auth-card" aria-label="Форма входа">
          <h1>Вход</h1>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="field">
              <input
                type="text"
                required
                value={login}
                onChange={event => setLogin(event.target.value)}
                placeholder="Логин"
                aria-label="Логин"
                aria-invalid={Boolean(errorMessage)}
              />
            </label>

            <label className="field">
              <input
                type="password"
                required
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Пароль"
                aria-label="Пароль"
                aria-invalid={Boolean(errorMessage)}
              />
            </label>

            {errorMessage && <p className="form-error">{errorMessage}</p>}

            <button type="submit" className="primary-button">
              Войти
            </button>
          </form>

          <p className="register-note">
            Нужно зарегистрироваться?
            <br />
            <button type="button" className="text-link" onClick={onSwitchToRegister}>
              Регистрируйтесь здесь
            </button>
          </p>
        </section>
      </main>
    </>
  )
}

export default AuthPage
