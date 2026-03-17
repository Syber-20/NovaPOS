import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Baby, Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Signup() {
  console.log("Signup Page Rendering...");
  const { signup } = useApp();
  const navigate = useNavigate();

  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [pin,        setPin]        = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin,    setShowPin]    = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (pin.length < 4) {
      return setError('PIN must be at least 4 digits.');
    }
    if (pin !== confirmPin) {
      return setError('PINs do not match.');
    }

    setLoading(true);
    try {
      const result = await signup(name, email, pin);
      if (result && result.ok) {
        navigate('/');
      } else {
        setError(result?.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon" style={{ width: 48, height: 48 }}>
            <Baby size={24} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.1 }}>Nova POS</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Create your account</p>
          </div>
        </div>

        <div>
          <h2 style={{ textAlign: 'center', marginBottom: '0.25rem' }}>Get Started</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Set up your store profile
          </p>
        </div>

        {error && (
          <div className="alert-banner danger">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="input"
              placeholder="John Doe"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label htmlFor="pin">PIN (4-6 digits)</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="pin"
                  type={showPin ? 'text' : 'password'}
                  className="input"
                  placeholder="PIN"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  required
                  maxLength={6}
                  inputMode="numeric"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(v => !v)}
                  style={{
                    position: 'absolute', right: '0.5rem', top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--text-muted)', display: 'flex',
                  }}
                >
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmPin">Confirm PIN</label>
              <input
                id="confirmPin"
                type={showPin ? 'text' : 'password'}
                className="input"
                placeholder="Confirm"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                required
                maxLength={6}
                inputMode="numeric"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Creating account…' : <><UserPlus size={17} /> Create Account</>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </div>

        <Link to="/login" style={{ 
          display: 'flex', alignItems: 'center', gap: '0.5rem', 
          justifyContent: 'center', marginTop: '1rem', 
          fontSize: '0.85rem', color: 'var(--text-muted)',
          textDecoration: 'none'
        }}>
          <ArrowLeft size={14} /> Back to login
        </Link>
      </div>
    </div>
  );
}
