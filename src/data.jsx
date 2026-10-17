export const categoryOptions = [
  { label: 'Еда', apiValue: 'food', icon: <><path className="chip-filled" d="M3 6h10l-1 7H4L3 6Z" /><path d="M2.5 5h11M5 3.5 8 5l3-1.5M6 8v3m4-3v3" /></> },
  { label: 'Транспорт', apiValue: 'transport', icon: <><path d="M3 3.5h10v8H3zM4.5 11.5v1.5m7-1.5v1.5M4 6h8M5 9.5h.5m5 0h.5" /><path d="M4 3.5 5 2h6l1 1.5" /></> },
  { label: 'Жилье', apiValue: 'housing', icon: <><path d="M3 13V4h10v9M2 13h12M5 6h1m4 0h1M5 8.5h1m4 0h1M7 13v-2h2v2" /><path d="m6 4 2-2 2 2" /></> },
  { label: 'Развлечения', apiValue: 'joy', icon: <><rect x="4" y="2" width="8" height="12" rx="1.5" /><path d="M6 4h4m-4 7h4m-2 1.5h.01" /></> },
  { label: 'Образование', apiValue: 'education', icon: <><path className="chip-filled" d="m1.5 6 6.5-3 6.5 3-6.5 3-6.5-3Z" /><path d="M4 7.2v3.2c2.5 1.8 5.5 1.8 8 0V7.2M14.5 6v4" /></> },
  { label: 'Другое', apiValue: 'others', icon: <><rect x="2.5" y="2.5" width="11" height="11" rx="2" /><path d="M5 6h6M5 8.5h4" /></> },
]

export const categoryByApiValue = Object.fromEntries(
  categoryOptions.map(({ label, apiValue }) => [apiValue, label]),
)

export const categoryByLabel = Object.fromEntries(
  categoryOptions.map(({ label, apiValue }) => [label, apiValue]),
)

export const mapTransaction = transaction => {
  const id = transaction?._id ?? transaction?.id
  const date = typeof transaction?.date === 'string' ? transaction.date.slice(0, 10) : ''
  const amount = Number(transaction?.sum)
  const category = categoryByApiValue[transaction?.category]

  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    typeof transaction.description !== 'string' ||
    !category ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(`${date}T00:00:00.000Z`)) ||
    !Number.isFinite(amount)
  ) {
    throw new Error('Сервер вернул транзакцию в неверном формате')
  }

  return {
    id: String(id),
    description: transaction.description,
    category,
    date,
    amount,
  }
}

export const formatCurrency = amount =>
  `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(amount)} ₽`

export const formatDate = date => {
  const [year, month, day] = date.split('-')
  return `${day}.${month}.${year}`
}
