import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Mail, Lock, User, ArrowRight, Sparkles, Shield, Target, Zap } from 'lucide-react';
import './AuthPage.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup, login } = useAuth();
  const navigate = useNavigate();

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
      result = login(email.trim(), password);
    } else {
      result = signup(name.trim(), email.trim(), password);
    }

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setIsSubmitting(false);
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
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
