import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Mail, Lock, User, ArrowRight, Sparkles, Shield, Target, Zap, ArrowLeft, KeyRound } from 'lucide-react';
import './AuthPage.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [view, setView] = useState('auth'); // 'auth' | 'forgot' | 'forgot-sent'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const { signup, login, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      setIsSubmitting(false);
      return;
    }

    if (!isLogin && !name.trim()) {
      setError('Please enter your name.');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsSubmitting(false);
      return;
    }

    // Simulate brief loading
    await new Promise(r => setTimeout(r, 600));

    let result;
    if (isLogin) {
      result = await login(email.trim(), password);
    } else {
      result = await signup(name.trim(), email.trim(), password);
    }

    if (result.success) {
      if (result.requiresEmailConfirmation) {
        setEmailSent(true);
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error || 'An unexpected error occurred.');
    }

    setIsSubmitting(false);
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }
    setForgotSubmitting(true);
    const result = await resetPassword(forgotEmail.trim());
    setForgotSubmitting(false);
    if (result.success) {
      setView('forgot-sent');
    } else {
      setForgotError(result.error || 'Something went wrong. Please try again.');
    }
  }

  // ── Forgot password: email form ──
  if (view === 'forgot') {
    return (
      <main className="auth-page" id="auth-page">
        <div className="auth-container auth-container-single">
          <div className="auth-form-panel" style={{ width: '100%' }}>
            <div className="auth-form-wrapper">
              <div className="auth-form-header">
                <div className="auth-icon-badge">
                  <KeyRound size={22} />
                </div>
                <h2>Reset your password</h2>
                <p>Enter the email you signed up with and we'll send you a reset link.</p>
              </div>

              <form onSubmit={handleForgotPassword} className="auth-form" id="forgot-password-form">
                <div className="form-group">
                  <label htmlFor="forgot-email"><Mail size={15} /> Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus
                    autoComplete="email"
                  />
                </div>

                {forgotError && <div className="auth-error" id="forgot-error">{forgotError}</div>}

                <button
                  type="submit"
                  className="btn btn-primary auth-submit"
                  id="forgot-submit-btn"
                  disabled={forgotSubmitting}
                >
                  {forgotSubmitting ? 'Sending...' : <><Mail size={15} /> Send Reset Link</>}
                </button>
              </form>

              <div className="auth-switch" style={{ marginTop: '1.2rem' }}>
                <button
                  type="button"
                  className="auth-switch-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => { setView('auth'); setIsLogin(true); setForgotError(''); }}
                >
                  <ArrowLeft size={13} /> Back to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Forgot password: confirmation ──
  if (view === 'forgot-sent') {
    return (
      <main className="auth-page" id="auth-page">
        <div className="auth-container auth-container-single">
          <div className="auth-form-panel" style={{ width: '100%' }}>
            <div className="auth-form-wrapper" style={{ textAlign: 'center' }}>
              <div className="auth-success-icon">
                <Mail size={32} />
              </div>
              <h2 style={{ marginTop: '20px' }}>Check your inbox</h2>
              <p style={{ marginTop: '12px', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                We sent a password reset link to <strong>{forgotEmail}</strong>.
                Click the link in the email to set a new password.
              </p>
              <p style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Didn't receive it? Check your spam folder, or{' '}
                <button
                  className="auth-switch-btn"
                  onClick={() => setView('forgot')}
                >
                  try again
                </button>
                .
              </p>
              <button
                className="btn btn-secondary auth-submit"
                style={{ marginTop: '24px' }}
                onClick={() => { setView('auth'); setIsLogin(true); }}
                id="back-to-login-btn"
              >
                <ArrowLeft size={15} /> Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }
    return (
      <main className="auth-page" id="auth-page">
        <div className="auth-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
          <Sparkles size={48} style={{ color: 'var(--primary)' }} />
          <h2 style={{ marginTop: '24px' }}>Check Your Email</h2>
          <p style={{ marginTop: '12px', fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
            We sent a verification link to <strong>{email}</strong>. Click it to verify your account and access your dashboard.
          </p>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '24px' }}
            onClick={() => setEmailSent(false)}
          >
            ← Back to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page" id="auth-page">
      <div className="auth-container">
        {/* Left: Branding Panel */}
        <div className="auth-branding">
          <div className="auth-branding-content">
            <h1>
              <Sparkles size={32} />
              Match Me!
            </h1>
            <p className="auth-tagline">Career intelligence that tells you the truth.</p>

            <div className="auth-features">
              <div className="auth-feature">
                <div className="auth-feature-icon"><Target size={20} /></div>
                <div>
                  <h4>Smart Matching</h4>
                  <p>See exactly which jobs fit your skills</p>
                </div>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon"><Zap size={20} /></div>
                <div>
                  <h4>Brutal Honesty</h4>
                  <p>Get real feedback, not generic advice</p>
                </div>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon"><Shield size={20} /></div>
                <div>
                  <h4>Interview Coach</h4>
                  <p>Practice with interview simulations that challenge you</p>
                </div>
              </div>
            </div>

            <p className="auth-footer-text">Join thousands of professionals who stopped guessing.</p>
          </div>
        </div>

        {/* Right: Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
              <p>{isLogin ? 'Sign in to access your career dashboard' : 'Start your career analysis'}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" id="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="auth-name"><User size={15} /> Full Name</label>
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="auth-email"><Mail size={15} /> Email</label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="auth-password"><Lock size={15} /> Password</label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </div>

              {error && (
                <div className="auth-error" id="auth-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={isSubmitting}
                id="auth-submit-btn"
              >
                {isSubmitting ? (
                  <span className="auth-loading">Processing...</span>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

              <div className="auth-switch">
                <p>
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                  <button
                    type="button"
                    className="auth-switch-btn"
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
                {isLogin && (
                  <p style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      className="auth-switch-btn"
                      id="forgot-password-link"
                      onClick={() => { setView('forgot'); setForgotEmail(email); setForgotError(''); }}
                    >
                      Forgot your password?
                    </button>
                  </p>
                )}
              </div>
          </div>
        </div>
      </div>
    </main>
  );
}
