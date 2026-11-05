import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePreferences } from '../context/PreferencesContext'
import api from '../api/axios'

const inputStyle = { padding: '0.5rem 0.85rem', fontSize: '0.95rem', borderRadius: '10px' }
const labelStyle = { fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }
const fieldWrap = { marginBottom: '0.8rem' }

export default function Register() {
  const { t } = usePreferences()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '', username: '', email: '', password: '', confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const getPasswordErrors = (password) => {
    const errors = []
    if (password.length < 6) errors.push('At least 6 characters')
    if (!/[a-zA-Z]/.test(password)) errors.push('At least one letter')
    if (!/\d/.test(password)) errors.push('At least one number')
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password))
      errors.push('At least one special character (!@#$%^&*)')
    return errors
  }

  const [passwordErrors, setPasswordErrors] = useState([])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    if (name === 'password') {
      setPasswordErrors(getPasswordErrors(value))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please type the same password in both fields.')
      return
    }
    if (passwordErrors.length > 0) {
      setError('Please fix the password issues listed below.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/api/auth/register', {
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        password: form.password,
      })
      navigate('/verify-email', { state: { email: form.email } })
    } catch (err) {
      const msg = err.response?.data?.error
      if (msg && msg.includes('Username already taken')) {
        setError('This username is already taken. Please choose another one.')
      } else if (msg && msg.includes('Email already registered')) {
        setError('This email is already registered. Please log in or use a different email.')
      } else {
        setError(msg || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
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

  const eyeBtn = {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    color: 'var(--muted-color)',
  }

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
        maxWidth: '420px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
        border: '1px solid var(--border-color)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.1rem' }}>
          <div style={{
            width: '44px', height: '5px', borderRadius: '5px',
            background: 'var(--accent-gradient)', margin: '0 auto 0.9rem',
          }} />
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-color)' }}>
            {t('createAccount')}
          </h2>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: 'var(--muted-color)' }}>
            {t('registerSubtitle')}
          </p>
        </div>

        {error && (
          <div style={{
            color: '#B42318', background: 'rgba(220,53,69,0.10)',
            border: '1px solid rgba(220,53,69,0.3)', borderRadius: '10px',
            padding: '0.55rem 0.8rem', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center',
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={fieldWrap}>
            <label className="form-label" style={labelStyle}>{t('fullNameLabel')}</label>
            <input type="text" name="fullName" className="form-control" style={inputStyle}
              value={form.fullName} onChange={handleChange} required />
          </div>
          <div style={fieldWrap}>
            <label className="form-label" style={labelStyle}>{t('loginUsername')}</label>
            <input type="text" name="username" className="form-control" style={inputStyle}
              value={form.username} onChange={handleChange} required />
          </div>
          <div style={fieldWrap}>
            <label className="form-label" style={labelStyle}>{t('email')}</label>
            <input type="email" name="email" className="form-control" style={inputStyle}
              value={form.email} onChange={handleChange} required />
          </div>
          <div style={fieldWrap}>
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
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeBtn}>
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>
            {passwordErrors.length > 0 && (
              <div style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '4px' }}>
                Password must contain:
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {passwordErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div style={{ marginBottom: '1.1rem' }}>
            <label className="form-label" style={labelStyle}>{t('confirmPassword')}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                className="form-control"
                style={{ ...inputStyle, paddingRight: '2.5rem' }}
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={eyeBtn}>
                {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-accent"
            style={{ width: '100%', padding: '0.65rem', fontSize: '0.95rem' }}
          >
            {loading ? t('registering') : t('signUpBtn')}
          </button>
          <p style={{ textAlign: 'center', margin: '1rem 0 0', fontSize: '0.88rem', color: 'var(--muted-color)' }}>
            {t('alreadyHaveAccount')} <Link to="/login" style={{ fontWeight: 700 }}>{t('login')}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}