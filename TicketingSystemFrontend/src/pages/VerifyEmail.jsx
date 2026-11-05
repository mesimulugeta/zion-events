import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import api from '../api/axios'

const STORAGE_KEY = 'verifyEmailPending'

export default function VerifyEmail() {
  const { login } = useAuth()
  const { t } = usePreferences()
  const navigate = useNavigate()
  const location = useLocation()

  const initial = useState(() => {
    if (location.state?.email) {
      const expiresAt = location.state.expiresInSeconds != null
        ? Date.now() + location.state.expiresInSeconds * 1000
        : null
      const data = { email: location.state.email, expiresAt }
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
      return data
    }
    try {
      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
      if (stored?.email) return stored
    } catch {}
    return { email: '', expiresAt: null }
  })[0]

  const [email, setEmail]           = useState(initial.email)
  const [code, setCode]             = useState('')
  const [error, setError]           = useState('')
  const [info, setInfo]             = useState('')
  const [loading, setLoading]       = useState(false)
  const [resending, setResending]   = useState(false)
  const [expiresAt, setExpiresAt]   = useState(initial.expiresAt)
  const [secondsLeft, setSecondsLeft] = useState(null)

  useEffect(() => {
    if (expiresAt === null) { setSecondsLeft(null); return }
    const tick = () => setSecondsLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [expiresAt])

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    try {
      const res = await api.post('/api/auth/verify', { email, code })

      
      if (res.data.token) {
        sessionStorage.removeItem(STORAGE_KEY)
        await login(res.data)
        navigate('/', { replace: true })
        return
      }

      if (res.data.message && res.data.message.includes('verified')) {
        sessionStorage.removeItem(STORAGE_KEY)
        navigate('/login', { state: { message: 'Your email is verified. Please log in.' } })
        return
      }

      sessionStorage.removeItem(STORAGE_KEY)
      setError('Verification succeeded but could not log you in. Please try logging in manually.')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || '❌ Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) { setError('Enter your email first'); return }
    setResending(true)
    setError('')
    setInfo('')
    try {
      const res = await api.post('/api/auth/resend-code', { email })
      setInfo(res.data.message || 'A new code has been sent.')
      const newExpiresAt = Date.now() + (res.data.expiresInSeconds ?? 300) * 1000
      setExpiresAt(newExpiresAt)
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ email, expiresAt: newExpiresAt })) } catch {}
    } catch (err) {
      setError(err.response?.data?.error || '❌ Could not resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1600&h=900&fit=crop')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      fontFamily: 'Montserrat, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.96)',
        borderRadius: '20px',
        padding: '2rem',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(5px)',
      }}>
        <h2 style={{ color: '#0097a7', textAlign: 'center', marginBottom: '12px' }}>
          {t('verifyYourEmail')}
        </h2>
        <p style={{ textAlign: 'center', color: '#555', marginBottom: '12px' }}>
          {t('verifyDesc')} <strong>{email || t('email')}</strong>. {t('verifyDesc2')}
        </p>

        {secondsLeft !== null && secondsLeft > 0 && (
          <p style={{ textAlign: 'center', color: '#777', marginBottom: '20px' }}>
            {t('codeExpiresIn')} <strong>{formatTime(secondsLeft)}</strong>
          </p>
        )}
        {secondsLeft === 0 && (
          <p style={{ textAlign: 'center', color: '#d9534f', marginBottom: '20px' }}>
            {t('codeExpired')}
          </p>
        )}
        {secondsLeft === null && (
          <p style={{ textAlign: 'center', color: '#777', marginBottom: '20px' }}>
            {t('codeExpiredHint')}
          </p>
        )}

        {error && <div style={{ color: '#d9534f', textAlign: 'center', marginBottom: '16px' }}>{error}</div>}
        {info  && <div style={{ color: '#0097a7', textAlign: 'center', marginBottom: '16px' }}>{info}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">{t('email')}</label>
            <input type="email" className="form-control"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label className="form-label">{t('verificationCode')}</label>
            <input type="text" className="form-control"
              value={code} onChange={(e) => setCode(e.target.value)}
              maxLength={6} placeholder="123456"
              style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem' }}
              required />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%',
            background: 'linear-gradient(135deg, #00acc1, #007c8a)',
            color: 'white', borderRadius: '30px', border: 'none',
            padding: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem',
          }}>
            {loading ? t('verifying') : t('verifyEmailBtn')}
          </button>
        </form>

        <button type="button" onClick={handleResend} disabled={resending} style={{
          width: '100%', background: 'transparent', color: '#0097a7',
          border: 'none', marginTop: '14px',
          cursor: resending ? 'not-allowed' : 'pointer', textDecoration: 'underline',
        }}>
          {resending ? t('resending') : t('resendCode')}
        </button>

        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          {t('alreadyVerified')} <Link to="/login">{t('login')}</Link>
        </p>
      </div>
    </div>
  )
}

