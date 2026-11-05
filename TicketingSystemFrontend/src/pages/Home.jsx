import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import { formatEventDate } from '../utils/formatDate'
import { getEventImage, categoryFallbackImage } from '../utils/eventImages'
import { formatETB } from '../utils/pricing'
import api from '../api/axios'

const GRADIENT = 'linear-gradient(135deg, #FF686B, #FF9B71)'

const categoryList = [
  { key: 'ALL',      label: '✨ All' },
  { key: 'MUSIC',    label: '🎸 Music' },
  { key: 'SPORTS',   label: '⚽ Sports' },
  { key: 'ART',      label: '🎨 Art' },
  { key: 'BUSINESS', label: '💼 Business' },
  { key: 'FOOD',     label: '🍕 Food' },
  { key: 'THEATRE',  label: '🎭 Theatre' },
]

const statusStyles = {
  ACTIVE:    { background: '#DCFCE7', color: '#166534' },
  CANCELLED: { background: '#FEE2E2', color: '#991B1B' },
  CLOSED:    { background: '#E5E7EB', color: '#374151' },
}

const prettyCategory = (c) => (c ? c.charAt(0) + c.slice(1).toLowerCase() : '')

const btnBase = {
  height: '38px',
  padding: '0 1.15rem',
  border: 'none',
  borderRadius: '999px',
  fontSize: '0.85rem',
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const metaRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.45rem',
  fontSize: '0.82rem',
  color: 'var(--muted-color, #64748B)',
  margin: '0.2rem 0',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
}

function EventCard({ event, role, t, onReserve, onEdit, onCancel }) {
  const [hover, setHover] = useState(false)
  const st = statusStyles[event.status] || statusStyles.CLOSED
  
  const basePrice = Number(event.price || 0)
  const normalPrice = event.normalPrice != null ? Number(event.normalPrice) : basePrice
  const vipPrice = event.vipPrice != null ? Number(event.vipPrice) : basePrice * 1.5
  const vvipPrice = event.vvipPrice != null ? Number(event.vvipPrice) : basePrice * 2
  const isEstimated = event.normalPrice == null

  const seatsLow = event.availableSeats > 0 && event.availableSeats <= 10
  const bookable = event.status === 'ACTIVE'

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--card-bg, #fff)',
        border: '1px solid var(--border-color, #E3E8EF)',
        borderRadius: '16px',
        overflow: 'hidden',
        color: 'var(--text-color, #172033)',
        transform: hover ? 'translateY(-4px)' : 'none',
        boxShadow: hover ? '0 14px 28px rgba(23,32,51,0.16)' : '0 1px 3px rgba(23,32,51,0.06)',
        transition: 'transform 0.2s, box-shadow 0.2s, background 0.3s, border-color 0.3s',
      }}
    >

      <div style={{ position: 'relative', height: '160px', overflow: 'hidden', background: 'var(--card-bg-alt, #EEF2F7)' }}>
        <img
          src={getEventImage(event)}
          alt={event.title}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            transform: hover ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.4s',
          }}
          onError={(e) => {
            e.target.onerror = null
            e.target.src = categoryFallbackImage.OTHER
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(23,26,29,0.55), transparent 55%)',
        }} />
        {event.category && (
          <span style={{
            position: 'absolute', top: '10px', left: '10px',
            background: 'rgba(23,26,29,0.7)', color: '#fff',
            padding: '3px 10px', borderRadius: '999px',
            fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.03em',
          }}>
            {prettyCategory(event.category)}
          </span>
        )}
        <span style={{
          position: 'absolute', top: '10px', right: '10px',
          ...st, padding: '3px 10px', borderRadius: '999px',
          fontSize: '0.7rem', fontWeight: 700,
        }}>
          {event.status}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '0.85rem 1rem 1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h5
          title={event.title}
          style={{
            margin: '0 0 0.3rem', fontSize: '1.05rem', fontWeight: 700,
            color: 'var(--text-color, #172033)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {event.title}
        </h5>

        {event.description && (
          <p style={{
            margin: '0 0 0.5rem', fontSize: '0.82rem', lineHeight: 1.4,
            color: 'var(--muted-color, #64748B)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {event.description}
          </p>
        )}

        <div style={metaRow}><span>📅</span><span>{formatEventDate(event.startAt)}</span></div>
        <div style={metaRow}><span>📍</span><span>{event.venueName || 'TBA'}</span></div>
        <div style={{
          ...metaRow,
          color: seatsLow ? 'var(--accent-dark, #D63C47)' : 'var(--muted-color, #64748B)',
          fontWeight: seatsLow ? 600 : 400,
        }}>
          <span>🪑</span><span>{event.availableSeats} {t('seatsLeft')}</span>
        </div>

        <div style={{
          marginTop: 'auto', paddingTop: '0.8rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem',
        }}>
          {role === 'ADMIN' ? (
            <>
              <button
                onClick={() => onEdit(event.id)}
                style={{ ...btnBase, flex: 1, background: GRADIENT, color: '#fff' }}
              >
                {t('edit')}
              </button>
              <button
                onClick={() => onCancel(event.id)}
                disabled={event.status === 'CANCELLED'}
                style={{
                  ...btnBase, flex: 1,
                  background: 'transparent', color: '#DC3545',
                  border: '1.5px solid #DC3545',
                  cursor: event.status === 'CANCELLED' ? 'not-allowed' : 'pointer',
                  opacity: event.status === 'CANCELLED' ? 0.5 : 1,
                }}
              >
                {t('cancel_event')}
              </button>
            </>
          ) : (
            <>
              <div style={{ lineHeight: 1.2, minWidth: 0 }} title={isEstimated ? 'Estimated starting price' : undefined}>
                <div style={{
                  fontSize: '0.66rem', color: 'var(--muted-color, #64748B)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  From
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-dark, #D63C47)' }}>
                  {formatETB(normalPrice)}
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--muted-color, #64748B)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                  VIP {vipPrice.toLocaleString('en-US')} · VVIP {vvipPrice.toLocaleString('en-US')}
                </div>
              </div>

              {bookable ? (
                <button
                  onClick={() => onReserve(event.id)}
                  style={{
                    ...btnBase, minWidth: '110px',
                    background: GRADIENT, color: '#fff',
                    boxShadow: '0 4px 12px rgba(255,104,107,0.35)',
                  }}
                >
                  {t('reserve')}
                </button>
              ) : (
                <button
                  disabled
                  style={{
                    ...btnBase, minWidth: '110px',
                    background: 'var(--card-bg-alt, #EEF2F7)',
                    color: 'var(--muted-color, #64748B)',
                    cursor: 'not-allowed',
                  }}
                >
                  {event.status}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t, language } = usePreferences()

  const [events, setEvents]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchTerm, setSearchTerm]     = useState('')
  const [guestEvents, setGuestEvents]   = useState([])
  const [guestLoading, setGuestLoading] = useState(false)

  useEffect(() => {
    api.get('/api/events')
      .then(res => { setEvents(res.data); setGuestEvents(res.data) })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (user) return
    setGuestLoading(true)
    const url = selectedCategory === 'ALL'
      ? '/api/events'
      : `/api/events?category=${selectedCategory}`
    api.get(url)
      .then(res => setGuestEvents(res.data))
      .catch(err => console.error(err))
      .finally(() => setGuestLoading(false))
  }, [selectedCategory, user])

  const handleCancel = async (id) => {
    if (!window.confirm(t('confirmDeleteEvent'))) return
    try {
      await api.put(`/api/admin/events/${id}/cancel`)
      setEvents(events.map(e => e.id === id ? { ...e, status: 'CANCELLED' } : e))
      setGuestEvents(guestEvents.map(e => e.id === id ? { ...e, status: 'CANCELLED' } : e))
    } catch {
      alert('Failed to cancel event')
    }
  }

  const filteredGuestEvents = guestEvents.filter(event =>
    searchTerm === '' || event.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const scrollToEvents = () => {
    document.getElementById('featured-events')?.scrollIntoView({ behavior: 'smooth' })
  }

  const sectionHeading = (eyebrow, title, count) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem',
    }}>
      <div>
        <div style={{
          fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--accent-dark, #D63C47)', marginBottom: '0.25rem',
        }}>
          {eyebrow}
        </div>
        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-color, #172033)' }}>
          {title}
        </h2>
        <div style={{ width: '48px', height: '4px', borderRadius: '4px', background: GRADIENT, marginTop: '0.5rem' }} />
      </div>
      {typeof count === 'number' && (
        <span style={{ color: 'var(--muted-color, #64748B)', fontSize: '0.9rem' }}>
          {count} {count === 1 ? 'event' : 'events'}
        </span>
      )}
    </div>
  )

  if (user) {
    return (
      <div style={{
        background: 'var(--bg-color)',
        color: 'var(--text-color)',
        fontFamily: 'Montserrat, sans-serif',
        transition: 'background 0.3s, color 0.3s',
        padding: '2rem 1rem 3rem',
      }}>
        <div className="container">
          {sectionHeading(t('featuredEvents'), t('eventsTitle'), loading ? undefined : events.length)}
          {loading ? (
            <p className="text-center">{t('loadingEvents')}</p>
          ) : events.length === 0 ? (
            <p className="text-center">{t('noEvents')}</p>
          ) : (
            <div className="row g-4">
              {events.map(event => (
                <div key={event.id} className="col-md-6 col-lg-4 col-xl-3">
                  <EventCard
                    event={event}
                    role={user.role}
                    t={t}
                    onReserve={(id) => navigate(`/events/${id}/seats`)}
                    onEdit={(id) => navigate(`/admin/events/${id}/edit`)}
                    onCancel={handleCancel}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const trustItems = [
    { icon: '📍', title: t('trustDiscoverTitle'), text: t('trustDiscoverText') },
    { icon: '🔒', title: t('trustSecureTitle'),   text: t('trustSecureText') },
    { icon: '💺', title: t('trustSeatTitle'),     text: t('trustSeatText') },
  ]

  return (
    <div style={{ background: 'var(--bg-color)', fontFamily: 'Montserrat, sans-serif', transition: 'background 0.3s' }}>
      {/* Hero */}
      <div style={{
        minHeight: '56vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', color: 'white',
        padding: '3rem 1.5rem',
        backgroundImage: `linear-gradient(rgba(23,26,29,0.65), rgba(23,26,29,0.45)), url('https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1600&h=600&fit=crop')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: '680px' }}>
          <h1 style={{
            fontSize: 'clamp(2.4rem, 3vw, 4rem)', 
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            marginBottom: '1.2rem', 
            color: '#ffffff',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)', 
            }}>
            {language === 'ENGLISH' ? (
              <>
                Experience{' '}
                <span style={{ 
                  color: '#FF686B', // Coral color
                  position: 'relative', 
                  display: 'inline-block' 
                }}>
                  Unforgettable
                  <svg 
                    viewBox="0 0 200 15" 
                    style={{ 
                      position: 'absolute', 
                      bottom: '-12px', 
                      left: 0, 
                      width: '100%', 
                      height: '15px' 
                    }}
                  >
                    <path 
                      d="M 5 12 Q 100 2 195 8" 
                      stroke="#FF686B" 
                      strokeWidth="3.5" 
                      fill="none" 
                      strokeLinecap="round" 
                    />
                  </svg>
                </span>
                <br />
                Moments
              </>
              ) : (
              t('heroTitle')
            )}
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.4vw, 1.25rem)', marginBottom: '1.75rem', opacity: 0.9 }}>
            {t('heroSubtitle')}
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); scrollToEvents() }}
            style={{
              display: 'flex', background: '#fff', borderRadius: '999px',
              padding: '6px', boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
            }}
          >
            <input
              type="text"
              placeholder={t('searchInputPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1, padding: '0.7rem 1.1rem', fontSize: '1rem',
                border: 'none', outline: 'none', borderRadius: '999px',
                background: 'transparent', color: '#172033',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0 1.6rem', background: GRADIENT,
                border: 'none', borderRadius: '999px',
                color: 'white', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700,
              }}
            >→</button>
          </form>
        </div>
      </div>

      {/* Category bar */}
      <div style={{
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.7rem 1rem',
        overflowX: 'auto',
        transition: 'background 0.3s',
      }}>
        <div style={{ display: 'flex', gap: '0.6rem', width: 'max-content', margin: '0 auto' }}>
          {categoryList.map(cat => {
            const active = selectedCategory === cat.key
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  background: active ? GRADIENT : 'var(--card-bg-alt, #EEF2F7)',
                  color: active ? '#fff' : 'var(--text-color, #172033)',
                  border: active ? '1px solid transparent' : '1px solid var(--border-color, #E3E8EF)',
                  padding: '0.4rem 1rem', borderRadius: '999px',
                  cursor: 'pointer', fontSize: '0.9rem', fontWeight: active ? 600 : 500,
                  fontFamily: 'inherit',
                  flexShrink: 0, whiteSpace: 'nowrap',
                  boxShadow: active ? '0 4px 12px rgba(255,104,107,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Featured events */}
      <div id="featured-events" style={{ padding: '2.5rem 1rem 2rem' }}>
        <div className="container">
          {sectionHeading(t('featuredSubtitle'), t('featuredEvents'), guestLoading ? undefined : filteredGuestEvents.length)}
          {guestLoading ? (
            <p className="text-center">{t('loadingEvents')}</p>
          ) : filteredGuestEvents.length === 0 ? (
            <p className="text-center">{t('noEvents')}</p>
          ) : (
            <div className="row g-4">
              {filteredGuestEvents.map(event => (
                <div key={event.id} className="col-md-6 col-lg-4 col-xl-3">
                  <EventCard
                    event={event}
                    role={null}
                    t={t}
                    onReserve={() => navigate('/login')}
                    onEdit={() => {}}
                    onCancel={() => {}}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trust section */}
      <div style={{ padding: '1rem 1rem 3.5rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-color)' }}>
              {t('trustTitle')}
            </h3>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
          }}>
            {trustItems.map((item) => (
              <div key={item.title} style={{
                display: 'flex', gap: '0.9rem', alignItems: 'flex-start',
                background: 'var(--card-bg)', border: '1px solid var(--border-color)',
                borderRadius: '16px', padding: '1.1rem 1.2rem',
                transition: 'background 0.3s, border-color 0.3s',
              }}>
                <div style={{
                  width: '44px', height: '44px', flexShrink: 0,
                  borderRadius: '12px', background: 'rgba(255,104,107,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem',
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-color)', marginBottom: '0.2rem' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--muted-color, #64748B)', lineHeight: 1.45 }}>
                    {item.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}