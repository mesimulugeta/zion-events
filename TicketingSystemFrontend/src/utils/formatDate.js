// src/utils/formatDate.js
// Formats dates like:  Nov 03, 2026 • 5:00 PM

export function formatEventDate(value) {
  if (!value) return 'TBA'
  const d = new Date(value)
  if (isNaN(d.getTime())) return 'TBA'

  const date = d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `${date} • ${time}`
}