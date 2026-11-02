export function baht(n: number) {
  return Math.abs(n).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function signedBaht(n: number) {
  if (n === 0) return '฿0'
  return `${n > 0 ? '+' : '−'}฿${baht(n)}`
}

export function dateTH(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function todayBangkok() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
}
