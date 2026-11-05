import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Verify2FA() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const username = location.state?.username

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!username) {
    return <Navigate to="/login" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/auth/2fa/verify', { username, code })
      login(res.data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || '❌ Invalid or expired code')
    } finally {
      setLoading(false)
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
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.96)',
        borderRadius: '20px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(5px)'
      }}>
        <h2 style={{ color: '#0097a7', textAlign: 'center', marginBottom: '12px' }}>Two-Factor Verification</h2>
        <p style={{ textAlign: 'center', color: '#555', marginBottom: '24px' }}>
          We sent a 6-digit code to the email on file for <strong>{username}</strong>. Enter it below.
        </p>
        {error && <div style={{ color: '#d9534f', textAlign: 'center', marginBottom: '16px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Verification Code</label>
            <input
              type="text"
              name="code"
              className="form-control"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
            />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%',
            background: 'linear-gradient(135deg, #00acc1, #007c8a)',
            color: 'white',
            borderRadius: '30px',
            border: 'none',
            padding: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem'
          }}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  )
}