// src/utils/seatLabel.js
export const refNumber = (id) => `ZE-${String(id).padStart(6, '0')}`

export const seatLabel = (s) => {
  const row = s.rowNumber ?? s.row
  const num = s.seatNumber ?? s.number
  const parts = []
  if (s.section) parts.push(`Section ${s.section}`)
  if (row !== undefined && row !== null) parts.push(`Row ${row}`)
  if (num !== undefined && num !== null) parts.push(`Seat ${num}`)
  return parts.length ? parts.join(' · ') : `Seat ${s.id}`
}

// Short form used on seat cards, e.g. A1-2
export const seatCode = (s) => {
  const row = s.rowNumber ?? s.row
  const num = s.seatNumber ?? s.number
  return `${s.section ?? ''}${row ?? ''}${num !== undefined && num !== null ? `-${num}` : ''}`
}