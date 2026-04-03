import { CheckCircle2, AlertTriangle, XCircle, Lightbulb, Zap } from 'lucide-react';
import './CVFeedbackPanel.css';

export default function CVFeedbackPanel({ feedback, brutalMode = false }) {
  if (!feedback) return null;

  const { strengths = [], weaknesses = [], suggestions = [] } = feedback;

  return (
    <div className="cv-feedback-panel" id="cv-feedback-panel">
      {brutalMode && (
        <div className="feedback-brutal-banner">
          <Zap size={16} /> Brutal Honesty Mode
        </div>
      )}

      {strengths.length > 0 && (
        <div className="feedback-section">
          <h4 className="feedback-section-title feedback-strengths-title">
            <CheckCircle2 size={18} /> Strengths
          </h4>
          <ul className="feedback-list">
            {strengths.map((item, i) => (
              <li key={i} className="feedback-item feedback-strength">
                <span className="feedback-dot" style={{ background: 'var(--success)' }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {weaknesses.length > 0 && (
        <div className="feedback-section">
          <h4 className="feedback-section-title feedback-weaknesses-title">
            {brutalMode ? <XCircle size={18} /> : <AlertTriangle size={18} />}
            {brutalMode ? 'Hard Truths' : 'Areas to Improve'}
          </h4>
          <ul className="feedback-list">
            {weaknesses.map((item, i) => (
              <li key={i} className={`feedback-item feedback-weakness ${brutalMode ? 'brutal' : ''}`}>
                <span className="feedback-dot" style={{ background: brutalMode ? 'var(--danger)' : 'var(--warning)' }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="feedback-section">
          <h4 className="feedback-section-title feedback-suggestions-title">
            <Lightbulb size={18} /> Suggestions
          </h4>
          <ul className="feedback-list">
            {suggestions.map((item, i) => (
              <li key={i} className="feedback-item feedback-suggestion">
                <span className="feedback-dot" style={{ background: 'var(--primary)' }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
