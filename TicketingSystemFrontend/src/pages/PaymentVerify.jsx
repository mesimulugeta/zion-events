import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { usePreferences } from '../context/PreferencesContext'
import { SeatTierBadge } from '../constants/seatTiers'
import { formatEventDate } from '../utils/formatDate'
import { refNumber, seatLabel } from '../utils/seatLabel'
import api from '../api/axios'

const GRADIENT = 'linear-gradient(135deg, #FF686B, #FF9B71)'

const row = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
  padding: '10px 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem',
}
const rowLabel = { color: 'var(--muted-color)', fontWeight: 600, flexShrink: 0 }
const rowValue = { fontWeight: 600, textAlign: 'right', minWidth: 0 }

const pageShell = {
  background: 'var(--bg-color)', color: 'var(--text-color)',
  fontFamily: 'Montserrat, sans-serif', padding: '32px 16px 48px',
  display: 'flex', justifyContent: 'center', transition: 'background 0.3s, color 0.3s',
}

export default function PaymentVerify() {
  const { reservationId: pathReservationId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = usePreferences()
  const [loading, setLoading] = useState(true)
  const [receiptData, setReceiptData] = useState(null)
  const [verifyError, setVerifyError] = useState('')

  useEffect(() => {
    const run = async () => {
      let reservationId = pathReservationId

      if (!reservationId) {
        reservationId = searchParams.get('reservationId')
      }

      let txRef = searchParams.get('tx_ref') || searchParams.get('trx_ref')

      if (!reservationId && txRef && txRef.startsWith('TX-')) {
        const parts = txRef.split('-')
        if (parts.length >= 2) reservationId = parts[1]
      }

      if (!reservationId) {
        setLoading(false)
        return
      }

      if (txRef) {
        try {
          await api.post('/api/payments/verify', { tx_ref: txRef })
        } catch (err) {
          console.error('Payment verify call failed:', err)
          setVerifyError(err.response?.data?.message || 'Could not verify payment')
        }
      } else {
        console.warn('No tx_ref found in URL — skipping explicit verify call, relying on webhook.')
      }

      try {
        const res = await api.get(`/api/reservations/${reservationId}`)
        setReceiptData(res.data)
      } catch (err) {
        console.error('Failed to fetch reservation:', err)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [pathReservationId, searchParams])

  if (loading) {
    return (
      <div style={{ ...pageShell, minHeight: '60vh', alignItems: 'center' }}>
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border-color)',
          borderRadius: 18, padding: '28px 36px', textAlign: 'center',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', margin: '0 auto 12px',
            border: '4px solid var(--border-color)', borderTopColor: '#FF686B',
            animation: 'pvSpin 0.8s linear infinite',
          }} />
          <style>{`@keyframes pvSpin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontWeight: 700 }}>Confirming your payment…</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--muted-color)', marginTop: 4 }}>Please don't close this page.</div>
        </div>
      </div>
    )
  }

  if (receiptData) {
    const { reservation, event, seats } = receiptData
    const isConfirmed = reservation.status === 'CONFIRMED'
    const accent = isConfirmed ? '#16A34A' : '#F59E0B'

    return (
      <div style={pageShell}>
        <div style={{
          width: '100%', maxWidth: 560, background: 'var(--card-bg)', color: 'var(--text-color)',
          border: '1px solid var(--border-color)', borderRadius: 22, overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(23,32,51,0.14)', alignSelf: 'flex-start',
        }}>
          {/* Header */}
          <div style={{ background: GRADIENT, color: '#fff', padding: '26px 24px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#fff', margin: '0 auto 12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 800, color: accent, boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            }}>
              {isConfirmed ? '✓' : '⏳'}
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
              {isConfirmed ? 'Payment successful' : 'Payment pending'}
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '0.9rem', opacity: 0.92 }}>
              {isConfirmed
                ? 'Your seats are confirmed. Enjoy the event!'
                : 'We could not confirm your payment yet. If you already paid, check your email or contact support.'}
            </p>
          </div>

          <div style={{ padding: '20px 24px 24px' }}>
            {verifyError && (
              <div style={{
                background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.3)', color: '#B42318',
                borderRadius: 10, padding: '8px 12px', fontSize: '0.82rem', fontWeight: 600, marginBottom: 14,
              }}>
                {verifyError}
              </div>
            )}

            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-dark, #D63C47)' }}>
              RESERVATION RECEIPT
            </div>
            <h3 style={{ margin: '2px 0 10px', fontSize: '1.2rem', fontWeight: 800 }}>{event.title}</h3>

            <div>
              <div style={row}><span style={rowLabel}>Reference</span><span style={rowValue}>{refNumber(reservation.id)}</span></div>
              <div style={row}><span style={rowLabel}>{t('eventDate')}</span><span style={rowValue}>{formatEventDate(event.startAt)}</span></div>
              <div style={row}><span style={rowLabel}>{t('eventVenue')}</span><span style={rowValue}>{event.venueName || 'Main Hall'}</span></div>
              <div style={{ ...row, flexDirection: 'column', gap: 8 }}>
                <span style={rowLabel}>{t('seats')}</span>
                <div style={{ display: 'grid', gap: 6 }}>
                  {seats.map(s => (
                    <div key={s.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                      background: 'var(--card-bg-alt)', borderRadius: 10, padding: '6px 10px', fontSize: '0.84rem',
                    }}>
                      <span>🪑 {seatLabel(s)}</span>
                      <SeatTierBadge category={s.category} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={row}>
                <span style={rowLabel}>Total paid</span>
                <span style={{ ...rowValue, fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-dark, #D63C47)' }}>
                  ETB {Number(reservation.amount || 0).toLocaleString('en-US')}
                </span>
              </div>
              <div style={{ ...row, borderBottom: 'none' }}>
                <span style={rowLabel}>{t('status')}</span>
                <span style={{
                  padding: '3px 12px', borderRadius: 999, fontSize: '0.76rem', fontWeight: 700,
                  background: isConfirmed ? '#DCFCE7' : '#FEF3C7', color: isConfirmed ? '#166534' : '#92400E',
                }}>
                  {isConfirmed ? 'Confirmed' : reservation.status}
                </span>
              </div>
            </div>

            {isConfirmed && (
              <p style={{ fontSize: '0.78rem', color: 'var(--muted-color)', textAlign: 'center', margin: '14px 0 0' }}>
                A confirmation email with your tickets was sent to {reservation.customerEmail}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/reservations/my')}
                style={{
                  flex: 1, minWidth: 160, height: 44, border: 'none', borderRadius: 999, cursor: 'pointer',
                  background: GRADIENT, color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.92rem',
                  boxShadow: '0 6px 16px rgba(255,104,107,0.3)',
                }}
              >
                🎫 {t('myReservationsTitle').replace('🎟️ ', '')}
              </button>
              <button
                onClick={() => navigate('/')}
                style={{
                  flex: 1, minWidth: 140, height: 44, borderRadius: 999, cursor: 'pointer',
                  background: 'transparent', color: 'var(--text-color)', border: '1.5px solid var(--border-color)',
                  fontFamily: 'inherit', fontWeight: 600, fontSize: '0.92rem',
                }}
              >
                Browse events
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback — no receipt data
  return (
    <div style={{ ...pageShell, minHeight: '60vh', alignItems: 'center' }}>
      <div style={{
        width: '100%', maxWidth: 480, background: 'var(--card-bg)', border: '1px solid var(--border-color)',
        borderRadius: 20, padding: '30px 26px', textAlign: 'center', boxShadow: '0 10px 28px rgba(23,32,51,0.1)',
      }}>
        <div style={{ fontSize: 44, marginBottom: 6 }}>🔎</div>
        <h3 style={{ margin: '0 0 6px', fontWeight: 800 }}>Receipt not found</h3>
        <p style={{ color: 'var(--muted-color)', fontSize: '0.9rem', margin: '0 0 18px' }}>
          We could not retrieve your reservation details. Please check your email for the confirmation.
        </p>
        <button
          onClick={() => navigate('/reservations/my')}
          style={{
            width: '100%', height: 44, border: 'none', borderRadius: 999, cursor: 'pointer',
            background: GRADIENT, color: '#fff', fontFamily: 'inherit', fontWeight: 700,
          }}
        >
          {t('myReservationsTitle').replace('🎟️ ', '')}
        </button>
      </div>
    </div>
  )
}