import { useEffect, useRef, useState } from 'react';
import './MatchScoreCircle.css';

export default function MatchScoreCircle({ score = 0, size = 160, label = 'Match Score' }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const circleRef = useRef(null);

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;

  const getColor = (s) => {
    if (s >= 80) return { main: '#10B981', bg: '#D1FAE5', label: 'Strong Fit' };
    if (s >= 60) return { main: '#F59E0B', bg: '#FEF3C7', label: 'Reach' };
    return { main: '#EF4444', bg: '#FEE2E2', label: 'Low Match' };
  };

  const colorData = getColor(score);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="match-score-circle" id="match-score-circle">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={`scoreGrad-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorData.main} />
            <stop offset="100%" stopColor={colorData.main} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorData.bg}
          strokeWidth="10"
        />
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#scoreGrad-${score})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
        />
      </svg>
      <div className="match-score-label">
        <span className="match-score-number" style={{ color: colorData.main }}>
          {animatedScore}%
        </span>
        <span className="match-score-text">{label}</span>
        <span className="match-score-badge" style={{ background: colorData.bg, color: colorData.main }}>
          {colorData.label}
        </span>
      </div>
    </div>
  );
}
