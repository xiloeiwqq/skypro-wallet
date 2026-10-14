import { useState } from 'react'
import { categoryOptions, formatCurrency, formatDate } from '../data.jsx'

const ExpensesPage = ({ expenses, onExpensesChange, onLogout, onOpenAnalysis }) => {
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(categoryOptions[0].label)
  const [date, setDate] = useState('')
  const [amount, setAmount] = useState('')
  const [formError, setFormError] = useState('')

  const handleSubmit = event => {
    event.preventDefault()
    const numericAmount = Number(amount)

    if (!description.trim() || !category || !date || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError('Заполните все поля и укажите сумму больше нуля')
      return
    }

    const nextExpenses = [{
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      description: description.trim(),
      category,
      date,
      amount: numericAmount,
    }, ...expenses]
    const saved = onExpensesChange(nextExpenses)
    setDescription('')
    setCategory(categoryOptions[0].label)
    setDate('')
    setAmount('')
    setFormError(saved ? '' : 'Расход добавлен, но не сохранен в браузере')
  }

  const handleDelete = id => {
    const saved = onExpensesChange(expenses.filter(expense => expense.id !== id))
    setFormError(saved ? '' : 'Расход удален, но изменения не сохранены в браузере')
  }

  return (
    <>
      <header className="topbar">
        <div className="logo-wrap">
          <img src="/Vector.svg" alt="Skypro.Wallet" className="brand-logo" />
        </div>

        <nav className="topnav" aria-label="Основная навигация">
          <button type="button" className="nav-link active" aria-current="page">
            Мои расходы
          </button>
          <button type="button" className="nav-link" onClick={onOpenAnalysis}>
            Анализ расходов
          </button>
        </nav>

        <button type="button" className="logout-button" onClick={onLogout}>
          Выйти
        </button>
      </header>

      <main className="expenses-shell">
        <h1 className="page-title">Мои расходы</h1>

        <div className="expenses-layout">
          <section className="data-card">
            <h2>Таблица расходов</h2>

            <div className="table-wrap">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Описание</th>
                    <th>Категория</th>
                    <th>Дата</th>
                    <th>Сумма</th>
                    <th aria-label="Действия" />
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense.id}>
                      <td>{expense.description}</td>
                      <td>{expense.category}</td>
                      <td>{formatDate(expense.date)}</td>
                      <td>{formatCurrency(expense.amount)}</td>
                      <td className="delete-cell">
                        <button
                          type="button"
                          className="delete-button"
                          aria-label={`Удалить расход «${expense.description}»`}
                          onClick={() => handleDelete(expense.id)}
                        >
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M3 4h10M6 4V2.5h4V4m2 0-.6 9H4.6L4 4m2.5 2v5m3-5v5" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {expenses.length === 0 && <p className="empty-state">Пока нет расходов</p>}
            </div>
          </section>

          <aside className="add-card">
            <h2>Новый расход</h2>

            <form className="expense-form" onSubmit={handleSubmit} noValidate>
              <label className="field-group">
                <span>Описание</span>
                <input
                  type="text"
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  placeholder="Введите описание"
                  aria-label="Описание"
                />
              </label>

              <div className="field-group category-field">
                <span>Категория</span>
                <div className="category-grid" role="group" aria-label="Категория расхода">
                  {categoryOptions.map(option => (
                    <button
                      type="button"
                      key={option.label}
                      className={`chip ${category === option.label ? 'selected' : ''}`}
                      aria-pressed={category === option.label}
                      onClick={() => setCategory(option.label)}
                    >
                      <svg className="chip-icon" viewBox="0 0 16 16" aria-hidden="true">
                        {option.icon}
                      </svg>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="field-group">
                <span>Дата</span>
                <input
                  type="date"
                  value={date}
                  onChange={event => setDate(event.target.value)}
                  aria-label="Дата"
                />
              </label>

              <label className="field-group">
                <span>Сумма</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={event => setAmount(event.target.value)}
                  placeholder="Введите сумму"
                  aria-label="Сумма"
                />
              </label>

              {formError && <p className="form-error" role="alert">{formError}</p>}
              <button type="submit" className="primary-button expense-button">
                Добавить новый расход
              </button>
            </form>
          </aside>
        </div>
      </main>
    </>
  )
}

export default ExpensesPage
