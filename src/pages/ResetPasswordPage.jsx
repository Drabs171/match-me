import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Lock, CheckCircle, KeyRound, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './AuthPage.css';
import './ResetPasswordPage.css';

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase puts the recovery token in the URL hash and fires an
  // SIGNED_IN / PASSWORD_RECOVERY auth event — wait for it before
  // allowing the form to submit.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionReady(true);
      }
    });

    // Also handle the case where the session is already established
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await updatePassword(password);
    setIsSubmitting(false);

    if (result.success) {
      setDone(true);
      // Auto-redirect to dashboard after 3 seconds
      setTimeout(() => navigate('/dashboard'), 3000);
    } else {
      setError(result.error || 'Failed to update password. The link may have expired — please request a new one.');
    }
  }

  // Success state
  if (done) {
    return (
      <main className="auth-page reset-page" id="reset-password-page">
        <div className="auth-container auth-container-single">
          <div className="auth-form-panel" style={{ width: '100%' }}>
            <div className="auth-form-wrapper" style={{ textAlign: 'center' }}>
              <div className="auth-success-icon">
                <CheckCircle size={36} />
              </div>
              <h2 style={{ marginTop: '20px' }}>Password updated!</h2>
              <p style={{ marginTop: '12px', fontSize: '0.95rem', lineHeight: 1.7 }}>
                Your password has been changed successfully. Redirecting you to the dashboard…
              </p>
              <button
                className="btn btn-primary auth-submit"
                style={{ marginTop: '24px' }}
                onClick={() => navigate('/dashboard')}
                id="go-to-dashboard-btn"
              >
                Go to Dashboard <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page reset-page" id="reset-password-page">
      <div className="auth-container auth-container-single">
        <div className="auth-form-panel" style={{ width: '100%' }}>
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <div className="auth-icon-badge">
                <KeyRound size={22} />
              </div>
              <h2>Set a new password</h2>
              <p>Choose a strong password for your Match Me! account.</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" id="reset-password-form">
              <div className="form-group">
                <label htmlFor="new-password"><Lock size={15} /> New Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  autoFocus
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password"><Lock size={15} /> Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
                />
              </div>

              {/* Strength hint */}
              {password.length > 0 && (
                <div className="reset-strength">
                  <div className="reset-strength-bar">
                    <div
                      className={`reset-strength-fill ${
                        password.length >= 12 ? 'strong' : password.length >= 8 ? 'medium' : 'weak'
                      }`}
                      style={{
                        width: password.length >= 12 ? '100%' : password.length >= 8 ? '66%' : '33%'
                      }}
                    />
                  </div>
                  <span className="reset-strength-label">
                    {password.length >= 12 ? '💪 Strong' : password.length >= 8 ? '🆗 Medium' : '⚠️ Weak'}
                  </span>
                </div>
              )}

              {error && <div className="auth-error" id="reset-error">{error}</div>}

              {!sessionReady && (
                <div className="auth-error" style={{ background: 'var(--warning-light)', borderColor: 'var(--warning)', color: '#92400e' }}>
                  Waiting for your reset link to be verified… if this takes more than a few seconds, try clicking the link in your email again.
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary auth-submit"
                id="reset-submit-btn"
                disabled={isSubmitting || !sessionReady}
              >
                {isSubmitting ? 'Updating…' : <><Lock size={15} /> Update Password</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
