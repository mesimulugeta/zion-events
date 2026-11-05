import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import api from '../api/axios'

const inputStyle = { padding: '0.55rem 0.85rem', fontSize: '0.95rem', borderRadius: '10px' }
const labelStyle = { fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }

export default function Login() {
  const { login } = useAuth()
  const { t } = usePreferences()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.post('/api/auth/login', form)
      if (res.data.requires2FA) {
        navigate('/verify-2fa', { state: { username: res.data.username } })
        return
      }
      if (rememberMe) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('username', res.data.username)
        localStorage.setItem('email', res.data.email)
        localStorage.setItem('role', res.data.role)
      } else {
        sessionStorage.setItem('token', res.data.token)
        sessionStorage.setItem('username', res.data.username)
        sessionStorage.setItem('email', res.data.email)
        sessionStorage.setItem('role', res.data.role)
      }
      login(res.data, rememberMe)
      navigate('/')
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.email) {
        navigate('/verify-email', {
          state: {
            email: err.response.data.email,
            expiresInSeconds: err.response.data.expiresInSeconds
          }
        })
      } else {
        const msg = err.response?.data?.error
        if (msg && msg.includes('verify your email')) {
          setError('Please verify your email before logging in. Check your inbox for the verification code.')
        } else {
          setError(msg || ' Invalid username or password')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!form.username.trim()) {
      setError('Please enter your username first.')
      return
    }
    setForgotLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.post('/api/auth/forgot-password', { username: form.username })
      setSuccess(res.data.message || 'We\'ve sent a reset code to your email.')
      setTimeout(() => {
        navigate('/reset-password', { state: { username: form.username } })
      }, 1500)
    } catch (err) {
      const msg = err.response?.data?.error
      if (msg && msg.includes('Could not send')) {
        setError('We couldn\'t send the email. Please try again later.')
      } else {
        setError(msg || 'Something went wrong. Please try again.')
      }
    } finally {
      setForgotLoading(false)
    }
  }

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )

  const EyeSlashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )

  const forgotDisabled = forgotLoading || !form.username.trim()

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      backgroundImage: `
        radial-gradient(circle at 15% 20%, rgba(255,104,107,0.20), transparent 45%),
        radial-gradient(circle at 85% 80%, rgba(255,155,113,0.16), transparent 45%),
        linear-gradient(rgba(23,26,29,0.60), rgba(23,26,29,0.75)),
        url('https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1600&h=900&fit=crop')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      fontFamily: 'Montserrat, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
    }}>
      <div style={{
        background: 'var(--card-bg)',
        color: 'var(--text-color)',
        borderRadius: '18px',
        padding: '1.75rem 2rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
        border: '1px solid var(--border-color)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: '44px', height: '5px', borderRadius: '5px',
            background: 'var(--accent-gradient)', margin: '0 auto 0.9rem',
          }} />
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-color)' }}>
            {t('welcomeBack')}
          </h2>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: 'var(--muted-color)' }}>
            {t('loginSubtitle')}
          </p>
        </div>

        {error && (
          <div style={{
            color: '#B42318', background: 'rgba(220,53,69,0.10)',
            border: '1px solid rgba(220,53,69,0.3)', borderRadius: '10px',
            padding: '0.55rem 0.8rem', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center',
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            color: '#166534', background: 'rgba(22,163,74,0.10)',
            border: '1px solid rgba(22,163,74,0.3)', borderRadius: '10px',
            padding: '0.55rem 0.8rem', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center',
          }}>{success}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.9rem' }}>
            <label className="form-label" style={labelStyle}>{t('loginUsername')}</label>
            <input
              type="text"
              name="username"
              className="form-control"
              style={inputStyle}
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>
          <div style={{ marginBottom: '0.9rem' }}>
            <label className="form-label" style={labelStyle}>{t('loginPassword')}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-control"
                style={{ ...inputStyle, paddingRight: '2.5rem' }}
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: 'var(--muted-color)',
                }}
              >
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div style={{
            marginBottom: '1.1rem', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem',
          }}>
            <div>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#FF686B' }}
              />
              <label htmlFor="rememberMe" className="ms-1">{t('rememberMe')}</label>
            </div>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={forgotDisabled}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-dark)',
                textDecoration: 'underline',
                cursor: forgotDisabled ? 'not-allowed' : 'pointer',
                opacity: forgotDisabled ? 0.5 : 1,
                fontSize: '0.85rem',
                padding: 0
              }}
            >
              {forgotLoading ? 'Sending...' : t('forgotPassword')}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-accent"
            style={{
              width: '100%',
              padding: '0.65rem',
              fontSize: '0.95rem',
            }}
          >
            {loading ? t('loggingIn') : t('loginBtn')}
          </button>
          <p style={{ textAlign: 'center', margin: '1rem 0 0', fontSize: '0.88rem', color: 'var(--muted-color)' }}>
            {t('newUser')} <Link to="/register" style={{ fontWeight: 700 }}>{t('signUp')}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}