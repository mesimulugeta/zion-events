import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { formatEventDate } from '../../utils/formatDate'
import { getEventImage, categoryFallbackImage } from '../../utils/eventImages'
import { formatETB } from '../../utils/pricing'
import '../../styles/admin.css'

const statusStyles = {
  ACTIVE:    { background: '#DCFCE7', color: '#166534' },
  CANCELLED: { background: '#FEE2E2', color: '#991B1B' },
  CLOSED:    { background: '#E5E7EB', color: '#374151' },
}

export default function AdminEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    api.get('/api/admin/events')
      .then(res => setEvents(res.data))
      .catch(() => setNotice({ type: 'error', text: 'Could not load events.' }))
      .finally(() => setLoading(false))
  }, [])

  const showNotice = (type, text) => {
    setNotice({ type, text })
    setTimeout(() => setNotice(null), 4000)
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this event? New bookings will be disabled.')) return
    try {
      await api.put(`/api/admin/events/${id}/cancel`)
      setEvents(events.map(e => (e.id === id ? { ...e, status: 'CANCELLED' } : e)))
      showNotice('success', 'Event cancelled successfully.')
    } catch {
      showNotice('error', 'Failed to cancel the event.')
    }
  }

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
              <h2 className="ad-title">All Events</h2>
              <div className="ad-title-bar" />
            </div>
            <button className="ad-btn ad-btn-primary" onClick={() => navigate('/admin/events/new')}>
              + Create Event
            </button>
          </div>

          {loading && <p style={{ textAlign: 'center', color: 'var(--muted-color)' }}>Loading…</p>}
          {!loading && events.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--muted-color)' }}>No events found.</p>
          )}

          {!loading && events.length > 0 && (
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Event</th>
                    <th>Starts</th>
                    <th>Price</th>
                    <th>Seats</th>
                    <th>Status</th>
                    <th className="end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr key={event.id}>
                      <td>{event.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }}>
                          <img
                            className="ad-thumb"
                            src={getEventImage(event)}
                            alt=""
                            onError={(e) => { e.target.onerror = null; e.target.src = categoryFallbackImage.OTHER }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700 }}>{event.title}</div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--muted-color)' }}>
                              {event.venueName || 'TBA'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatEventDate(event.startAt)}</td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>
                        {event.price ? formatETB(event.price) : '—'}
                      </td>
                      <td>{event.availableSeats}</td>
                      <td>
                        <span className="ad-badge" style={statusStyles[event.status] || statusStyles.CLOSED}>
                          {event.status}
                        </span>
                      </td>
                      <td className="end">
                        <button
                          onClick={() => navigate(`/admin/events/${event.id}/edit`)}
                          className="ad-btn ad-btn-ghost ad-btn-sm"
                          style={{ marginRight: 6 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleCancel(event.id)}
                          className="ad-btn ad-btn-danger ad-btn-sm"
                          disabled={event.status === 'CANCELLED'}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}