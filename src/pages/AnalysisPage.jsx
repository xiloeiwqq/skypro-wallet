import { useEffect, useMemo, useRef, useState } from 'react'
import { getTransactionsByPeriod } from '../api.js'
import { categoryOptions, formatCurrency } from '../data.jsx'

const toDateKey = date => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfMonth = date => new Date(date.getFullYear(), date.getMonth(), 1)

const formatLongDate = dateKey => {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

const getInitialRange = expenses => {
  if (!expenses.length) {
    const start = startOfMonth(new Date())
    return {
      start: toDateKey(start),
      end: toDateKey(new Date(start.getFullYear(), start.getMonth() + 1, 0)),
    }
  }

  const dates = expenses.map(expense => expense.date).sort()
  return { start: dates[0], end: dates[dates.length - 1] }
}

const getMonths = rangeStart => {
  const [year, month] = rangeStart.split('-').map(Number)
  const firstMonth = new Date(year, month - 1 - 6, 1)
  return Array.from({ length: 24 }, (_, index) => new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1))
}

const AnalysisPage = ({ expenses, token, onLogout, onOpenExpenses, onUnauthorized }) => {
  const [range, setRange] = useState(() => getInitialRange(expenses))
  const [periodExpenses, setPeriodExpenses] = useState([])
  const [periodLoading, setPeriodLoading] = useState(true)
  const [periodError, setPeriodError] = useState('')
  const [periodRefresh, setPeriodRefresh] = useState(0)
  const calendarRef = useRef(null)
  const months = useMemo(() => getMonths(range.start), [range.start])

  useEffect(() => {
    if (!range.start || !range.end) return undefined

    let active = true
    getTransactionsByPeriod(token, range.start, range.end)
      .then(transactions => {
        if (active) setPeriodExpenses(transactions)
      })
      .catch(error => {
        if (!active) return
        setPeriodError(error.message || 'Не удалось загрузить расходы за период')
        if (error.status === 401) onUnauthorized()
      })
      .finally(() => {
        if (active) setPeriodLoading(false)
      })

    return () => {
      active = false
    }
  }, [range.start, range.end, token, onUnauthorized, periodRefresh])

  useEffect(() => {
    const startMonth = range.start.slice(0, 7)
    const monthIndex = months.findIndex(month => toDateKey(month).slice(0, 7) === startMonth)
    const monthElement = calendarRef.current?.querySelector(`[data-month-index="${monthIndex}"]`)
    if (monthElement && calendarRef.current) {
      const monthTop = monthElement.getBoundingClientRect().top
      const calendarTop = calendarRef.current.getBoundingClientRect().top
      calendarRef.current.scrollTop += monthTop - calendarTop
    }
  }, [months, range.start])

  const totals = useMemo(() => {
    const totalsByCategory = new Map(categoryOptions.map(({ label }) => [label, 0]))
    periodExpenses.forEach(expense => {
      totalsByCategory.set(expense.category, (totalsByCategory.get(expense.category) ?? 0) + Number(expense.amount))
    })
    return categoryOptions.map(({ label }) => ({ category: label, amount: totalsByCategory.get(label) ?? 0 }))
  }, [periodExpenses])

  const total = totals.reduce((sum, item) => sum + item.amount, 0)
  const maxAmount = Math.max(...totals.map(item => item.amount), 1)

  const handleDateSelect = date => {
    setPeriodExpenses([])
    if (!range.start || range.end) {
      setPeriodLoading(false)
      setPeriodError('')
      setRange({ start: date, end: '' })
    } else if (date < range.start) {
      setPeriodLoading(true)
      setPeriodError('')
      setRange({ start: date, end: range.start })
    } else {
      setPeriodLoading(true)
      setPeriodError('')
      setRange({ start: range.start, end: date })
    }
  }

  const retryPeriod = () => {
    setPeriodLoading(true)
    setPeriodError('')
    setPeriodRefresh(current => current + 1)
  }

  return (
    <>
      <header className="topbar">
        <div className="logo-wrap">
          <img src="/Vector.svg" alt="Skypro.Wallet" className="brand-logo" />
        </div>

        <nav className="topnav" aria-label="Основная навигация">
          <button type="button" className="nav-link" onClick={onOpenExpenses}>
            Мои расходы
          </button>
          <button type="button" className="nav-link active" aria-current="page">
            Анализ расходов
          </button>
        </nav>

        <button type="button" className="logout-button" onClick={onLogout}>
          Выйти
        </button>
      </header>

      <main className="expenses-shell analysis-shell">
        <h1 className="page-title">Анализ расходов</h1>

        <div className="analysis-layout">
          <section className="period-card">
            <h2>Период</h2>
            <div className="weekdays" aria-hidden="true">
              {['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map(day => <span key={day}>{day}</span>)}
            </div>
            <div className="months-list" ref={calendarRef}>
              {months.map((month, monthIndex) => {
                const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
                const mondayFirstOffset = (month.getDay() + 6) % 7
                const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(month)

                return (
                  <section className="calendar-month" key={toDateKey(month)} data-month-index={monthIndex}>
                    <h3>{monthName}</h3>
                    <div className="calendar-days">
                      {Array.from({ length: mondayFirstOffset }, (_, index) => (
                        <span className="calendar-empty" key={`empty-${index}`} />
                      ))}
                      {Array.from({ length: daysInMonth }, (_, index) => {
                        const date = toDateKey(new Date(month.getFullYear(), month.getMonth(), index + 1))
                        const inRange = range.end && date >= range.start && date <= range.end
                        const isSelected = date === range.start || date === range.end
                        return (
                          <button
                            type="button"
                            className={`calendar-day${inRange ? ' in-range' : ''}${isSelected ? ' selected' : ''}`}
                            key={date}
                            aria-label={new Intl.DateTimeFormat('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }).format(new Date(month.getFullYear(), month.getMonth(), index + 1))}
                            aria-pressed={isSelected}
                            onClick={() => handleDateSelect(date)}
                          >
                            {index + 1}
                          </button>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
            <p className="selected-period">
              {formatLongDate(range.start)} — {range.end ? formatLongDate(range.end) : 'выберите конечную дату'}
            </p>
          </section>

          <section className="analysis-card" aria-label="Расходы по категориям">
            <div className="analysis-summary">
              <strong>{periodLoading ? 'Загружаем…' : formatCurrency(total)}</strong>
              <span>{formatLongDate(range.start)} — {formatLongDate(range.end || range.start)}</span>
            </div>
            {periodError && (
              <div className="period-error" role="alert">
                <p className="form-error">{periodError}</p>
                <button type="button" className="retry-button" onClick={retryPeriod}>Повторить</button>
              </div>
            )}
            <div className="chart" role="img" aria-label={`Расходы по категориям за выбранный период: ${formatCurrency(total)}`}>
              {totals.map((item, index) => (
                <div className="chart-column" key={item.category}>
                  <span className="chart-value">{formatCurrency(item.amount)}</span>
                  <div className="chart-bar-area">
                    <div
                      className={`chart-bar chart-color-${index}`}
                      style={{ height: `${item.amount ? Math.max((item.amount / maxAmount) * 100, 2) : 0}%` }}
                    />
                  </div>
                  <span className="chart-category">{item.category}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default AnalysisPage
