import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { usePreferences } from '../../context/PreferencesContext'
import { SeatTierBadge } from '../../constants/seatTiers'
import { formatEventDate } from '../../utils/formatDate'
import { refNumber, seatLabel } from '../../utils/seatLabel'
import '../../styles/admin.css'

const statusStyles = {
  CONFIRMED: { background: '#DCFCE7', color: '#166534' },
  HOLD:      { background: '#FEF3C7', color: '#92400E' },
  PENDING:   { background: '#FEF3C7', color: '#92400E' },
  CANCELLED: { background: '#FEE2E2', color: '#991B1B' },
  EXPIRED:   { background: '#E5E7EB', color: '#374151' },
}

const thStyle = (sortable, sortBy, sortDir, field) => ({
  padding: '11px 12px',
  textAlign: 'left',
  fontSize: '0.72rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--muted-color)',
  borderBottom: '2px solid var(--border-color)',
  whiteSpace: 'nowrap',
  cursor: sortable ? 'pointer' : 'default',
  userSelect: 'none',
})

const sortIcon = (sortBy, sortDir, field) =>
  sortBy === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

export default function AdminReservations() {
  const navigate = useNavigate()
  const { t } = usePreferences()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(7)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [sortBy, setSortBy] = useState('id')
  const [sortDir, setSortDir] = useState('asc')
  const [sizeInput, setSizeInput] = useState('7')

  const fetchReservations = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/reservations', {
        params: { page, size, sortBy, sortDir },
      })
      const data = res.data
      const content = data.content.map(item => ({
        id: item.reservation.id,
        customerEmail: item.reservation.customerEmail,
        eventTitle: item.event?.title || 'Unknown',
        eventStartAt: item.event?.startAt,
        venueName: item.event?.venueName,
        seats: item.seats || [],
        status: item.reservation.status,
        holdExpiresAt: item.reservation.holdExpiresAt,
      }))
      setReservations(content)
      setTotalPages(data.totalPages)
      setTotalElements(data.totalElements)
    } catch (err) {
      console.error(err)
      setError('Failed to load reservations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [page, size, sortBy, sortDir])

  const showNotice = (type, text) => {
    setNotice({ type, text })
    setTimeout(() => setNotice(null), 4000)
  }

  const handleCancel = async (reservationId) => {
    if (!window.confirm('Cancel this reservation? The seats will be released.')) return
    try {
      await api.put(`/api/admin/reservations/${reservationId}/cancel`)
      showNotice('success', 'Reservation cancelled and seats released.')
      fetchReservations()
    } catch (err) {
      showNotice('error', err.response?.data?.error || 'Failed to cancel reservation.')
    }
  }

  const goToPage = (p) => {
    if (p >= 0 && p < totalPages) setPage(p)
  }

  const handleSortChange = (field) => {
    const dir = sortBy === field && sortDir === 'asc' ? 'desc' : 'asc'
    setSortBy(field)
    setSortDir(dir)
    setPage(0)
  }

  const commitSize = (value) => {
    const parsed = parseInt(value, 10)
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.min(parsed, 500)
      setSize(clamped)
      setSizeInput(String(clamped))
      setPage(0)
    } else {
      setSizeInput(String(size))
    }
  }

  const btnPager = (disabled) => ({
    padding: '7px 16px',
    borderRadius: 999,
    border: 'none',
    fontFamily: 'inherit',
    fontWeight: 600,
    fontSize: '0.83rem',
    color: '#fff',
    background: disabled
      ? 'var(--border-color)'
      : 'linear-gradient(135deg, #FF686B, #FF9B71)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    boxShadow: disabled ? 'none' : '0 4px 12px rgba(255,104,107,0.28)',
  })

  return (
    <div className="ad-page">
      <div className="ad-wrap">
        {notice && (
          <div className={`ad-notice ${notice.type}`} role="status">
            <span>{notice.type === 'success' ? '✓' : '!'}</span>
            <span>{notice.text}</span>
            <button onClick={() => setNotice(null)} aria-label="Dismiss">×</button>
          </div>
        )}

        <div className="ad-card">
          <div className="ad-head">
            <div>
              <h2 className="ad-title">📋 {t('allReservationsAdmin')}</h2>
              <div className="ad-title-bar" />
              <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--muted-color)' }}>
                {totalElements} reservation{totalElements !== 1 ? 's' : ''} · Page{' '}
                {page + 1} of {Math.max(totalPages, 1)}
              </div>
            </div>
            <button className="ad-btn ad-btn-ghost" onClick={() => navigate('/')}>
              ← {t('backToEvents')}
            </button>
          </div>

          {error && (
            <div className="ad-notice error" role="alert">
              <span>!</span><span>{error}</span>
              <button onClick={() => setError('')} aria-label="Dismiss">×</button>
            </div>
          )}

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--muted-color)', padding: '24px 0' }}>
              Loading reservations…
            </p>
          ) : reservations.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--muted-color)', padding: '32px 0' }}>
              No reservations found.
            </p>
          ) : (
            <>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th style={thStyle(true)} onClick={() => handleSortChange('id')}>
                        Ref{sortIcon(sortBy, sortDir, 'id')}
                      </th>
                      <th style={thStyle(true)} onClick={() => handleSortChange('customerEmail')}>
                        {t('customer')}{sortIcon(sortBy, sortDir, 'customerEmail')}
                      </th>
                      <th style={thStyle(false)}>{t('event')}</th>
                      <th style={thStyle(false)}>{t('seats')}</th>
                      <th style={thStyle(true)} onClick={() => handleSortChange('status')}>
                        {t('status')}{sortIcon(sortBy, sortDir, 'status')}
                      </th>
                      <th style={{ ...thStyle(false), textAlign: 'right' }}>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map(res => (
                      <tr key={res.id}>
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>
                          {refNumber(res.id)}
                        </td>
                        <td style={{ minWidth: 180 }}>{res.customerEmail}</td>
                        <td style={{ minWidth: 220 }}>
                          <div style={{ fontWeight: 700, marginBottom: 2 }}>{res.eventTitle}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--muted-color)' }}>
                            {formatEventDate(res.eventStartAt)}
                          </div>
                          {res.venueName && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--muted-color)' }}>
                              📍 {res.venueName}
                            </div>
                          )}
                        </td>
                        <td style={{ minWidth: 200 }}>
                          {res.seats.length === 0 ? (
                            <span style={{ color: 'var(--muted-color)', fontSize: '0.82rem' }}>—</span>
                          ) : (
                            <div style={{ display: 'grid', gap: 5 }}>
                              {res.seats.map(seat => (
                                <div
                                  key={seat.id}
                                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
                                >
                                  <span>🪑 {seatLabel(seat)}</span>
                                  <SeatTierBadge category={seat.category} />
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="ad-badge" style={statusStyles[res.status] || statusStyles.EXPIRED}>
                            {res.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {res.status !== 'CANCELLED' && (
                            <button
                              className="ad-btn ad-btn-danger ad-btn-sm"
                              onClick={() => handleCancel(res.id)}
                            >
                              {t('cancelReservation')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginTop: 18, flexWrap: 'wrap', gap: 12,
              }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: '0.85rem', color: 'var(--muted-color)',
                }}>
                  Rows per page:
                  <input
                    type="text"
                    inputMode="numeric"
                    value={sizeInput}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '' || /^\d+$/.test(v)) setSizeInput(v)
                    }}
                    onBlur={() => commitSize(sizeInput)}
                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                    style={{
                      width: 64, height: 34,
                      padding: '0 10px', borderRadius: 10,
                      border: '1.5px solid var(--border-color)',
                      background: 'var(--input-bg)', color: 'var(--text-color)',
                      fontFamily: 'inherit', fontSize: '0.85rem', textAlign: 'center',
                    }}
                  />
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    style={btnPager(page === 0)}
                    disabled={page === 0}
                    onClick={() => goToPage(page - 1)}
                  >
                    ← Previous
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted-color)', padding: '0 6px' }}>
                    {page + 1} / {Math.max(totalPages, 1)}
                  </span>
                  <button
                    style={btnPager(page >= totalPages - 1)}
                    disabled={page >= totalPages - 1}
                    onClick={() => goToPage(page + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}