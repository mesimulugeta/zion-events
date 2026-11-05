import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function ResetPassword() {
    const { login } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [username] = useState(location.state?.username || '');
    const [step, setStep] = useState('verify'); // 'verify' or 'reset'
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 6) errors.push('At least 6 characters long.');
        if (!/[a-zA-Z]/.test(password)) errors.push('At least one letter (a-z or A-Z).');
        if (!/\d/.test(password)) errors.push('At least one number (0-9).');
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password))
            errors.push('At least one special character (!@#$%^&* etc.)');
        return errors;
    };

    const handlePasswordChange = (e) => {
        const pwd = e.target.value;
        setNewPassword(pwd);
        setPasswordErrors(validatePassword(pwd));
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const res = await api.post('/api/auth/verify-reset-code', { username, code });
            setMessage(res.data.message);
            setStep('reset');
            setError('');
        } catch (err) {
            const errMsg = err.response?.data?.error;
            if (errMsg && errMsg.includes('expired')) {
                setError('The reset code has expired. Please request a new one from the login page.');
            } else if (errMsg && errMsg.includes('Invalid')) {
                setError('The reset code you entered is incorrect. Please check and try again.');
            } else {
                setError(errMsg || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match. Please type the same password in both fields.');
            return;
        }
        if (passwordErrors.length > 0) {
            setError('Please fix the password issues listed below.');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');
        try {
            await api.post('/api/auth/reset-password', { username, code, newPassword });

            // Auto-login
            const loginRes = await api.post('/api/auth/login', { username, password: newPassword });
            const data = loginRes.data;
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('username', data.username);
            sessionStorage.setItem('email', data.email);
            sessionStorage.setItem('role', data.role);
            login(data, false);
            navigate('/');
        } catch (err) {
            const errMsg = err.response?.data?.error;
            if (errMsg && errMsg.includes('expired')) {
                setError('The reset code has expired. Please request a new one from the login page.');
            } else if (errMsg && errMsg.includes('Invalid')) {
                setError('Invalid reset code. Please request a new one.');
            } else if (errMsg && errMsg.includes('password')) {
                setError(errMsg);
            } else {
                setError(errMsg || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const EyeIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );

    const EyeSlashIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );

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
                padding: '2.5rem',
                width: '100%',
                maxWidth: '450px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}>
                <h2 style={{ color: '#0097a7', textAlign: 'center', marginBottom: '8px' }}>
                    {step === 'verify' ? 'Verify Reset Code' : 'Set New Password'}
                </h2>
                <p style={{ textAlign: 'center', color: '#555', marginBottom: '24px' }}>
                    {step === 'verify'
                        ? 'Enter the 6‑digit code sent to your email.'
                        : 'Choose a strong password.'}
                </p>

                {message && (
                    <div style={{ background: '#d4edda', color: '#155724', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
                        {message}
                    </div>
                )}
                {error && (
                    <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {step === 'verify' ? (
                    <form onSubmit={handleVerifyCode}>
                        <div className="mb-3">
                            <label className="form-label">Username</label>
                            <input type="text" className="form-control" value={username} disabled />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Reset Code</label>
                            <input type="text" className="form-control"
                                value={code} onChange={(e) => setCode(e.target.value)}
                                required placeholder="6-digit code" />
                        </div>
                        <button type="submit" disabled={loading} style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #00acc1, #007c8a)',
                            color: 'white', borderRadius: '30px', border: 'none',
                            padding: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem',
                        }}>
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <div className="mb-3">
                            <label className="form-label">New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? 'text' : 'password'}
                                    className="form-control" value={newPassword}
                                    onChange={handlePasswordChange} required placeholder="New password" />
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
                                        color: '#6c757d',
                                    }}
                                >
                                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                </button>
                            </div>
                            {passwordErrors.length > 0 && (
                                <div style={{ fontSize: '0.85rem', color: '#dc3545', marginTop: '4px' }}>
                                    Password must contain:
                                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                        {passwordErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showConfirmPassword ? 'text' : 'password'}
                                    className="form-control" value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required placeholder="Confirm your password" />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                        color: '#6c757d',
                                    }}
                                >
                                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #00acc1, #007c8a)',
                            color: 'white', borderRadius: '30px', border: 'none',
                            padding: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem',
                        }}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}
                <p style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Link to="/login" style={{ color: '#0097a7' }}>Back to Login</Link>
                </p>
            </div>
        </div>
    );
}