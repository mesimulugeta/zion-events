import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { formatEventDate } from '../utils/formatDate';
import api from '../api/axios';
import '../styles/theme.css';

const GRADIENT = 'linear-gradient(135deg, #FF686B, #FF9B71)';

const PersonIcon = ({ size = 32, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="30" r="17" fill={color} />
    <path d="M44 34 Q50 39 56 34" stroke="rgba(255,255,255,0.35)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <circle cx="43" cy="28" r="2.2" fill="rgba(255,255,255,0.40)" />
    <circle cx="57" cy="28" r="2.2" fill="rgba(255,255,255,0.40)" />
    <path d="M18 94 Q24 58 50 58 Q76 58 82 94" fill={color} />
    <path d="M44 56 Q50 62 56 56" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

function NavBtn({ children, onClick, variant = 'ghost', active = false }) {
  const [hover, setHover] = useState(false);

  const base = {
    height: '34px',
    padding: '0 1.1rem',
    borderRadius: '999px',
    fontSize: '0.85rem',
    fontWeight: 600,
    fontFamily: 'inherit',
    lineHeight: 1,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
  };

  const style = variant === 'primary'
    ? {
        ...base,
        background: GRADIENT,
        color: '#fff',
        border: 'none',
        boxShadow: hover ? '0 6px 16px rgba(255,104,107,0.5)' : '0 3px 10px rgba(255,104,107,0.3)',
        transform: hover ? 'translateY(-1px)' : 'none',
      }
    : {
        ...base,
        background: active || hover ? 'rgba(255,255,255,0.10)' : 'transparent',
        color: '#fff',
        border: `1px solid ${active || hover ? 'rgba(255,155,113,0.85)' : 'rgba(255,255,255,0.28)'}`,
      };

  return (
    <button
      onClick={onClick}
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </button>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = usePreferences();
  const navigate = useNavigate();
  const location = useLocation();
  const [profilePicUrl, setProfilePicUrl] = useState(null);

  const path = location.pathname;
  const onLoginPage = path === '/login';
  const onRegisterPage = path === '/register';

  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    api.get('/api/profile')
      .then(res => setProfilePicUrl(res.data.profilePicUrl))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('authToken');
    navigate('/');
    window.location.reload();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setSearching(true);
    setSearched(false);
    try {
      const res = await api.get(`/api/events/search?keyword=${encodeURIComponent(keyword)}`);
      setResults(res.data);
      setSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleResultClick = (eventId) => {
    setSearchOpen(false);
    setKeyword('');
    setResults([]);
    setSearched(false);
    if (!user) {
      navigate('/login');
    } else {
      navigate(`/events/${eventId}/seats`);
    }
  };

  const avatarStyle = {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    cursor: 'pointer',
    border: '2px solid #FF686B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#2A2F36',
    color: 'white',
    overflow: 'hidden',
    flexShrink: 0,
  };

    const renderSearch = () => (
    <div ref={searchRef} style={{ position: 'relative' }}>
      <button
        onClick={() => { setSearchOpen(o => !o); setKeyword(''); setResults([]); setSearched(false); }}
        style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: searchOpen ? 'rgba(255,104,107,0.25)' : 'transparent',
          border: `1px solid ${searchOpen ? 'rgba(255,155,113,0.85)' : 'rgba(255,255,255,0.28)'}`,
          color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        title={t('searchInputPlaceholder')}
      >
        <SearchIcon />
      </button>

      {searchOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          width: 'min(340px, 90vw)',
          background: 'var(--card-bg, #fff)',
          borderRadius: '16px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
          border: '1px solid var(--border-color, #e2e8f0)',
          zIndex: 200,
          overflow: 'hidden',
        }}>
          <form onSubmit={handleSearch} style={{
            display: 'flex', gap: '8px', padding: '12px 14px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
          }}>
            <input
              autoFocus
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t('searchInputPlaceholder')}
              style={{
                flex: 1, padding: '8px 12px',
                borderRadius: '10px',
                border: '1.5px solid var(--border-color, #e2e8f0)',
                background: 'var(--input-bg, #fff)',
                color: 'var(--text-color, #172033)',
                fontSize: '14px', outline: 'none',
              }}
            />
            <button type="submit" style={{
              background: GRADIENT,
              color: 'white', border: 'none', borderRadius: '10px',
              padding: '8px 14px', cursor: searching ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: 600,
              opacity: searching ? 0.7 : 1,
            }}>
              {searching ? '...' : 'Go'}
            </button>
          </form>

          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {searched && results.length === 0 && (
              <div style={{
                padding: '20px 16px', textAlign: 'center',
                color: 'var(--text-color, #172033)', opacity: 0.6, fontSize: '14px',
              }}>
                {t('noEvents')}
              </div>
            )}
            {results.map((event, i) => (
              <div
                key={event.id}
                onClick={() => handleResultClick(event.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: i < results.length - 1 ? '1px solid var(--border-color, #e2e8f0)' : 'none',
                  cursor: 'pointer',
                  background: 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card-bg-alt, #f8fafc)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-color, #172033)', marginBottom: '3px' }}>
                  {event.title}
                </div>
                <div style={{
                  fontSize: '12px', color: 'var(--text-color, #172033)',
                  opacity: 0.7, display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
                }}>
                  <span>📅 {formatEventDate(event.startAt)}</span>
                  <span>🪑 {event.availableSeats} {t('seatsLeft')}</span>
                  <span style={{
                    padding: '1px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 600,
                    background: event.status === 'ACTIVE' ? '#d4edda' : '#f8d7da',
                    color: event.status === 'ACTIVE' ? '#155724' : '#721c24',
                  }}>
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.5rem 1.5rem',
      backgroundColor: 'rgba(23,26,29,0.96)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      color: 'white',
      backdropFilter: 'blur(6px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div
        style={{
          fontSize: '1.45rem',
          fontFamily: 'Pacifico, cursive',
          letterSpacing: '0.5px',
          cursor: 'pointer',
          lineHeight: 1.2,
        }}
        onClick={() => navigate('/')}
      >
        {t('appName')}
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {user ? (
          <>
            {renderSearch()}

            <div
              style={avatarStyle}
              onClick={() => navigate(user.role === 'ADMIN' ? '/admin/profile' : '/profile')}
              title={t('profile')}
            >
              {profilePicUrl ? (
                <img src={profilePicUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <PersonIcon size={32} color="#fff" />
              )}
            </div>

            {user.role === 'USER' && (
              <NavBtn onClick={() => navigate('/reservations/my')} active={path.startsWith('/reservations')}>
                {t('myReservations')}
              </NavBtn>
            )}
            {user.role === 'ADMIN' && (
              <>
                <NavBtn onClick={() => navigate('/admin/reservations')} active={path === '/admin/reservations'}>
                  {t('allReservations')}
                </NavBtn>
                <NavBtn onClick={() => navigate('/admin/events/new')} active={path === '/admin/events/new'}>
                  {t('createEvent')}
                </NavBtn>
              </>
            )}
            <NavBtn onClick={handleLogout}>{t('logout')}</NavBtn>
          </>
        ) : (
          <>
            {!onLoginPage && <NavBtn onClick={() => navigate('/login')}>{t('login')}</NavBtn>}
            {!onRegisterPage && (
              <NavBtn onClick={() => navigate('/register')} variant="primary">{t('signUp')}</NavBtn>
            )}
          </>
        )}
      </div>
    </div>
  );
}