import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePreferences } from '../context/PreferencesContext'
import api from '../api/axios'
import { getTierInfo } from '../constants/seatTiers'
import { formatEventDate } from '../utils/formatDate'
import { seatCode, seatLabel } from '../utils/seatLabel'

const GRADIENT = 'linear-gradient(135deg, #FF686B, #FF9B71)'
const TIER_ORDER = ['VVIP', 'VIP', 'NORMAL']

const isReserved = (s) =>
  s.reserved === true ||
  s.available === false ||
  s.isAvailable === false ||
  ['RESERVED', 'BOOKED', 'HOLD', 'HELD', 'CONFIRMED', 'SOLD', 'TAKEN']
    .includes(String(s.status || '').toUpperCase())

const money = (n) => `ETB ${Number(n || 0).toLocaleString('en-US')}`

export default function Seats() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = usePreferences()
  const [event, setEvent] = useState(null)
  const [seats, setSeats] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [expandedTier, setExpandedTier] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get(`/api/events/${id}`),
      api.get(`/api/events/${id}/seats`),
    ])
      .then(([eventRes, seatsRes]) => {
        setEvent(eventRes.data)
        setSeats(seatsRes.data)
      })
      .catch(err => {
        console.error(err)
        setLoadError('Could not load the seats for this event. Please try again.')
      })
      .finally(() => setLoading(false))
  }, [id])

  const toggleSeat = (seat) => {
    if (isReserved(seat)) return
    setError('')
    setSelected(prev =>
      prev.includes(seat.id) ? prev.filter(s => s !== seat.id) : [...prev, seat.id]
    )
  }

  const getSeatPrice = (seat, currentEvent) => {
    const rawPrice = Number(seat.price)
    if (rawPrice > 0) return rawPrice
    
    if (currentEvent) {
      if (seat.category === 'VVIP' && currentEvent.vvipPrice) return Number(currentEvent.vvipPrice)
      if (seat.category === 'VIP' && currentEvent.vipPrice) return Number(currentEvent.vipPrice)
      if (currentEvent.normalPrice) return Number(currentEvent.normalPrice)
      
      if (currentEvent.price) {
        const info = getTierInfo(seat.category || 'NORMAL')
        return Number(currentEvent.price) * info.multiplier
      }
    }
    return 0
  }

  const selectedSeatObjects = seats.filter(s => selected.includes(s.id))
  const estimatedTotal = selectedSeatObjects.reduce((sum, s) => sum + getSeatPrice(s, event), 0)

  const seatsByTier = TIER_ORDER.reduce((acc, tier) => {
    acc[tier] = seats.filter(s => (s.category || 'NORMAL') === tier)
    return acc
  }, {})

  const handlePreview = (e) => {
    e.preventDefault()
    if (selected.length === 0) {
      setError('Please select at least one seat to continue.')
      return
    }
    
    const enrichedSeatDetails = selectedSeatObjects.map(s => ({
      ...s,
      price: getSeatPrice(s, event)
    }))

    navigate('/reservations/preview', {
      state: {
        eventId: id,
        seatIds: selected,
        event,
        seatDetails: enrichedSeatDetails,
      },
    })
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-color)', color: 'var(--text-color)', minHeight: '50vh' }}>
        <p style={{ padding: '40px', textAlign: 'center' }}>{t('loadingEvents')}</p>
      </div>
    )
  }

  const visibleTiers = TIER_ORDER.filter(tier => seatsByTier[tier].length > 0)

  return (
    <div className="st-page">
      <style>{`
        .st-page {
          background: var(--bg-color); color: var(--text-color);
          font-family: 'Montserrat', sans-serif; padding: 24px 16px 40px;
          transition: background 0.3s, color 0.3s;
        }
        .st-wrap { max-width: 1000px; margin: 0 auto; }
        .st-card {
          background: var(--card-bg); border: 1px solid var(--border-color);
          border-radius: 18px; padding: 18px 20px; margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(23,32,51,0.05);
        }
        .st-tier-btn {
          display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
          padding: 6px 14px; border-radius: 999px; font-family: inherit; font-size: 0.82rem;
          background: var(--card-bg-alt); color: var(--text-color);
          border: 1.5px solid var(--tier); transition: background 0.2s;
        }
        .st-tier-btn.open { background: var(--tier-bg); color: var(--tier); }
        .st-legend { display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.8rem; color: var(--muted-color); }
        .st-legend span { display: inline-flex; align-items: center; gap: 6px; }
        .st-swatch { width: 16px; height: 16px; border-radius: 5px; display: inline-block; }
        .st-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 10px; }

        .st-seat {
          position: relative; padding: 7px 4px 8px; text-align: center; cursor: pointer;
          font-family: inherit; color: var(--text-color); background: var(--card-bg);
          border: 1.5px solid var(--border-color); border-top: 4px solid var(--tier);
          border-radius: 12px; transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
        }
        .st-seat:hover:not(:disabled) {
          transform: translateY(-2px); border-color: var(--tier);
          box-shadow: 0 6px 14px rgba(23,32,51,0.12);
        }
        .st-seat .code { font-weight: 800; font-size: 0.95rem; }
        .st-seat .sub { font-size: 0.66rem; opacity: 0.7; }
        .st-seat .price { font-size: 0.72rem; font-weight: 700; margin-top: 3px; }

        .st-seat.selected {
          background: var(--tier-gradient); color: #fff; border-color: transparent;
          box-shadow: 0 8px 18px rgba(23,32,51,0.25); transform: translateY(-2px);
        }
        .st-seat.selected::after {
          content: '✓'; position: absolute; top: 5px; right: 6px; width: 16px; height: 16px;
          border-radius: 50%; background: #fff; color: #172033; font-size: 10px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
        }
        .st-seat.reserved {
          cursor: not-allowed; color: var(--muted-color); border-top-color: var(--border-color);
          background: repeating-linear-gradient(45deg, var(--card-bg-alt), var(--card-bg-alt) 6px, var(--border-color) 6px, var(--border-color) 7px);
          opacity: 0.75;
        }
        .st-seat.reserved .code { text-decoration: line-through; }

        .st-bar {
          position: sticky; bottom: 12px; z-index: 50;
          background: var(--card-bg); border: 1px solid var(--border-color);
          border-radius: 18px; padding: 12px 16px;
          box-shadow: 0 12px 32px rgba(23,32,51,0.22);
        }
        .st-bar-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
        .st-chip {
          display: inline-flex; align-items: center; gap: 6px; padding: 3px 4px 3px 10px;
          border-radius: 999px; font-size: 0.75rem; font-weight: 700;
          background: var(--card-bg-alt); border: 1px solid var(--border-color);
        }
        .st-chip button {
          background: none; border: none; cursor: pointer; color: var(--muted-color);
          font-size: 14px; line-height: 1; padding: 0 5px;
        }
        .st-error {
          background: rgba(220,53,69,0.12); color: #B42318; border: 1px solid rgba(220,53,69,0.35);
          border-radius: 10px; padding: 8px 12px; font-size: 0.85rem; font-weight: 600; margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .st-continue {
          height: 42px; padding: 0 1.6rem; border: none; border-radius: 999px; cursor: pointer;
          font-family: inherit; font-weight: 700; font-size: 0.9rem; color: #fff; background: ${GRADIENT};
          box-shadow: 0 6px 16px rgba(255,104,107,0.3); transition: filter 0.2s, opacity 0.2s;
        }
        .st-continue:hover { filter: brightness(1.06); }
        .st-continue.idle { opacity: 0.55; }
        .st-ghost {
          height: 38px; padding: 0 1.2rem; border-radius: 999px; cursor: pointer; font-family: inherit;
          font-weight: 600; font-size: 0.85rem; background: transparent; color: var(--text-color);
          border: 1.5px solid var(--border-color);
        }
        .st-ghost:hover { background: var(--card-bg-alt); }
        @media (max-width: 560px) {
          .st-grid { grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); }
          .st-continue { width: 100%; }
        }
      `}</style>

      <div className="st-wrap">
        {/* Heading */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 800 }}>Select your seats</h2>
            <div style={{ width: 48, height: 4, borderRadius: 4, background: GRADIENT, marginTop: 8 }} />
          </div>
          <button type="button" className="st-ghost" onClick={() => navigate('/')}>
            ← {t('backToEvents')}
          </button>
        </div>

        {loadError && (
          <div className="st-error" role="alert">! {loadError}</div>
        )}

        {/* Compact event summary */}
        {event && (
          <div className="st-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 26px', alignItems: 'center', borderLeft: '5px solid #FF686B' }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', flexBasis: '100%' }}>{event.title}</div>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted-color)' }}>📅 {formatEventDate(event.startAt)}</span>
            {event.venueName && (
              <span style={{ fontSize: '0.85rem', color: 'var(--muted-color)' }}>📍 {event.venueName}</span>
            )}
            <span style={{ fontSize: '0.85rem', color: 'var(--muted-color)' }}>
              🪑 <strong style={{ color: 'var(--accent-dark, #D63C47)' }}>{event.availableSeats}</strong> {t('seatsLeft')}
            </span>
          </div>
        )}

        {/* Tier info (compact) + legend */}
        <div className="st-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: expandedTier ? 10 : 12 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted-color)' }}>
              SEAT TYPES
            </span>
            {visibleTiers.map(tier => {
              const info = getTierInfo(tier)
              const sample = seatsByTier[tier][0]
              const open = expandedTier === tier
              return (
                <button
                  key={tier}
                  type="button"
                  className={`st-tier-btn ${open ? 'open' : ''}`}
                  style={{ '--tier': info.color, '--tier-bg': info.background }}
                  onClick={() => setExpandedTier(open ? null : tier)}
                  aria-expanded={open}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: info.gradient }} />
                  <strong>{info.icon} {info.label}</strong>
                  {sample && <span style={{ opacity: 0.8 }}>{money(getSeatPrice(sample, event))}</span>}
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{open ? '▲' : 'ⓘ'}</span>
                </button>
              )
            })}
          </div>

          {expandedTier && (
            <div style={{
              background: getTierInfo(expandedTier).background,
              border: `1px dashed ${getTierInfo(expandedTier).color}`,
              borderRadius: 12, padding: '10px 14px', marginBottom: 12,
              color: '#172033',
            }}>
              <strong style={{ color: getTierInfo(expandedTier).color, fontSize: '0.85rem' }}>
                {getTierInfo(expandedTier).icon} {getTierInfo(expandedTier).label} includes:
              </strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: '0.8rem', columns: 2, columnGap: 24 }}>
                {getTierInfo(expandedTier).perks.map((perk, i) => (
                  <li key={i} style={{ marginBottom: 2, breakInside: 'avoid' }}>{perk}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="st-legend">
            <span>
              <i className="st-swatch" style={{ background: 'var(--card-bg)', border: '1.5px solid var(--border-color)', borderTop: '4px solid #94A3B8' }} />
              Available
            </span>
            <span><i className="st-swatch" style={{ background: GRADIENT }} /> Selected</span>
            <span>
              <i className="st-swatch" style={{
                background: 'repeating-linear-gradient(45deg, var(--card-bg-alt), var(--card-bg-alt) 3px, var(--border-color) 3px, var(--border-color) 4px)',
                border: '1px solid var(--border-color)',
              }} />
              Reserved
            </span>
          </div>
        </div>

        {/* Seat map */}
        <form onSubmit={handlePreview}>
          {visibleTiers.length === 0 && !loadError && (
            <div className="st-card" style={{ textAlign: 'center', color: 'var(--muted-color)' }}>
              No seats are available for this event.
            </div>
          )}

          {visibleTiers.map(tier => {
            const tierSeats = seatsByTier[tier]
            const info = getTierInfo(tier)
            return (
              <div key={tier} className="st-card" style={{ '--tier': info.color, '--tier-gradient': info.gradient }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: info.color }}>
                    {info.icon} {info.label}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted-color)' }}>
                    {tierSeats.length} seat{tierSeats.length !== 1 ? 's' : ''} · {money(getSeatPrice(tierSeats[0], event))} each
                  </span>
                </div>
                <div className="st-grid">
                  {tierSeats.map(seat => {
                    const reserved = isReserved(seat)
                    const isSel = selected.includes(seat.id)
                    const displayPrice = getSeatPrice(seat, event)
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={reserved}
                        onClick={() => toggleSeat(seat)}
                        aria-pressed={isSel}
                        title={reserved ? 'Already reserved' : seatLabel(seat)}
                        className={`st-seat ${isSel ? 'selected' : ''} ${reserved ? 'reserved' : ''}`}
                      >
                        <div className="code">{seatCode(seat) || seat.id}</div>
                        <div className="sub">Seat {seat.id}</div>
                        <div className="price">{reserved ? 'Reserved' : `${displayPrice.toLocaleString('en-US')} ETB`}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Sticky selection summary */}
          <div className="st-bar" role="region" aria-label="Selected seats summary">
            {error && <div className="st-error" role="alert">! {error}</div>}
            <div className="st-bar-row">
              <div style={{ minWidth: 0, flex: 1 }}>
                {selected.length === 0 ? (
                  <div style={{ fontSize: '0.88rem', color: 'var(--muted-color)' }}>
                    No seats selected yet. Tap a seat to add it.
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted-color)', marginBottom: 6 }}>
                      <strong style={{ color: 'var(--text-color)' }}>{selected.length}</strong> seat{selected.length !== 1 ? 's' : ''} selected
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 64, overflowY: 'auto' }}>
                      {selectedSeatObjects.map(s => (
                        <span key={s.id} className="st-chip">
                          {getTierInfo(s.category || 'NORMAL').icon} {seatCode(s) || s.id}
                          <button type="button" onClick={() => toggleSeat(s)} aria-label={`Remove seat ${s.id}`}>×</button>
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.68rem', letterSpacing: '0.06em', color: 'var(--muted-color)' }}>EST. TOTAL</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-dark, #D63C47)' }}>
                    {money(estimatedTotal)}
                  </div>
                </div>
                <button type="submit" className={`st-continue ${selected.length === 0 ? 'idle' : ''}`}>
                  {t('viewDetails')} →
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}