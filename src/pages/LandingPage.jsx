import { useNavigate } from 'react-router-dom';
import { ArrowRight, Target, Brain, TrendingUp, Shield, Zap, Upload } from 'lucide-react';
import { useAuth } from '../AuthContext';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const ctaTarget = user ? '/dashboard' : '/signup';

  const features = [
    {
      icon: <Target size={24} />,
      title: 'Smart Job Matching',
      desc: 'Your skills are analyzed against thousands of jobs to find your strongest matches.',
    },
    {
      icon: <Brain size={24} />,
      title: 'CV Intelligence',
      desc: 'Get brutally honest feedback on what\'s working and what\'s holding you back.',
    },
    {
      icon: <TrendingUp size={24} />,
      title: 'Score & Improve',
      desc: 'See your match score, get tailored bullet rewrites, and boost it instantly.',
    },
  ];

  const stats = [
    { value: 'Instant', label: 'CV Analysis' },
    { value: 'Real', label: 'Job Matches' },
    { value: 'Free', label: 'To Try' },
  ];

  return (
    <main className="landing" id="landing-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-content">

          <h1 className="hero-title animate-fade-in-up delay-1">
            Stop guessing if<br />you're <span className="hero-highlight">qualified.</span>
          </h1>
          <p className="hero-subtitle animate-fade-in-up delay-2">
            Upload your CV and instantly see which jobs you actually match,
            what's missing, and exactly how to fix it.
          </p>
          <div className="hero-actions animate-fade-in-up delay-3">
            <button className="btn btn-primary btn-lg" onClick={() => navigate(ctaTarget)}>
              <Upload size={18} /> Upload Your CV
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              See How It Works
            </button>
          </div>
          <div className="hero-stats animate-fade-in-up delay-4">
            {stats.map((stat, i) => (
              <div key={i} className="hero-stat">
                <span className="hero-stat-value">{stat.value}</span>
                <span className="hero-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section features-section" id="features">
        <div className="container">
          <div className="section-header animate-fade-in-up">
            <h2>One upload. Complete clarity.</h2>
            <p>See exactly where you stand for every role that matters to you.</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className={`feature-card card card-hover animate-fade-in-up delay-${i + 1}`}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section how-section">
        <div className="container">
          <div className="section-header animate-fade-in-up">
            <h2>How it works</h2>
            <p>Three steps to career clarity.</p>
          </div>
          <div className="steps-grid">
            <div className="step animate-fade-in-up delay-1">
              <div className="step-number">1</div>
              <h4>Upload Your CV</h4>
              <p>Drop your PDF or DOCX — we read it in seconds.</p>
            </div>
            <div className="step-connector" />
            <div className="step animate-fade-in-up delay-2">
              <div className="step-number">2</div>
              <h4>Get Matched</h4>
              <p>Your skills are compared against real job postings and every match is scored.</p>
            </div>
            <div className="step-connector" />
            <div className="step animate-fade-in-up delay-3">
              <div className="step-number">3</div>
              <h4>Improve & Apply</h4>
              <p>See what's missing, get tailored CV rewrites, and apply with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="section diff-section">
        <div className="container">
          <div className="section-header animate-fade-in-up">
            <h2>Not your typical career tool.</h2>
            <p>We tell you what others won't.</p>
          </div>
          <div className="diff-grid">
            <div className="diff-card card animate-fade-in-up delay-1">
              <Zap size={20} className="diff-icon" />
              <h4>Brutal Honesty Mode</h4>
              <p>"You are NOT competitive for this role. Here's why." People actually want the hard truth.</p>
            </div>
            <div className="diff-card card animate-fade-in-up delay-2">
              <Shield size={20} className="diff-icon" />
              <h4>"Fix My CV" for THIS Job</h4>
              <p>Click any job and get your CV rewritten specifically for that role. Tailored, not generic.</p>
            </div>
            <div className="diff-card card animate-fade-in-up delay-3">
              <TrendingUp size={20} className="diff-icon" />
              <h4>Real-Time Score Updates</h4>
              <p>Edit your CV and watch your match scores change live. Iterate until you're the top candidate.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-block animate-fade-in-up">
            <h2>Ready to see how you <span className="hero-highlight">really</span> stack up?</h2>
            <p>It takes less than a minute. No signup required.</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate(ctaTarget)}>
              <Upload size={18} /> Analyze My CV Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <span className="footer-brand">Match Me!</span>
          <span className="footer-copy">© 2026 Match Me!</span>
        </div>
      </footer>
    </main>
  );
}
