import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreferences } from '../context/PreferencesContext'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Search() {
  const navigate = useNavigate()
  const { t } = usePreferences()
  const { user } = useAuth()
  const [keyword, setKeyword] = useState('')
  const [events, setEvents] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.get(`/api/events/search?keyword=${encodeURIComponent(keyword)}`)
      setEvents(res.data)
      setSearched(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const statusBadge = (status) => {
    const styles = {
      ACTIVE:    { background: '#d4edda', color: '#155724' },
      CANCELLED: { background: '#f8d7da', color: '#721c24' },
      CLOSED:    { background: '#e2e3e5', color: '#383d41' },
    }
    return (
      <span style={{
        ...(styles[status] || styles.CLOSED),
        padding: '3px 10px', borderRadius: '20px',
        fontSize: '0.75rem', fontWeight: 600, display: 'inline-block',
      }}>
        {status}
      </span>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-color)',
      color: 'var(--text-color)',
      fontFamily: 'Montserrat, sans-serif',
      transition: 'background 0.3s, color 0.3s',
      padding: '20px 16px 40px',
    }}>
      <div style={{
        background: 'var(--card-bg)', borderRadius: '12px',
        padding: '30px', margin: '20px auto', maxWidth: '850px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid var(--border-color)',
        transition: 'background 0.3s, border-color 0.3s',
      }}>
        <h4 style={{ color: '#0097a7', marginBottom: '20px' }}>
           {t('searchInputPlaceholder')}
        </h4>

        <form onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block', marginBottom: '6px', fontWeight: 500,
            color: 'var(--text-color)', fontSize: '14px',
          }}>
            {t('title')}
          </label>
          <input
            type="text"
            placeholder={t('searchInputPlaceholder')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            required
            style={{
              width: '100%', padding: '10px 14px',
              borderRadius: '10px', marginBottom: '12px',
              border: '1.5px solid var(--border-color)',
              background: 'var(--input-bg)', color: 'var(--text-color)',
              fontSize: '14px', outline: 'none',
              transition: 'background 0.3s, color 0.3s, border-color 0.3s',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <button type="submit" disabled={loading} style={{
              background: 'linear-gradient(135deg, #00acc1, #007c8a)',
              color: 'white', border: 'none', borderRadius: '20px',
              padding: '8px 24px', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? t('loading') : '🔍 Search'}
            </button>
            <button type="button" onClick={() => navigate('/')} style={{
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)', background: 'transparent',
              borderRadius: '20px', padding: '8px 24px', cursor: 'pointer',
            }}>
              ← {t('backToEvents')}
            </button>
          </div>
        </form>

        {searched && (
          <>
            <h5 style={{ color: 'var(--text-color)', opacity: 0.7, marginBottom: '12px' }}>
              Results
            </h5>
            {events.length === 0 && (
              <p style={{ color: '#d9534f', fontWeight: 600 }}>
                 {t('noEvents')} "{keyword}"
              </p>
            )}
            {events.map((event, index) => (
              <div key={event.id} style={{
                borderBottom: index < events.length - 1
                  ? '1px solid var(--border-color)' : 'none',
                padding: '20px 0',
                transition: 'border-color 0.3s',
              }}>
                <h5 style={{ fontWeight: 700, color: 'var(--text-color)' }}>
                  {event.title}
                </h5>
                <p style={{ color: 'var(--text-color)', opacity: 0.7, marginBottom: '8px' }}>
                  <strong>{t('eventDate')}:</strong> {new Date(event.startAt).toLocaleString()}<br />
                  <strong>{t('seatsLeft')}:</strong> {event.availableSeats}<br />
                </p>
                <div style={{ marginBottom: '10px' }}>{statusBadge(event.status)}</div>
                {event.status === 'ACTIVE' && (
                  <button
                    onClick={() => user
                      ? navigate(`/events/${event.id}/seats`)
                      : navigate('/login')
                    }
                    style={{
                      background: 'linear-gradient(135deg, #00acc1, #007c8a)',
                      color: 'white', border: 'none', borderRadius: '20px',
                      padding: '6px 18px', cursor: 'pointer',
                    }}
                  >
                    {t('reserve')}
                  </button>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}