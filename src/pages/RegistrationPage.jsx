import { useState } from 'react'

const RegistrationPage = ({ onSwitchToLogin, onSubmit, errorMessage }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = event => {
    event.preventDefault()
    onSubmit({ name, email, password })
  }

  return (
    <>
      <header className="topbar">
        <div className="logo-wrap">
          <img src="/Vector.svg" alt="Skypro.Wallet" className="brand-logo" />
        </div>
      </header>

      <main className="auth-screen">
        <section className="auth-card register-card" aria-label="Форма регистрации">
          <h1>Регистрация</h1>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="field">
              <input
                type="text"
                required
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Имя"
                aria-label="Имя"
                aria-invalid={Boolean(errorMessage)}
              />
            </label>

            <label className="field">
              <input
                type="email"
                required
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="Эл. почта"
                aria-label="Email"
                aria-invalid={Boolean(errorMessage)}
              />
            </label>

            <label className="field">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Пароль"
                aria-label="Пароль"
                aria-invalid={Boolean(errorMessage)}
              />
            </label>

            {errorMessage && <p className="form-error">{errorMessage}</p>}

            <button type="submit" className="primary-button">
              Зарегистрироваться
            </button>
          </form>

          <p className="register-note">
            Уже есть аккаунт?
            <br />
            <button type="button" className="text-link" onClick={onSwitchToLogin}>
              Войдите здесь
            </button>
          </p>
        </section>
      </main>
    </>
  )
}

export default RegistrationPage
