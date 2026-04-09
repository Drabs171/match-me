import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark, ArrowLeft, Trash2, Building2, MapPin, ExternalLink,
  Calendar, AlertTriangle, Search, Loader2
} from 'lucide-react';
import MatchScoreCircle from '../components/MatchScoreCircle';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import './SavedJobsPage.css';

export default function SavedJobsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [savedJobs, setSavedJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSavedJobs();
    }
  }, [user]);

  async function loadSavedJobs() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('date_saved', { ascending: false });

    if (!error && data) {
      // Map Supabase columns back to standard job object shape
      const mapped = data.map(row => ({
        id: row.id,
        title: row.title,
        company: row.company,
        location: row.location,
        salary: row.salary,
        matchScore: row.match_score,
        savedAt: row.date_saved,
        // Restore full job data if it was stored
        description: row.job_data?.description || '',
        applyUrl: row.job_data?.applyUrl || '',
        requirements: row.job_data?.requirements || [],
        strengths: row.job_data?.strengths || [],
        gaps: row.job_data?.gaps || [],
        posted: row.job_data?.posted || '',
        fitCategory: row.job_data?.fitCategory || '',
      }));
      setSavedJobs(mapped);
    }
    setIsLoading(false);
  }

  async function removeJob(jobId) {
    await supabase.from('saved_jobs').delete().eq('id', jobId);
    setSavedJobs(prev => prev.filter(j => j.id !== jobId));
    window.dispatchEvent(new Event('bookmarks-updated'));
  }

  async function clearAll() {
    if (window.confirm('Remove all saved jobs? This cannot be undone.')) {
      await supabase.from('saved_jobs').delete().eq('user_id', user.id);
      setSavedJobs([]);
      window.dispatchEvent(new Event('bookmarks-updated'));
    }
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const filtered = savedJobs.filter(job => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return job.title?.toLowerCase().includes(term) ||
           job.company?.toLowerCase().includes(term) ||
           job.location?.toLowerCase().includes(term);
  });

  const strongCount = filtered.filter(j => j.matchScore >= 80).length;
  const reachCount = filtered.filter(j => j.matchScore >= 60 && j.matchScore < 80).length;
  const lowCount = filtered.filter(j => j.matchScore < 60).length;

  return (
    <main className="saved-page" id="saved-jobs-page">
      <div className="container">
        {/* Header */}
        <div className="saved-header animate-fade-in-up">
          <button className="btn btn-ghost back-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} /> Dashboard
          </button>
          <div className="saved-title-row">
            <div className="saved-title-left">
              <h1><Bookmark size={26} /> Saved Jobs</h1>
              <span className="saved-count">{savedJobs.length} job{savedJobs.length !== 1 ? 's' : ''} saved</span>
            </div>
            {savedJobs.length > 0 && (
              <button className="btn btn-ghost btn-danger-text btn-sm" onClick={clearAll}>
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="saved-empty animate-fade-in-up">
            <Loader2 size={40} className="spinning" />
            <p>Loading your saved jobs...</p>
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="saved-empty animate-fade-in-up">
            <Bookmark size={56} />
            <h2>No Saved Jobs</h2>
            <p>
              Click the <Bookmark size={14} style={{ verticalAlign: 'middle' }} /> bookmark icon on any job card
              to save it here for later.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Browse Jobs
            </button>
          </div>
        ) : (
          <>
            {/* Search + Stats */}
            <div className="saved-toolbar animate-fade-in-up">
              <div className="saved-search">
                <Search size={15} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search saved jobs..."
                />
              </div>
              <div className="saved-stats">
                {strongCount > 0 && <span className="badge badge-success">🟢 {strongCount} Strong</span>}
                {reachCount > 0 && <span className="badge badge-warning">🟡 {reachCount} Reach</span>}
                {lowCount > 0 && <span className="badge badge-danger">🔴 {lowCount} Low</span>}
              </div>
            </div>

            {/* Jobs Grid */}
            <div className="saved-grid">
              {filtered.map((job, idx) => (
                <div
                  key={job.id}
                  className="saved-card card card-elevated animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <div className="saved-card-top">
                    <div className="saved-card-score">
                      <MatchScoreCircle score={job.matchScore || 0} size={55} label="Match" />
                    </div>
                    <div className="saved-card-info">
                      <h3
                        className="saved-card-title"
                        onClick={() => navigate(`/job/${encodeURIComponent(job.title)}`, { state: { job } })}
                      >
                        {job.title}
                      </h3>
                      <div className="saved-card-meta">
                        <span><Building2 size={13} /> {job.company}</span>
                        {job.location && <span><MapPin size={13} /> {job.location}</span>}
                      </div>
                      {job.salary && (
                        <span className="saved-card-salary">{job.salary}</span>
                      )}
                    </div>
                  </div>

                  <div className="saved-card-bottom">
                    <div className="saved-card-bottom-left">
                      {job.savedAt && (
                        <span className="saved-card-date">
                          <Calendar size={12} /> Saved {formatDate(job.savedAt)}
                        </span>
                      )}
                      <span className={`badge badge-sm badge-${job.matchScore >= 80 ? 'success' : job.matchScore >= 60 ? 'warning' : 'danger'}`}>
                        {job.matchScore >= 80 ? 'Strong Fit' : job.matchScore >= 60 ? 'Reach' : 'Low Match'}
                      </span>
                    </div>
                    <div className="saved-card-actions">
                      <button
                        className="btn btn-ghost btn-sm btn-danger-text"
                        onClick={() => removeJob(job.id)}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && searchTerm && (
                <div className="saved-no-results">
                  <AlertTriangle size={20} />
                  <p>No saved jobs match "{searchTerm}"</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
