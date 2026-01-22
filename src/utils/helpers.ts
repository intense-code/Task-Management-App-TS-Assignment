export const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export const fromLocalInput = (value: string) => {
  if (!value) return new Date()
  const [datePart, timePart] = value.split("T")
  if (!datePart || !timePart) return new Date(value)
  const [year, month, day] = datePart.split("-").map(Number)
  const [hour, minute] = timePart.split(":").map(Number)
  return new Date(year, month - 1, day, hour, minute)
}
