import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import api from '../api/axios'
import { usePreferences } from '../context/PreferencesContext'
import { getTierInfo, SeatTierBadge } from '../constants/seatTiers'
import { formatEventDate } from '../utils/formatDate'
import { getEventImage, categoryFallbackImage } from '../utils/eventImages'

const GRADIENT = 'linear-gradient(135deg, #FF686B, #FF9B71)'

const STATUS_META = {
  CONFIRMED: { label: 'Confirmed', bg: '#DCFCE7', color: '#166534', dot: '#16A34A' },
  PENDING:   { label: 'Pending',   bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  EXPIRED:   { label: 'Expired',   bg: '#E5E7EB', color: '#374151', dot: '#6B7280' },
  CANCELLED: { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B', dot: '#DC3545' },
}

const FILTERS = [
  ['ALL', 'All'], ['CONFIRMED', 'Confirmed'], ['PENDING', 'Pending'],
  ['EXPIRED', 'Expired'], ['CANCELLED', 'Cancelled'],
]

function deriveStatus(res, now) {
  const expires = res.holdExpiresAt ? new Date(res.holdExpiresAt).getTime() : null
  const expired = expires !== null && !isNaN(expires) && expires < now
  if (res.status === 'CONFIRMED') return 'CONFIRMED'
  if (res.status === 'HOLD') return expired ? 'EXPIRED' : 'PENDING'
  if (res.status === 'CANCELLED') {
    if (res.userCancelled) return 'CANCELLED'
    return res.paymentStatus !== 'PAID' && expired ? 'EXPIRED' : 'CANCELLED'
  }
  return 'CANCELLED'
}

function paymentMeta(res, state) {
  if (res.paymentStatus === 'PAID') return { label: 'Paid', bg: '#DCFCE7', color: '#166534' }
  if (res.paymentStatus === 'FAILED') return { label: 'Failed', bg: '#FEE2E2', color: '#991B1B' }
  if (state === 'EXPIRED' || state === 'CANCELLED') return { label: 'Not paid', bg: '#E5E7EB', color: '#374151' }
  return { label: 'Awaiting payment', bg: '#FEF3C7', color: '#92400E' }
}

const refNumber = (id) => `ZE-${String(id).padStart(6, '0')}`

const seatLabel = (s) => {
  const row = s.rowNumber ?? s.row
  const num = s.seatNumber ?? s.number
  const parts = []
  if (s.section) parts.push(`Section ${s.section}`)
  if (row !== undefined && row !== null) parts.push(`Row ${row}`)
  if (num !== undefined && num !== null) parts.push(`Seat ${num}`)
  return parts.length ? parts.join(' · ') : `Seat ${s.id}`
}

const countdown = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = String(Math.floor(total / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
}

function Pill({ bg, color, children, dot }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: bg, color, padding: '3px 11px', borderRadius: '999px',
      fontSize: '0.74rem', fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: dot }} />}
      {children}
    </span>
  )
}

export default function MyReservations() {
  const navigate = useNavigate()
  const { t } = usePreferences()

  const [data, setData] = useState(null)
  const [eventsById, setEventsById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [now, setNow] = useState(Date.now())
  const [ticket, setTicket] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/api/reservations/my'),
      api.get('/api/events').catch(() => ({ data: [] })),
    ])
      .then(([r, e]) => {
        setData(r.data)
        const map = {}
        ;(Array.isArray(e.data) ? e.data : []).forEach(ev => { map[ev.id] = ev })
        setEventsById(map)
      })
      .catch(() => setError('Could not load your reservations. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const hasHold = !!data?.reservations?.some(r => r.status === 'HOLD')
  useEffect(() => {
    if (!hasHold) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [hasHold])

  const showNotice = (type, text) => {
    setNotice({ type, text })
    setTimeout(() => setNotice(null), 4000)
  }

  const handleCancel = async (reservationId) => {
    if (!window.confirm('Cancel this reservation?')) return
    try {
      await api.post('/api/reservations/cancel', { reservationId })
      setData(prev => ({
        ...prev,
        reservations: prev.reservations.map(r =>
          r.id === reservationId ? { ...r, status: 'CANCELLED', userCancelled: true } : r
        ),
      }))
      showNotice('success', 'Reservation cancelled.')
    } catch (err) {
      showNotice('error', err.response?.data?.error || 'Failed to cancel the reservation.')
    }
  }

  const rows = (data?.reservations || []).map(res => {
    const baseEvent = data.reservationEvents?.[res.id] || {}
    const extra = eventsById[baseEvent.id] || {}
    return {
      res,
      state: deriveStatus(res, now),
      event: { ...baseEvent, imageUrl: extra.imageUrl, category: extra.category },
      seats: data.reservationSeats?.[res.id] || [],
    }
  })

  const counts = rows.reduce((acc, r) => { acc[r.state] = (acc[r.state] || 0) + 1; return acc }, {})
  const visible = filter === 'ALL' ? rows : rows.filter(r => r.state === filter)

  const card = {
    background: 'var(--card-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    color: 'var(--text-color)',
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-color)', color: 'var(--text-color)', minHeight: '60vh' }}>
        <p style={{ padding: '40px', textAlign: 'center' }}>{t('loadingEvents')}</p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-color)', color: 'var(--text-color)',
      fontFamily: 'Montserrat, sans-serif', padding: '24px 16px 48px',
      transition: 'background 0.3s, color 0.3s',
    }}>
      <style>{`
        .res-card { display: grid; grid-template-columns: 150px 1fr; gap: 18px; padding: 16px; }
        .res-thumb { width: 150px; height: 150px; border-radius: 12px; object-fit: cover; }
        @media (max-width: 640px) {
          .res-card { grid-template-columns: 1fr; }
          .res-thumb { width: 100%; height: 170px; }
        }
        @media print {
          body * { visibility: hidden !important; }
          #ticket-print, #ticket-print * { visibility: visible !important; }
          #ticket-print { position: fixed !important; left: 50%; top: 24px; transform: translateX(-50%); box-shadow: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>{t('myReservationsTitle')}</h2>
          <div style={{ width: '48px', height: '4px', borderRadius: '4px', background: GRADIENT, marginTop: '0.5rem' }} />
        </div>

        {notice && (
          <div style={{
            marginBottom: '1rem', padding: '0.65rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600,
            background: notice.type === 'success' ? 'rgba(22,163,74,0.12)' : 'rgba(220,53,69,0.12)',
            color: notice.type === 'success' ? '#166534' : '#B42318',
            border: `1px solid ${notice.type === 'success' ? 'rgba(22,163,74,0.35)' : 'rgba(220,53,69,0.35)'}`,
          }}>
            {notice.type === 'success' ? '✓ ' : '! '}{notice.text}
          </div>
        )}

        {error && (
          <div style={{ ...card, padding: '20px', textAlign: 'center', color: '#B42318' }}>{error}</div>
        )}

        {!error && rows.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
            {FILTERS.map(([key, label]) => {
              const active = filter === key
              const count = key === 'ALL' ? rows.length : (counts[key] || 0)
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  style={{
                    background: active ? GRADIENT : 'var(--card-bg)',
                    color: active ? '#fff' : 'var(--text-color)',
                    border: active ? '1px solid transparent' : '1px solid var(--border-color)',
                    borderRadius: '999px', padding: '0.3rem 0.9rem',
                    fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  {label} <span style={{ opacity: 0.75 }}>({count})</span>
                </button>
              )
            })}
          </div>
        )}

        {!error && rows.length === 0 && (
          <div style={{ ...card, padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🎟️</div>
            <div style={{ marginBottom: '1rem' }}>{t('noReservations')}</div>
            <button
              onClick={() => navigate('/')}
              style={{
                background: GRADIENT, color: '#fff', border: 'none', borderRadius: '999px',
                padding: '0.55rem 1.4rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              Browse events
            </button>
          </div>
        )}

        {!error && rows.length > 0 && visible.length === 0 && (
          <div style={{ ...card, padding: '24px', textAlign: 'center', color: 'var(--muted-color)' }}>
            No {STATUS_META[filter]?.label.toLowerCase()} reservations.
          </div>
        )}

        {visible.map(({ res, state, event, seats }) => {
          const sm = STATUS_META[state]
          const pm = paymentMeta(res, state)
          const tiersPresent = [...new Set(seats.map(s => s.category || 'NORMAL'))]
          const msLeft = new Date(res.holdExpiresAt).getTime() - now

          return (
            <div key={res.id} className="res-card" style={{ ...card, marginBottom: '16px', boxShadow: '0 2px 8px rgba(23,32,51,0.06)' }}>
              <img
                className="res-thumb"
                src={getEventImage(event)}
                alt={event.title || 'Event'}
                onError={(e) => { e.target.onerror = null; e.target.src = categoryFallbackImage.OTHER }}
                style={{ opacity: state === 'EXPIRED' || state === 'CANCELLED' ? 0.55 : 1 }}
              />

              <div style={{ minWidth: 0 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
                      color: 'var(--accent-dark)',
                    }}>
                      REF {refNumber(res.id)}
                    </div>
                    <h5 style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 800 }}>
                      {event.title || '—'}
                    </h5>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <Pill bg={sm.bg} color={sm.color} dot={sm.dot}>{sm.label}</Pill>
                    <Pill bg={pm.bg} color={pm.color}>{pm.label}</Pill>
                  </div>
                </div>

                {/* Details */}
                <div style={{ margin: '10px 0', fontSize: '0.88rem', color: 'var(--muted-color)', display: 'grid', gap: '4px' }}>
                  <div>📅 {formatEventDate(event.startAt)}</div>
                  <div>📍 {event.venueName || 'TBA'}</div>
                  {res.amount !== undefined && res.amount !== null && (
                    <div>💳 Total: <strong style={{ color: 'var(--text-color)' }}>ETB {Number(res.amount).toLocaleString('en-US')}</strong></div>
                  )}
                  {state === 'PENDING' && (
                    <div style={{ color: '#B45309', fontWeight: 600 }}>
                      ⏰ Seats held for {countdown(msLeft)}
                    </div>
                  )}
                </div>

                {/* Seats */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  {seats.length === 0 && state !== 'CONFIRMED' && state !== 'PENDING' && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted-color)' }}>Seats were released.</span>
                  )}
                  {seats.map(seat => (
                    <span key={seat.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      background: 'var(--card-bg-alt)', border: '1px solid var(--border-color)',
                      borderRadius: '10px', padding: '4px 10px', fontSize: '0.8rem',
                    }}>
                      🪑 {seatLabel(seat)}
                      <SeatTierBadge category={seat.category} />
                    </span>
                  ))}
                </div>

                {/* Perks (collapsed) */}
                {tiersPresent.length > 0 && seats.length > 0 && (
                  <details style={{ marginBottom: '10px' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted-color)' }}>
                      What you get
                    </summary>
                    {tiersPresent.map(tierKey => {
                      const tier = getTierInfo(tierKey)
                      return (
                        <div key={tierKey} style={{ marginTop: '8px' }}>
                          <div style={{ fontWeight: 700, color: tier.color, fontSize: '0.83rem' }}>
                            {tier.icon} {tier.label}
                          </div>
                          <ul style={{ margin: '2px 0 0', paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--muted-color)' }}>
                            {tier.perks.map((perk, i) => <li key={i}>{perk}</li>)}
                          </ul>
                        </div>
                      )
                    })}
                  </details>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {state === 'CONFIRMED' && (
                    <button
                      onClick={() => setTicket({ res, event, seats })}
                      style={{
                        background: GRADIENT, color: '#fff', border: 'none', borderRadius: '999px',
                        height: '36px', padding: '0 1.2rem', fontWeight: 600, fontSize: '0.85rem',
                        fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,104,107,0.3)',
                      }}
                    >
                      🎫 Ticket &amp; QR
                    </button>
                  )}
                  {state === 'PENDING' && (
                    <button
                      onClick={() => handleCancel(res.id)}
                      style={{
                        background: 'transparent', color: '#DC3545', border: '1.5px solid #DC3545',
                        borderRadius: '999px', height: '36px', padding: '0 1.2rem', fontWeight: 600,
                        fontSize: '0.85rem', fontFamily: 'inherit', cursor: 'pointer',
                      }}
                    >
                      {t('cancelReservation')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent', color: 'var(--text-color)',
              border: '1.5px solid var(--border-color)', borderRadius: '999px',
              padding: '0.5rem 1.4rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            ← {t('backToEvents')}
          </button>
        </div>
      </div>

      {/* Ticket modal */}
      {ticket && (
        <div
          onClick={() => setTicket(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,18,21,0.7)', zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto',
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px' }}>
            <div id="ticket-print" style={{
              background: '#fff', color: '#172033', borderRadius: '20px', overflow: 'hidden',
              width: '100%', maxWidth: '400px', boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
              fontFamily: 'Montserrat, sans-serif',
            }}>
              <div style={{ background: GRADIENT, color: '#fff', padding: '16px 20px' }}>
                <div style={{ fontFamily: 'Pacifico, cursive', fontSize: '1.2rem' }}>Zion Events</div>
                <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', opacity: 0.9 }}>ADMIT ENTRY</div>
              </div>

              <div style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>{ticket.event.title}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6 }}>
                  📅 {formatEventDate(ticket.event.startAt)}<br />
                  📍 {ticket.event.venueName || 'TBA'}
                </div>

                <div style={{ margin: '14px 0', display: 'grid', gap: '6px' }}>
                  {ticket.seats.map(s => (
                    <div key={s.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: '#F5F7FA', borderRadius: '10px', padding: '6px 10px', fontSize: '0.82rem',
                    }}>
                      <span>{seatLabel(s)}</span>
                      <SeatTierBadge category={s.category} />
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '2px dashed #E3E8EF', margin: '16px -20px 0', padding: '16px 20px 4px', textAlign: 'center' }}>
                  <QRCodeSVG
                    value={`ZION|${refNumber(ticket.res.id)}|EVT:${ticket.event.id}|SEATS:${ticket.seats.map(s => s.id).join(',')}`}
                    size={150}
                    level="M"
                  />
                  <div style={{ marginTop: '8px', fontWeight: 800, letterSpacing: '0.1em', fontSize: '0.85rem' }}>
                    {refNumber(ticket.res.id)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                    Show this QR code at the entrance
                  </div>
                </div>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'center' }}>
              <button
                onClick={() => window.print()}
                style={{
                  background: GRADIENT, color: '#fff', border: 'none', borderRadius: '999px',
                  height: '38px', padding: '0 1.4rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                ⬇ Download / Print
              </button>
              <button
                onClick={() => setTicket(null)}
                style={{
                  background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: '999px', height: '38px', padding: '0 1.4rem', fontWeight: 600,
                  fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

