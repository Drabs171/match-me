import { useState, useCallback } from 'react';
import {
  Search, SlidersHorizontal, Zap, ZapOff, ChevronDown, ChevronUp,
  MapPin, DollarSign, Briefcase, Sparkles, ArrowRight, RefreshCw
} from 'lucide-react';
import FileUpload from '../components/FileUpload';
import MatchScoreCircle from '../components/MatchScoreCircle';
import SkillTag from '../components/SkillTag';
import CVFeedbackPanel from '../components/CVFeedbackPanel';
import JobCard from '../components/JobCard';
import { mockResumeAnalysis, mockJobs } from '../mockData';
import './DashboardPage.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jobs, setJobs] = useState([]);
  const [brutalMode, setBrutalMode] = useState(false);
  const [sortBy, setSortBy] = useState('match');
  const [jobPage, setJobPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search refinement
  const [showFilters, setShowFilters] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchPayRange, setSearchPayRange] = useState('');
  const [searchSpecialization, setSearchSpecialization] = useState('');

  const hasFilters = searchLocation || searchPayRange || searchSpecialization;

  const handleFileAccepted = useCallback(async (file) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setResumeText(data.resumeText || '');
        setResumeData(data);

        // Build job search params — CV-aware + optional filters
        const jobSearchBody = {
          role: searchSpecialization || '',
          location: searchLocation || 'Remote',
          resumeData: data,
          resumeText: data.resumeText || '',
        };

        const jobRes = await fetch(`${API_BASE}/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jobSearchBody),
        });
        if (jobRes.ok) {
          const jobData = await jobRes.json();
          const matchRes = await fetch(`${API_BASE}/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume: data, jobs: jobData.jobs }),
          });
          if (matchRes.ok) {
            const matchData = await matchRes.json();
            setJobs(matchData.jobs);
          } else {
            setJobs(mockJobs);
          }
        } else {
          setJobs(mockJobs);
        }
      } else {
        setResumeData(mockResumeAnalysis);
        setJobs(mockJobs);
      }
    } catch (err) {
      console.log('Using mock data (API unavailable):', err.message);
      await new Promise((r) => setTimeout(r, 2000));
      setResumeData(mockResumeAnalysis);
      setJobs(mockJobs);
    } finally {
      setIsLoading(false);
      setJobPage(1); // Reset page on new upload
    }
  }, [searchLocation, searchSpecialization]);

  const handleRefreshJobs = async () => {
    if (!resumeData || isRefreshing) return;
    setIsRefreshing(true);
    
    const nextPage = jobPage + 1;
    
    try {
      const jobSearchBody = {
        role: searchSpecialization || '',
        location: searchLocation || 'Remote',
        resumeData: resumeData,
        resumeText: resumeText || '',
        page: nextPage
      };

      const jobRes = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobSearchBody),
      });

      if (jobRes.ok) {
        const jobData = await jobRes.json();
        // Dynamically score the newly fetched jobs
        const matchRes = await fetch(`${API_BASE}/match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume: resumeData, jobs: jobData.jobs }),
        });
        
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          setJobs(matchData.jobs);
          setJobPage(nextPage);
        }
      }
    } catch (err) {
      console.error('Failed to refresh jobs:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'match') return b.matchScore - a.matchScore;
    return 0;
  });

  const strongFit = jobs.filter((j) => j.matchScore >= 80).length;
  const reach = jobs.filter((j) => j.matchScore >= 60 && j.matchScore < 80).length;
  const lowMatch = jobs.filter((j) => j.matchScore < 60).length;

  return (
    <main className="dashboard" id="dashboard-page">
      <div className="container">
        {!resumeData && !isLoading ? (
          /* ── Upload State ── */
          <div className="upload-hero animate-fade-in-up">
            {/* Hero Section */}
            <div className="hero-text">
              <h2>Your Career Dashboard</h2>
              <p className="hero-subtitle">
                Upload your CV and we'll <strong>automatically find jobs</strong> that match
                your skills, experience, and career level.
              </p>
            </div>

            {/* Upload Card */}
            <div className="upload-card card card-elevated">
              <div className="upload-card-header">
                <Sparkles size={18} />
                <span>Drop your CV — we'll handle the rest</span>
              </div>
              <FileUpload onFileAccepted={handleFileAccepted} isLoading={isLoading} />
              <p className="upload-hint">
                We analyze your CV to find the best-matching jobs for you. No search needed.
              </p>
            </div>

            {/* Optional Filters */}
            <div className="refine-section">
              <button
                className={`refine-toggle ${showFilters ? 'open' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal size={15} />
                <span>Looking for something specific?</span>
                {hasFilters && <span className="filter-active-dot" />}
                {showFilters ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {showFilters && (
                <div className="refine-form card card-elevated animate-fade-in-up">
                  <p className="refine-note">
                    These are optional — your CV already drives the search. Use these to narrow results.
                  </p>

                  <div className="refine-fields">
                    <div className="refine-field">
                      <label htmlFor="filter-location">
                        <MapPin size={14} /> Location
                      </label>
                      <input
                        id="filter-location"
                        type="text"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        placeholder="e.g. Remote, New York, London"
                      />
                    </div>

                    <div className="refine-field">
                      <label htmlFor="filter-pay">
                        <DollarSign size={14} /> Pay Range
                      </label>
                      <select
                        id="filter-pay"
                        value={searchPayRange}
                        onChange={(e) => setSearchPayRange(e.target.value)}
                      >
                        <option value="">Any salary</option>
                        <option value="0-50k">Under $50k</option>
                        <option value="50k-80k">$50k – $80k</option>
                        <option value="80k-120k">$80k – $120k</option>
                        <option value="120k-180k">$120k – $180k</option>
                        <option value="180k+">$180k+</option>
                      </select>
                    </div>

                    <div className="refine-field">
                      <label htmlFor="filter-specialization">
                        <Briefcase size={14} /> Specialization
                      </label>
                      <input
                        id="filter-specialization"
                        type="text"
                        value={searchSpecialization}
                        onChange={(e) => setSearchSpecialization(e.target.value)}
                        placeholder="e.g. Dam Design, React, Data Science"
                      />
                    </div>
                  </div>

                  {hasFilters && (
                    <div className="refine-active">
                      <span className="refine-active-label">Active filters:</span>
                      {searchLocation && <span className="filter-tag"><MapPin size={11} /> {searchLocation}</span>}
                      {searchPayRange && <span className="filter-tag"><DollarSign size={11} /> {searchPayRange}</span>}
                      {searchSpecialization && <span className="filter-tag"><Briefcase size={11} /> {searchSpecialization}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* How It Works */}
            <div className="how-it-works">
              <div className="how-step">
                <div className="how-step-num">1</div>
                <span>Upload CV</span>
              </div>
              <ArrowRight size={16} className="how-arrow" />
              <div className="how-step">
                <div className="how-step-num">2</div>
                <span>Analyzes skills</span>
              </div>
              <ArrowRight size={16} className="how-arrow" />
              <div className="how-step">
                <div className="how-step-num">3</div>
                <span>Get matched jobs</span>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          /* ── Loading State ── */
          <div className="upload-hero animate-fade-in">
            <div className="hero-text">
              <h2>Analyzing Your CV...</h2>
              <p className="hero-subtitle">
                Finding jobs that match your skills and experience level.
                {hasFilters && ' Applying your search filters.'}
              </p>
            </div>
            <FileUpload isLoading={true} />
          </div>
        ) : (
          /* ── Results State ── */
          <div className="animate-fade-in">
            <div className="dashboard-header">
              <h2>Your Career Dashboard</h2>
              <p>Upload your CV and discover where you stand.</p>
            </div>
            <div className="dashboard-grid">
              {/* Left Panel */}
              <div className="dashboard-left">
                <div className="dashboard-score-card card card-elevated">
                  <MatchScoreCircle score={resumeData.strengthScore} label="CV Strength" />
                  <div className="score-meta">
                    <span className="score-experience">{resumeData.experience.level} · {resumeData.experience.years} years</span>
                    <span className="score-education">{resumeData.education}</span>
                  </div>
                </div>

                <div className="dashboard-skills card card-elevated">
                  <h4>Detected Skills</h4>
                  <div className="skills-list">
                    {resumeData.skills.map((skill, i) => (
                      <SkillTag key={i} skill={skill} type="detected" />
                    ))}
                  </div>
                </div>

                <div className="dashboard-feedback">
                  <div className="feedback-toggle">
                    <h4>Feedback</h4>
                    <button
                      className={`brutal-toggle ${brutalMode ? 'active' : ''}`}
                      onClick={() => setBrutalMode(!brutalMode)}
                      id="brutal-mode-toggle"
                    >
                      {brutalMode ? <Zap size={14} /> : <ZapOff size={14} />}
                      {brutalMode ? 'Brutal Mode ON' : 'Brutal Mode'}
                    </button>
                  </div>
                  <CVFeedbackPanel
                    feedback={brutalMode ? resumeData.brutalFeedback : resumeData.feedback}
                    brutalMode={brutalMode}
                  />
                </div>
              </div>

              {/* Right Panel */}
              <div className="dashboard-right">
                <div className="jobs-header">
                  <div>
                    <h3>Job Matches</h3>
                    <div className="jobs-summary">
                      <span className="badge badge-success">🟢 {strongFit} Strong</span>
                      <span className="badge badge-warning">🟡 {reach} Reach</span>
                      <span className="badge badge-danger">🔴 {lowMatch} Low</span>
                    </div>
                  </div>
                  <div className="jobs-sort">
                    <button 
                      className="btn-ghost refresh-btn" 
                      onClick={handleRefreshJobs}
                      disabled={isRefreshing}
                      title="Fetch new jobs"
                    >
                      <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
                      Refresh
                    </button>
                    <SlidersHorizontal size={14} />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} id="sort-select">
                      <option value="match">Sort by Match %</option>
                      <option value="recent">Most Recent</option>
                    </select>
                  </div>
                </div>

                <div className="jobs-list">
                  {isRefreshing ? (
                     <div className="refresh-loading">
                       <RefreshCw size={24} className="spin text-muted" />
                       <p>Analyzing new jobs against your CV...</p>
                     </div>
                  ) : (
                    sortedJobs.map((job, i) => (
                      <JobCard key={job.id} job={job} index={i} resumeText={resumeText} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
