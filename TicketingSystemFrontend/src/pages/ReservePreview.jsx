import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import { SeatTierBadge, getTierInfo } from '../constants/seatTiers'
import { formatEventDate } from '../utils/formatDate'
import { seatLabel } from '../utils/seatLabel'
import api from '../api/axios'

const GRADIENT = 'linear-gradient(135deg, #FF686B, #FF9B71)'

const rowStyle = {
  display: 'flex', gap: 12, alignItems: 'flex-start',
  padding: '10px 0', borderBottom: '1px solid var(--border-color)',
  fontSize: '0.9rem',
}
const rowLabel = { color: 'var(--muted-color)', fontWeight: 600, minWidth: 100, flexShrink: 0 }
const rowValue = { fontWeight: 600, flex: 1, minWidth: 0, wordBreak: 'break-word' }

export default function ReservePreview() {
  const { state } = useLocation()
  const { user } = useAuth()
  const { t } = usePreferences()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!state) navigate('/', { replace: true })
  }, [state, navigate])

  if (!state) return null

  const { eventId, seatIds, event, seatDetails } = state
  const seats = seatDetails || []

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/reservations/confirm', {
        eventId: parseInt(eventId),
        seatIds,
      })
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl
      } else {
        setError('The server did not return a payment URL. Please try again.')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm reservation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const tierGroups = seats.reduce((acc, seat) => {
    const tier = seat.category || 'NORMAL'
    if (!acc[tier]) acc[tier] = { count: 0, unitPrice: Number(seat.price), subtotal: 0 }
    acc[tier].count += 1
    acc[tier].subtotal += Number(seat.price)
    return acc
  }, {})

  const totalAmount = seats.length > 0
    ? seats.reduce((sum, s) => sum + Number(s.price), 0)
    : (event?.price || 100) * seatIds.length

  return (
    <div style={{
      background: 'var(--bg-color)', color: 'var(--text-color)',
      fontFamily: 'Montserrat, sans-serif',
      padding: '32px 16px 48px',
      display: 'flex', justifyContent: 'center',
      minHeight: 'calc(100vh - 56px)',
      transition: 'background 0.3s, color 0.3s',
    }}>
      <div style={{
        width: '100%', maxWidth: 640, alignSelf: 'flex-start',
        background: 'var(--card-bg)', color: 'var(--text-color)',
        borderRadius: 22, overflow: 'hidden',
        boxShadow: '0 16px 40px rgba(23,32,51,0.14)',
        border: '1px solid var(--border-color)',
      }}>
        {/* Header */}
        <div style={{ background: GRADIENT, color: '#fff', padding: '22px 24px 20px' }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
            opacity: 0.9, marginBottom: 4,
          }}>
            STEP 2 OF 3 · REVIEW
          </div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            Confirm your reservation
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '0.85rem', opacity: 0.92 }}>
            Review your seats and total, then continue to secure payment.
          </p>
        </div>

        <div style={{ padding: '20px 24px 24px' }}>
          {error && (
            <div style={{
              background: 'rgba(220,53,69,0.12)', color: '#B42318',
              border: '1px solid rgba(220,53,69,0.35)',
              borderRadius: 10, padding: '9px 12px', fontSize: '0.85rem',
              fontWeight: 600, marginBottom: 14,
            }}>
              {error}
            </div>
          )}

          {/* Event info */}
          <div style={{ marginBottom: 12 }}>
            <div style={rowStyle}>
              <span style={rowLabel}>Event</span>
              <span style={rowValue}>{event?.title || '—'}</span>
            </div>
            <div style={rowStyle}>
              <span style={rowLabel}>{t('eventDate')}</span>
              <span style={rowValue}>{formatEventDate(event?.startAt)}</span>
            </div>
            {event?.venueName && (
              <div style={rowStyle}>
                <span style={rowLabel}>{t('eventVenue')}</span>
                <span style={rowValue}>{event.venueName}</span>
              </div>
            )}
            <div style={rowStyle}>
              <span style={rowLabel}>{t('email')}</span>
              <span style={rowValue}>{user?.email || '—'}</span>
            </div>
          </div>

          {/* Seats */}
          <div style={{ marginTop: 16, marginBottom: 8 }}>
            <div style={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
              color: 'var(--muted-color)', marginBottom: 8,
            }}>
              {seatIds.length} SEAT{seatIds.length !== 1 ? 'S' : ''} SELECTED
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {seats.length > 0 ? seats.map(seat => (
                <div key={seat.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: 10, background: 'var(--card-bg-alt)',
                  borderRadius: 10, padding: '8px 12px', fontSize: '0.85rem',
                }}>
                  <span>🪑 {seatLabel(seat)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <SeatTierBadge category={seat.category} />
                    <strong style={{ whiteSpace: 'nowrap' }}>
                      {Number(seat.price).toLocaleString('en-US')} ETB
                    </strong>
                  </div>
                </div>
              )) : seatIds.map(id => (
                <div key={id} style={{
                  background: 'var(--card-bg-alt)', borderRadius: 10,
                  padding: '8px 12px', fontSize: '0.85rem',
                }}>
                  Seat {id}
                </div>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          <div style={{
            marginTop: 16, background: 'var(--card-bg-alt)',
            border: '1px solid var(--border-color)',
            borderRadius: 12, padding: '12px 14px',
          }}>
            {Object.entries(tierGroups).length > 0 && (
              <div style={{ marginBottom: 10 }}>
                {Object.entries(tierGroups).map(([tier, info]) => {
                  const tierInfo = getTierInfo(tier)
                  return (
                    <div key={tier} style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: '0.83rem', color: 'var(--muted-color)', marginBottom: 4,
                    }}>
                      <span>
                        {info.count} × {tierInfo.icon} {tierInfo.label}{' '}
                        <span style={{ opacity: 0.8 }}>
                          ({info.unitPrice.toLocaleString('en-US')} ETB ea)
                        </span>
                      </span>
                      <span>{info.subtotal.toLocaleString('en-US')} ETB</span>
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTop: '1px solid var(--border-color)', paddingTop: 10,
            }}>
              <strong style={{ fontSize: '0.9rem' }}>Total</strong>
              <strong style={{ fontSize: '1.15rem', color: 'var(--accent-dark, #D63C47)' }}>
                {totalAmount.toLocaleString('en-US')} ETB
              </strong>
            </div>
          </div>

          {/* Hold notice */}
          <div style={{
            marginTop: 14, background: 'rgba(255,155,113,0.12)',
            border: '1px solid rgba(255,155,113,0.35)',
            borderRadius: 10, padding: '10px 14px',
            fontSize: '0.82rem', color: 'var(--text-color)', lineHeight: 1.5,
          }}>
            <strong>⏱ Heads up:</strong> You will be redirected to Chapa to complete
            payment. Your seats will be held for 5 minutes.
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            gap: 10, marginTop: 22, flexWrap: 'wrap',
          }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              style={{
                height: 44, padding: '0 1.4rem', borderRadius: 999,
                cursor: loading ? 'not-allowed' : 'pointer',
                background: 'transparent', color: 'var(--text-color)',
                border: '1.5px solid var(--border-color)',
                fontFamily: 'inherit', fontWeight: 600, fontSize: '0.9rem',
              }}
            >
              ← {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              style={{
                height: 44, minWidth: 200, padding: '0 1.6rem',
                borderRadius: 999, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: GRADIENT, color: '#fff',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '0.92rem',
                boxShadow: '0 6px 16px rgba(255,104,107,0.3)',
                opacity: loading ? 0.65 : 1,
              }}
            >
              {loading ? t('loading') : '💳 Continue to payment →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}