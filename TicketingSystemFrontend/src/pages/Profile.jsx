import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import api from '../api/axios';

const PersonIcon = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="30" r="17" fill="currentColor" />
    <path d="M44 34 Q50 39 56 34" stroke="rgba(255,255,255,0.35)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <circle cx="43" cy="28" r="2.2" fill="rgba(255,255,255,0.40)" />
    <circle cx="57" cy="28" r="2.2" fill="rgba(255,255,255,0.40)" />
    <path d="M18 94 Q24 58 50 58 Q76 58 82 94" fill="currentColor" />
    <path d="M44 56 Q50 62 56 56" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
  </svg>
);

const PersonMenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const GearIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const getPasswordErrors = (password) => {
  const errors = [];
  if (password.length < 6) errors.push('at least 6 characters');
  if (!/[a-zA-Z]/.test(password)) errors.push('one letter');
  if (!/\d/.test(password)) errors.push('one number');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('one special character');
  return errors;
};

export default function Profile() {
  const { logout } = useAuth();
  const { t, updatePreferences } = usePreferences();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'success' | 'error', text }
  const [activeSection, setActiveSection] = useState('account');

  const [form, setForm] = useState({ fullName: '', phoneNumber: '', dateOfBirth: '', theme: 'LIGHT', language: 'ENGLISH' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef(null);
  const noticeTimer = useRef(null);

  useEffect(() => {
    api.get('/api/profile')
      .then(res => {
        setProfile(res.data);
        setForm({
          fullName: res.data.fullName || '',
          phoneNumber: res.data.phoneNumber || '',
          dateOfBirth: res.data.dateOfBirth || '',
          theme: res.data.theme || 'LIGHT',
          language: res.data.language || 'ENGLISH',
        });
      })
      .catch(() => setLoadError('Failed to load profile'));
    return () => clearTimeout(noticeTimer.current);
  }, []);

  const showNotice = (type, text) => {
    clearTimeout(noticeTimer.current);
    setNotice({ type, text });
    noticeTimer.current = setTimeout(() => setNotice(null), 4500);
  };

  const switchSection = (id) => {
    setActiveSection(id);
    setNotice(null);
  };

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePwChange = (e) => setPwForm({ ...pwForm, [e.target.name]: e.target.value });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await api.put('/api/profile', form);
      setProfile(res.data);
      updatePreferences(form.theme, form.language);
      showNotice('success', t('profileUpdated'));
    } catch (err) {
      showNotice('error', err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    setNotice(null);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await api.post('/api/profile/picture', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(res.data);
      showNotice('success', t('pictureUpdated'));
    } catch (err) {
      showNotice('error', err.response?.data?.error || 'Failed to upload picture.');
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setNotice(null);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showNotice('error', 'New passwords do not match.');
      return;
    }
    const problems = getPasswordErrors(pwForm.newPassword);
    if (problems.length > 0) {
      showNotice('error', `New password needs ${problems.join(', ')}.`);
      return;
    }

    setSaving(true);
    try {
      await api.put('/api/profile/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showNotice('success', t('passwordChanged'));
    } catch (err) {
      showNotice('error', err.response?.data?.error || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/api/profile');
      logout();
      navigate('/login');
    } catch (err) {
      setShowDeleteModal(false);
      setDeleteText('');
      showNotice('error', err.response?.data?.error || 'Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const menuItems = [
    { id: 'account',     label: t('accountInfo'),    icon: <PersonMenuIcon /> },
    { id: 'preferences', label: t('preferences'),    icon: <GearIcon /> },
    { id: 'password',    label: t('changePassword'), icon: <LockIcon /> },
    { id: 'delete',      label: t('deleteAccount'),  icon: <TrashIcon />, danger: true },
  ];

  if (!profile) {
    return <div className="container mt-4" style={{ color: 'var(--text-color)' }}>{loadError || t('loading')}</div>;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'account':
        return (
          <>
            <div className="pf-header">{t('accountInfo')}</div>
            <div className="pf-sub">{t('manageDetails')}</div>
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
              <button type="submit" className="pf-btn-primary" disabled={saving}>
                {saving ? t('loading') : t('saveChanges')}
              </button>
            </form>
          </>
        );

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
        );

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
        );

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
        );

      default:
        return null;
    }
  };

  return (
    <div className="pf-wrapper">
      <div className="pf-container">
        {/* ─── SIDEBAR ─── */}
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
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePictureChange} />
          </div>

          <div className="pf-menu">
            {menuItems.map((item) => (
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
            <button className="pf-foot-btn logout" onClick={() => { logout(); navigate('/'); }}>
              <LogoutIcon /><span>{t('logout')}</span>
            </button>
          </div>
        </div>

        {/* ─── CONTENT ─── */}
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

      {/* ─── DELETE CONFIRMATION DIALOG ─── */}
      {showDeleteModal && (
        <div className="pf-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="pf-modal-icon">⚠️</div>
            <h3>{t('deleteAccount')}?</h3>
            <p>{t('confirmDelete')}</p>
            <p style={{ marginBottom: '6px' }}>Type <strong>DELETE</strong> to confirm:</p>
            <input
              className="pf-modal-input"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="DELETE"
              autoFocus
            />
            <div className="pf-modal-actions">
              <button className="pf-btn-ghost" onClick={() => { setShowDeleteModal(false); setDeleteText(''); }} disabled={deleting}>
                {t('cancel')}
              </button>
              <button
                className="pf-btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteText !== 'DELETE' || deleting}
              >
                {deleting ? t('loading') : t('yesDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .pf-wrapper {
          background: var(--bg-color);
          color: var(--text-color);
          font-family: 'Montserrat', sans-serif;
          padding: 28px 16px 40px;
          display: flex;
          justify-content: center;
          transition: background 0.3s, color 0.3s;
        }
        .pf-container {
          display: flex;
          width: 100%;
          max-width: 1150px;
          min-height: 640px;
          background: var(--card-bg);
          border-radius: 24px;
          box-shadow: var(--shadow);
          overflow: hidden;
          border: 1px solid var(--border-color);
        }

        /* Sidebar */
        .pf-sidebar {
          width: 28%;
          min-width: 250px;
          background: #171A1D;
          padding: 28px 18px 22px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .pf-avatar-block {
          display: flex; flex-direction: column; align-items: center;
          padding-bottom: 24px; margin-bottom: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .pf-avatar-ring {
          position: relative; width: 100px; height: 100px; border-radius: 50%;
          padding: 3px; cursor: pointer;
          background: linear-gradient(135deg, #FF686B, #FF9B71);
          box-shadow: 0 8px 24px rgba(255,104,107,0.3);
        }
        .pf-avatar-circle {
          width: 100%; height: 100%; border-radius: 50%;
          background: #2A2F36; color: #fff;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .pf-avatar-circle img { width: 100%; height: 100%; object-fit: cover; }
        .pf-avatar-edit {
          position: absolute; right: 0; bottom: 2px; width: 26px; height: 26px; border-radius: 50%;
          background: #FF686B; color: #fff; font-size: 13px;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #171A1D;
        }
        .pf-avatar-name { margin-top: 14px; font-weight: 700; font-size: 17px; color: #F8FAFC; text-align: center; }
        .pf-avatar-email { font-size: 12.5px; color: #94A3B8; margin-top: 2px; word-break: break-all; text-align: center; }

        .pf-menu { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .pf-menu-item {
          position: relative;
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 12px;
          background: transparent; border: none; width: 100%; text-align: left;
          color: #94A3B8; font-family: inherit; font-weight: 500; font-size: 14.5px;
          cursor: pointer; transition: background 0.2s, color 0.2s;
        }
        .pf-menu-item:hover { background: rgba(255,255,255,0.06); color: #E2E8F0; }
        .pf-menu-item.active {
          background: rgba(255,104,107,0.14);
          color: #fff; font-weight: 600;
        }
        .pf-menu-item.active::before {
          content: ''; position: absolute; left: 0; top: 20%; bottom: 20%; width: 3px;
          border-radius: 0 3px 3px 0; background: linear-gradient(180deg, #FF686B, #FF9B71);
        }
        .pf-menu-item.danger.active { background: rgba(220,53,69,0.16); }
        .pf-menu-item.danger.active::before { background: #DC3545; }
        .pf-menu-icon {
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          transition: background 0.2s;
        }
        .pf-menu-icon svg { width: 17px; height: 17px; color: #94A3B8; }
        .pf-menu-item.active .pf-menu-icon { background: linear-gradient(135deg, #FF686B, #FF9B71); }
        .pf-menu-item.danger.active .pf-menu-icon { background: #DC3545; }
        .pf-menu-item.active .pf-menu-icon svg { color: #fff; }
        .pf-menu-label { flex: 1; }

        .pf-sidebar-footer { margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.07); display: grid; gap: 4px; }
        .pf-foot-btn {
          display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 12px;
          background: transparent; border: none; width: 100%; text-align: left;
          color: #94A3B8; font-family: inherit; font-weight: 500; font-size: 14px; cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .pf-foot-btn svg { width: 19px; height: 19px; }
        .pf-foot-btn:hover { background: rgba(255,255,255,0.06); color: #E2E8F0; }
        .pf-foot-btn.logout:hover { background: rgba(239,68,68,0.12); color: #F87171; }

        /* Content */
        .pf-content { flex: 1; padding: 32px 40px 40px; background: var(--card-bg-alt); overflow-y: auto; min-width: 0; }
        .pf-header { font-size: 24px; font-weight: 800; color: var(--text-color); margin-bottom: 4px; }
        .pf-sub {
          font-size: 14px; color: var(--muted-color); margin-bottom: 22px;
          padding-bottom: 14px; border-bottom: 1px solid var(--border-color);
        }
        .pf-card {
          background: var(--card-bg); border: 1px solid var(--border-color);
          border-radius: 18px; padding: 26px 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        /* Fields (all the same width) */
        .pf-field { margin-bottom: 18px; }
        .pf-field label { display: block; font-weight: 600; font-size: 13px; color: var(--text-color); margin-bottom: 6px; }
        .pf-field input, .pf-field select {
          display: block; width: 100%; max-width: 420px; height: 44px; box-sizing: border-box;
          padding: 0 14px; border: 1.5px solid var(--border-color); border-radius: 12px;
          font-family: inherit; font-size: 14px; outline: none;
          background: var(--input-bg); color: var(--text-color);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .pf-field input:focus, .pf-field select:focus {
          border-color: #FF686B; box-shadow: 0 0 0 3px rgba(255,104,107,0.15);
        }
        .pf-field input:disabled { opacity: 0.65; cursor: not-allowed; background: var(--card-bg-alt); }
        .pf-hint { display: block; margin-top: 5px; font-size: 12px; color: var(--muted-color); }

        /* Buttons */
        .pf-btn-primary, .pf-btn-danger, .pf-btn-ghost {
          height: 42px; padding: 0 26px; border-radius: 999px; font-family: inherit;
          font-weight: 600; font-size: 14px; cursor: pointer; border: none; transition: filter 0.2s, transform 0.2s;
        }
        .pf-btn-primary { background: linear-gradient(135deg, #FF686B, #FF9B71); color: #fff; box-shadow: 0 6px 16px rgba(255,104,107,0.28); }
        .pf-btn-primary:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); }
        .pf-btn-danger { background: #DC3545; color: #fff; }
        .pf-btn-danger:hover:not(:disabled) { background: #C12A39; }
        .pf-btn-ghost { background: transparent; color: var(--text-color); border: 1.5px solid var(--border-color); }
        .pf-btn-ghost:hover:not(:disabled) { background: var(--card-bg-alt); }
        .pf-btn-primary:disabled, .pf-btn-danger:disabled, .pf-btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

        .pf-warning {
          background: rgba(220,53,69,0.08); border: 1px solid rgba(220,53,69,0.3);
          border-radius: 14px; padding: 16px 20px; margin-bottom: 20px;
        }
        .pf-warning p { margin: 0; font-size: 14px; line-height: 1.6; color: #B42318; }

        /* Notices */
        .pf-notice {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px; border-radius: 12px; margin-bottom: 18px;
          font-size: 14px; font-weight: 600; animation: pfIn 0.25s ease;
        }
        .pf-notice.success { background: rgba(22,163,74,0.12); color: #166534; border: 1px solid rgba(22,163,74,0.35); }
        .pf-notice.error   { background: rgba(220,53,69,0.12); color: #B42318; border: 1px solid rgba(220,53,69,0.35); }
        .pf-notice-icon {
          width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 12px; color: #fff;
        }
        .pf-notice.success .pf-notice-icon { background: #16A34A; }
        .pf-notice.error .pf-notice-icon { background: #DC3545; }
        .pf-notice-close { background: none; border: none; font-size: 20px; line-height: 1; color: inherit; cursor: pointer; opacity: 0.6; }
        .pf-notice-close:hover { opacity: 1; }

        /* Modal */
        .pf-overlay {
          position: fixed; inset: 0; background: rgba(15,18,21,0.65); z-index: 400;
          display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .pf-modal {
          background: var(--card-bg); color: var(--text-color);
          width: 100%; max-width: 420px; border-radius: 20px; padding: 26px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.4); border: 1px solid var(--border-color);
          animation: pfIn 0.2s ease;
        }
        .pf-modal-icon { font-size: 2rem; margin-bottom: 4px; }
        .pf-modal h3 { margin: 0 0 8px; font-size: 1.25rem; font-weight: 800; }
        .pf-modal p { font-size: 14px; color: var(--muted-color); margin: 0 0 12px; line-height: 1.5; }
        .pf-modal-input {
          width: 100%; height: 42px; box-sizing: border-box; padding: 0 14px; border-radius: 10px;
          border: 1.5px solid var(--border-color); background: var(--input-bg); color: var(--text-color);
          font-family: inherit; font-size: 14px; outline: none; margin-bottom: 18px;
        }
        .pf-modal-input:focus { border-color: #DC3545; box-shadow: 0 0 0 3px rgba(220,53,69,0.15); }
        .pf-modal-actions { display: flex; justify-content: flex-end; gap: 10px; }

        .pf-fade { animation: pfIn 0.28s ease; }
        @keyframes pfIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 900px) {
          .pf-container { flex-direction: column; }
          .pf-sidebar { width: 100%; min-width: unset; padding: 20px 16px; }
          .pf-avatar-block { flex-direction: row; gap: 16px; flex-wrap: wrap; justify-content: flex-start; }
          .pf-avatar-ring { width: 72px; height: 72px; }
          .pf-avatar-name, .pf-avatar-email { text-align: left; margin-top: 0; }
          .pf-menu { flex-direction: row; flex-wrap: wrap; gap: 6px; }
          .pf-menu-item { padding: 8px 12px; font-size: 13px; width: auto; flex: 1 0 auto; }
          .pf-content { padding: 22px 16px; }
          .pf-card { padding: 20px 16px; }
        }
      `}</style>
    </div>
  );
}