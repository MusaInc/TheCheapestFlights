export function formatMoney(value: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDateShort(dateString?: string | null) {
  if (!dateString) return 'TBD';
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function formatDateLong(dateString?: string | null) {
  if (!dateString) return 'TBD';
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date);
}
