import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, ArrowRight, Bookmark } from 'lucide-react';
import MatchScoreCircle from './MatchScoreCircle';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import './JobCard.css';

export default function JobCard({ job, index = 0, resumeText = '' }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    async function checkSaved() {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', job.title)
        .eq('company', job.company)
        .limit(1);
        
      if (data && data.length > 0) {
        setSaved(true);
      }
    }
    
    checkSaved();
    
    const handler = () => checkSaved();
    window.addEventListener('bookmarks-updated', handler);
    return () => window.removeEventListener('bookmarks-updated', handler);
  }, [job.title, job.company, user]);

  async function toggleBookmark(e) {
    e.stopPropagation();
    if (!user || isProcessing) return;
    setIsProcessing(true);

    try {
      if (saved) {
        // Unsave
        await supabase
          .from('saved_jobs')
          .delete()
          .eq('user_id', user.id)
          .eq('title', job.title)
          .eq('company', job.company);
        setSaved(false);
      } else {
        // Save
        await supabase
          .from('saved_jobs')
          .insert([{
            user_id: user.id,
            title: job.title,
            company: job.company,
            location: job.location || '',
            salary: job.salary || '',
            match_score: job.matchScore || 0
          }]);
        setSaved(true);
      }
      window.dispatchEvent(new Event('bookmarks-updated'));
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    } finally {
      setIsProcessing(false);
    }
  }

  const getFitClass = (score) => {
    if (score >= 80) return 'fit-strong';
    if (score >= 60) return 'fit-reach';
    return 'fit-low';
  };

  return (
    <div
      className={`job-card card card-hover animate-fade-in-up delay-${Math.min(index + 1, 5)}`}
      onClick={() => navigate(`/job/${encodeURIComponent(job.id || job.title)}`, { state: { job, resumeText } })}
      id={`job-card-${job.title}`}
      role="button"
      tabIndex={0}
    >
      <div className="job-card-header">
        <div className="job-card-info">
          <h4 className="job-card-title">{job.title}</h4>
          <div className="job-card-meta">
            <span className="job-card-company">
              <Building2 size={14} /> {job.company}
            </span>
            {job.location && (
              <span className="job-card-location">
                <MapPin size={14} /> {job.location}
              </span>
            )}
          </div>
        </div>
        <button
          className={`bookmark-btn ${saved ? 'bookmarked' : ''} ${isProcessing ? 'processing' : ''}`}
          onClick={toggleBookmark}
          disabled={isProcessing}
          title={saved ? 'Remove from saved' : 'Save for later'}
          aria-label={saved ? 'Remove bookmark' : 'Bookmark this job'}
        >
          <Bookmark size={18} />
        </button>
        <MatchScoreCircle score={job.matchScore || 0} size={80} label="" />
      </div>

      {job.strengths && job.strengths.length > 0 && (
        <div className="job-card-strengths">
          <span className="job-card-strengths-label">Why you match:</span>
          <span className="job-card-strengths-text">{job.strengths[0]}</span>
        </div>
      )}

      <div className="job-card-footer">
        <span className={`job-card-fit badge badge-${getFitClass(job.matchScore || 0) === 'fit-strong' ? 'success' : getFitClass(job.matchScore || 0) === 'fit-reach' ? 'warning' : 'danger'}`}>
          {(job.matchScore || 0) >= 80 ? '🟢 Strong Fit' : (job.matchScore || 0) >= 60 ? '🟡 Reach' : '🔴 Low Match'}
        </span>
        <span className="job-card-arrow">
          View Details <ArrowRight size={14} />
        </span>
      </div>
    </div>
  );
}
