import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './PrivacyConsentBanner.css';

const CONSENT_KEY = 'match_me_privacy_accepted';

export default function PrivacyConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(CONSENT_KEY);
    if (!accepted) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setExiting(true);
    setTimeout(() => {
      localStorage.setItem(CONSENT_KEY, 'true');
      setVisible(false);
      setExiting(false);
    }, 350);
  };

  if (!visible) return null;

  return (
    <>
      <div className={`privacy-overlay ${exiting ? 'exiting' : ''}`} />
      <div
        className={`privacy-consent-banner ${exiting ? 'exiting' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        aria-describedby="consent-desc"
      >
        {/* Icon */}
        <div className="consent-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        {/* Content */}
        <div className="consent-content">
          <h2 id="consent-title">Your Privacy Matters</h2>
          <p id="consent-desc">
            Welcome to <strong>Match Me!</strong> Before you get started, please take a moment to
            review how we handle your data. We use your CV and profile information solely to
            match you with relevant job opportunities and personalise your interview experience.
          </p>
          <p className="consent-note">
            By continuing, you agree to our{' '}
            <Link to="/privacy" className="consent-link" onClick={handleAccept}>
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        {/* Actions */}
        <div className="consent-actions">
          <Link
            to="/privacy"
            className="btn btn-secondary btn-sm consent-learn-btn"
            id="consent-read-policy-btn"
            onClick={handleAccept}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Read Policy
          </Link>
          <button
            id="consent-accept-btn"
            className="btn btn-primary btn-sm"
            onClick={handleAccept}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Got it, let's go!
          </button>
        </div>
      </div>
    </>
  );
}
