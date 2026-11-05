import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/PreferencesContext'
import api from '../../api/axios'
import '../../styles/profile.css'

const PersonIcon = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="30" r="17" fill="currentColor" />
    <path d="M44 34 Q50 39 56 34" stroke="rgba(255,255,255,0.35)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <circle cx="43" cy="28" r="2.2" fill="rgba(255,255,255,0.40)" />
    <circle cx="57" cy="28" r="2.2" fill="rgba(255,255,255,0.40)" />
    <path d="M18 94 Q24 58 50 58 Q76 58 82 94" fill="currentColor" />
    <path d="M44 56 Q50 62 56 56" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
  </svg>
)
const PersonMenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)
const GearIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
)
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
)
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
)
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const getPasswordErrors = (password) => {
  const errors = []
  if (password.length < 6) errors.push('at least 6 characters')
  if (!/[a-zA-Z]/.test(password)) errors.push('one letter')
  if (!/\d/.test(password)) errors.push('one number')
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('one special character')
  return errors
}

export default function AdminProfile() {
  const { logout } = useAuth()
  const { t, updatePreferences } = usePreferences()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [activeSection, setActiveSection] = useState('account')

  const [form, setForm] = useState({ fullName: '', phoneNumber: '', dateOfBirth: '', theme: 'LIGHT', language: 'ENGLISH' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const fileInputRef = useRef(null)
  const noticeTimer = useRef(null)

  useEffect(() => {
    api.get('/api/profile')
      .then(res => {
        setProfile(res.data)
        setForm({
          fullName: res.data.fullName || '',
          phoneNumber: res.data.phoneNumber || '',
          dateOfBirth: res.data.dateOfBirth || '',
          theme: res.data.theme || 'LIGHT',
          language: res.data.language || 'ENGLISH',
        })
      })
      .catch(() => setLoadError('Failed to load profile'))
    return () => clearTimeout(noticeTimer.current)
  }, [])

  const showNotice = (type, text) => {
    clearTimeout(noticeTimer.current)
    setNotice({ type, text })
    noticeTimer.current = setTimeout(() => setNotice(null), 4500)
  }

  const switchSection = (id) => { setActiveSection(id); setNotice(null) }
  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handlePwChange = (e) => setPwForm({ ...pwForm, [e.target.name]: e.target.value })

  const toggle2FA = async () => {
    setSaving(true)
    setNotice(null)
    try {
      const newValue = !profile.twoFactorEnabled
      await api.put(`/api/admin/profile/2fa?enabled=${newValue}`)
      setProfile({ ...profile, twoFactorEnabled: newValue })
      showNotice('success', newValue ? t('twoFactorOn') : t('twoFactorOff'))
    } catch (err) {
      showNotice('error', err.response?.data?.error || 'Failed to update 2FA setting.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      const res = await api.put('/api/profile', form)
      setProfile(res.data)
      updatePreferences(form.theme, form.language)
      showNotice('success', t('profileUpdated'))
    } catch (err) {
      showNotice('error', err.response?.data?.error || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handlePictureChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSaving(true)
    setNotice(null)
    try {
      const data = new FormData()
      data.append('file', file)
      const res = await api.post('/api/profile/picture', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setProfile(res.data)
      showNotice('success', t('pictureUpdated'))
    } catch (err) {
      showNotice('error', err.response?.data?.error || 'Failed to upload picture.')
    } finally {
      setSaving(false)
      e.target.value = ''
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setNotice(null)
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showNotice('error', 'New passwords do not match.')
      return
    }
    const problems = getPasswordErrors(pwForm.newPassword)
    if (problems.length > 0) {
      showNotice('error', `New password needs ${problems.join(', ')}.`)
      return
    }
    setSaving(true)
    try {
      await api.put('/api/profile/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      showNotice('success', t('passwordChanged'))
    } catch (err) {
      showNotice('error', err.response?.data?.error || 'Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await api.delete('/api/profile')
      logout()
      navigate('/login')
    } catch (err) {
      setShowDeleteModal(false)
      setDeleteText('')
      showNotice('error', err.response?.data?.error || 'Failed to delete account.')
    } finally {
      setDeleting(false)
    }
  }

  const triggerFileInput = () => fileInputRef.current?.click()

  const menuItems = [
    { id: 'account',     label: t('accountInfo'),    icon: <PersonMenuIcon /> },
    { id: 'preferences', label: t('preferences'),    icon: <GearIcon /> },
    { id: 'password',    label: t('changePassword'), icon: <LockIcon /> },
    { id: 'delete',      label: t('deleteAccount'),  icon: <TrashIcon />, danger: true },
  ]

  if (!profile) {
    return <div className="container mt-4" style={{ color: 'var(--text-color)' }}>{loadError || t('loading')}</div>
  }

  const twoFactorEnabled = !!profile.twoFactorEnabled

  const renderContent = () => {
    switch (activeSection) {
      case 'account':
        return (
          <>
            <div className="pf-header">{t('accountInfo')}</div>
            <div className="pf-sub">{t('manageDetailsSecurity')}</div>
            <form onSubmit={handleSaveProfile} className="pf-card">
              <div className="pf-field">
                <label>{t('username')}</label>
                <input type="text" value={profile.username || ''} disabled readOnly />
              </div>
              <div className="pf-field">
                <label>{t('email')}</label>
                <input type="text" value={profile.email || ''} disabled readOnly />
              </div>
              <div className="pf-field">
                <label>{t('fullName')}</label>
                <input type="text" name="fullName" value={form.fullName} onChange={handleFormChange} />
              </div>
              <div className="pf-field">
                <label>{t('phoneNumber')}</label>
                <input type="text" name="phoneNumber" value={form.phoneNumber} onChange={handleFormChange} />
              </div>
              <div className="pf-field">
                <label>{t('dateOfBirth')}</label>
                <input type="date" name="dateOfBirth" value={form.dateOfBirth || ''} onChange={handleFormChange} />
              </div>

              <div className="pf-twofa">
                <div>
                  <div className="pf-twofa-title">{t('twoFactorEnabled')}</div>
                  <div className="pf-twofa-desc">{twoFactorEnabled ? t('twoFactorOn') : t('twoFactorOff')}</div>
                </div>
                <div className="pf-twofa-right">
                  <span className={`pf-chip ${twoFactorEnabled ? 'on' : 'off'}`}>
                    {twoFactorEnabled ? t('enabled') : t('disabled')}
                  </span>
                  <button
                    type="button"
                    className={`pf-toggle ${twoFactorEnabled ? 'active' : ''}`}
                    onClick={toggle2FA}
                    disabled={saving}
                    role="switch"
                    aria-checked={twoFactorEnabled}
                    aria-label={t('twoFactorEnabled')}
                  />
                </div>
              </div>

              <button type="submit" className="pf-btn-primary" disabled={saving}>
                {saving ? t('loading') : t('saveChanges')}
              </button>
            </form>
          </>
        )

      case 'preferences':
        return (
          <>
            <div className="pf-header">{t('preferences')}</div>
            <div className="pf-sub">{t('customizeExperience')}</div>
            <form onSubmit={handleSaveProfile} className="pf-card">
              <div className="pf-field">
                <label>{t('theme')}</label>
                <select name="theme" value={form.theme} onChange={handleFormChange}>
                  <option value="LIGHT">Light</option>
                  <option value="DARK">Dark</option>
                </select>
              </div>
              <div className="pf-field">
                <label>{t('language')}</label>
                <select name="language" value={form.language} onChange={handleFormChange}>
                  <option value="ENGLISH">English</option>
                  <option value="AMHARIC">አማርኛ</option>
                  <option value="AFAAN_OROMO">Afaan Oromo</option>
                  <option value="TIGRIGNA">ትግርኛ</option>
                </select>
              </div>
              <button type="submit" className="pf-btn-primary" disabled={saving}>
                {saving ? t('loading') : t('savePreferences')}
              </button>
            </form>
          </>
        )

      case 'password':
        return (
          <>
            <div className="pf-header">{t('changePassword')}</div>
            <div className="pf-sub">{t('updateCredentials')}</div>
            <form onSubmit={handleChangePassword} className="pf-card">
              <div className="pf-field">
                <label>{t('currentPassword')}</label>
                <input type="password" name="currentPassword" value={pwForm.currentPassword} onChange={handlePwChange} required />
              </div>
              <div className="pf-field">
                <label>{t('newPassword')}</label>
                <input type="password" name="newPassword" value={pwForm.newPassword} onChange={handlePwChange} required />
                <small className="pf-hint">6+ characters with a letter, a number and a special character.</small>
              </div>
              <div className="pf-field">
                <label>Confirm new password</label>
                <input type="password" name="confirmPassword" value={pwForm.confirmPassword} onChange={handlePwChange} required />
              </div>
              <button type="submit" className="pf-btn-primary" disabled={saving}>
                {saving ? t('loading') : t('changePasswordBtn')}
              </button>
            </form>
          </>
        )

      case 'delete':
        return (
          <>
            <div className="pf-header">{t('deleteAccount')}</div>
            <div className="pf-sub">{t('permanentlyRemove')}</div>
            <div className="pf-card">
              <div className="pf-warning">
                <p><strong>{t('warning')}</strong> {t('deleteWarning')}</p>
              </div>
              <button className="pf-btn-danger" onClick={() => setShowDeleteModal(true)}>
                {t('deleteAccountBtn')}
              </button>
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="pf-wrapper">
      <div className="pf-container">
        {/* Sidebar */}
        <div className="pf-sidebar">
          <div className="pf-avatar-block">
            <div className="pf-avatar-ring" onClick={triggerFileInput} title="Change photo">
              <div className="pf-avatar-circle">
                {profile.profilePicUrl ? <img src={profile.profilePicUrl} alt="Profile" /> : <PersonIcon size={52} />}
              </div>
              <span className="pf-avatar-edit">✎</span>
            </div>
            <div className="pf-avatar-name">{profile.fullName || profile.username}</div>
            <div className="pf-avatar-email">{profile.email}</div>
            <span className="pf-role">ADMIN</span>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePictureChange} />
          </div>

          <div className="pf-menu">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`pf-menu-item ${item.danger ? 'danger' : ''} ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => switchSection(item.id)}
              >
                <span className="pf-menu-icon">{item.icon}</span>
                <span className="pf-menu-label">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="pf-sidebar-footer">
            <button className="pf-foot-btn" onClick={() => navigate('/')}>
              <BackIcon /><span>{t('backToEvents')}</span>
            </button>
            <button className="pf-foot-btn logout" onClick={() => { logout(); navigate('/') }}>
              <LogoutIcon /><span>{t('logout')}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="pf-content">
          {notice && (
            <div className={`pf-notice ${notice.type}`} role="status">
              <span className="pf-notice-icon">{notice.type === 'success' ? '✓' : '!'}</span>
              <span style={{ flex: 1 }}>{notice.text}</span>
              <button className="pf-notice-close" onClick={() => setNotice(null)} aria-label="Dismiss">×</button>
            </div>
          )}
          <div className="pf-fade" key={activeSection}>{renderContent()}</div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteModal && (
        <div className="pf-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="pf-modal-icon">⚠️</div>
            <h3>{t('deleteAccount')}?</h3>
            <p>{t('confirmDelete')}</p>
            <p style={{ marginBottom: 6 }}>Type <strong>DELETE</strong> to confirm:</p>
            <input
              className="pf-modal-input"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="DELETE"
              autoFocus
            />
            <div className="pf-modal-actions">
              <button className="pf-btn-ghost" onClick={() => { setShowDeleteModal(false); setDeleteText('') }} disabled={deleting}>
                {t('cancel')}
              </button>
              <button className="pf-btn-danger" onClick={handleDeleteAccount} disabled={deleteText !== 'DELETE' || deleting}>
                {deleting ? t('loading') : t('yesDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}