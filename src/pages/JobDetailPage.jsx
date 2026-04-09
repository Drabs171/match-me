import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, ExternalLink, MapPin, Building2, Clock, DollarSign, Wand2, Loader2, CheckCircle2, XCircle, Target, Brain, Download } from 'lucide-react';
import MatchScoreCircle from '../components/MatchScoreCircle';
import SkillTag from '../components/SkillTag';
import { mockCVRewrite, mockJobs } from '../mockData';
import { useAuth } from '../AuthContext';
import './JobDetailPage.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

export default function JobDetailPage() {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [rewriteData, setRewriteData] = useState(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const { getToken } = useAuth();

  // Get job from navigation state or fallback to mock
  const job = location.state?.job || mockJobs.find((j) => j.id === jobId) || mockJobs[0];
  const resumeText = location.state?.resumeText || '';

  const handleFixCV = async () => {
    setIsRewriting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
        body: JSON.stringify({ resumeText, jobDescription: job.description, jobTitle: job.title }),
      });
      if (res.ok) {
        const data = await res.json();
        setRewriteData(data);
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        setRewriteData(mockCVRewrite);
      }
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
      setRewriteData(mockCVRewrite);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleDownloadCV = async () => {
    if (!rewriteData?.tailoredCV) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/download-cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
        body: JSON.stringify({
          tailoredCV: rewriteData.tailoredCV,
          company: job.company,
          jobTitle: job.title,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tailored_CV_${job.company.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  // Score breakdown simulation
  const breakdown = [
    { label: 'Skills Overlap', weight: '40%', score: Math.min(100, job.matchScore + 8) },
    { label: 'Experience Level', weight: '30%', score: Math.min(100, job.matchScore - 5) },
    { label: 'Keywords Match', weight: '20%', score: Math.min(100, job.matchScore + 3) },
    { label: 'Education/Extras', weight: '10%', score: Math.min(100, job.matchScore + 15) },
  ];

  return (
    <main className="job-detail" id="job-detail-page">
      <div className="container">
        <button className="btn btn-ghost back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="job-detail-grid">
          {/* Main Content */}
          <div className="job-detail-main">
            <div className="job-detail-header card card-elevated animate-fade-in-up">
              <div className="job-detail-top">
                <div>
                  <h1 className="job-detail-title">{job.title}</h1>
                  <div className="job-detail-meta">
                    <span><Building2 size={15} /> {job.company}</span>
                    <span><MapPin size={15} /> {job.location}</span>
                    {job.salary && <span><DollarSign size={15} /> {job.salary}</span>}
                    {job.posted && <span><Clock size={15} /> {job.posted}</span>}
                  </div>
                </div>
                <MatchScoreCircle score={job.matchScore} size={120} label="Job Match" />
              </div>

              <div className="job-detail-actions">
                {job.applyUrl && job.applyUrl !== '#' ? (
                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    Apply Now <ExternalLink size={15} />
                  </a>
                ) : (
                  <button className="btn btn-primary" disabled style={{ opacity: 0.5 }}>
                    Apply Now <ExternalLink size={15} />
                  </button>
                )}
                <button
                  className="btn btn-secondary fix-cv-btn"
                  onClick={handleFixCV}
                  disabled={isRewriting || !job.description}
                  id="fix-cv-btn"
                  title={!job.description ? 'Re-bookmark this job from Dashboard to enable' : ''}
                >
                  {isRewriting ? <Loader2 size={15} className="spinning" /> : <Wand2 size={15} />}
                  {isRewriting ? 'Rewriting...' : 'Fix My CV for THIS Job'}
                </button>
                <button
                  className="btn btn-secondary interview-prep-btn"
                  onClick={() => navigate(`/interview/${jobId}`, { state: { job, resumeText } })}
                  disabled={!job.description}
                  id="interview-prep-btn"
                  title={!job.description ? 'Re-bookmark this job from Dashboard to enable' : ''}
                >
                  <Brain size={15} />
                  Interview Prep
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="card card-elevated animate-fade-in-up delay-1">
              <h3 className="detail-section-title">Job Description</h3>
              {job.description ? (
                <p className="job-description">{job.description}</p>
              ) : (
                <div style={{
                  padding: '20px',
                  background: 'var(--warning-light)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#92400e',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                }}>
                  <strong>Job description unavailable.</strong> This job was saved before full data storage was supported. 
                  To get the full experience (description, Apply link, CV rewriting, interview prep), 
                  find this job again from the Dashboard and re-bookmark it.
                </div>
              )}
              {job.requirements && job.requirements.length > 0 && (
                <div className="job-requirements">
                  <h4>Required Skills</h4>
                  <div className="skills-list">
                    {job.requirements.map((req, i) => (
                      <SkillTag key={i} skill={req} type="detected" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Original CV Viewer */}
            {!rewriteData && resumeText && (
               <div className="card card-elevated animate-fade-in-up delay-2">
                 <h3 className="detail-section-title">Your Current CV</h3>
                 <div className="cv-viewer">
                   <pre className="cv-content">{resumeText}</pre>
                 </div>
               </div>
            )}

            {/* CV Rewrite Results */}
            {rewriteData && (
              <div className="card card-elevated rewrite-card animate-fade-in-up" id="rewrite-results">
                <div className="rewrite-header">
                  <h3 className="detail-section-title">
                    <Wand2 size={18} /> Tailored CV
                  </h3>
                  <button className="btn btn-primary btn-sm" onClick={handleDownloadCV}>
                    <Download size={14} /> Download CV
                  </button>
                </div>

                <div className="cv-viewer">
                  <pre className="cv-content">{rewriteData.tailoredCV}</pre>
                </div>

                <h4 className="changes-title">Key Improvements Made</h4>
                <div className="rewrite-comparison">
                  {rewriteData.changes.map((change, i) => (
                    <div key={i} className="change-item">
                       <div className="change-grid">
                         <div className="rewrite-before">
                           <span className="rewrite-label">❌ Before</span>
                           <p>{change.original}</p>
                         </div>
                         <div className="rewrite-after">
                           <span className="rewrite-label">✅ After</span>
                           <p>{change.rewritten}</p>
                         </div>
                       </div>
                       <p className="change-reason"><strong>Why:</strong> {change.reason}</p>
                    </div>
                  ))}
                </div>

                <div className="rewrite-keywords">
                  <h4>Keywords to Add</h4>
                  <div className="skills-list">
                    {rewriteData.keywordSuggestions.map((kw, i) => (
                      <SkillTag key={i} skill={kw} type="detected" />
                    ))}
                  </div>
                </div>

                <div className="rewrite-tips">
                  <h4>ATS Optimization Tips</h4>
                  <ul>
                    {rewriteData.atsTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="job-detail-sidebar">
            {/* Score Breakdown */}
            <div className="card card-elevated animate-slide-in-right delay-1">
              <h3 className="detail-section-title">
                <Target size={18} /> Score Breakdown
              </h3>
              <div className="breakdown-list">
                {breakdown.map((item, i) => (
                  <div key={i} className="breakdown-item">
                    <div className="breakdown-label">
                      <span>{item.label}</span>
                      <span className="breakdown-weight">{item.weight}</span>
                    </div>
                    <div className="breakdown-bar">
                      <div
                        className="breakdown-fill"
                        style={{
                          width: `${item.score}%`,
                          background: item.score >= 80 ? 'var(--success)' : item.score >= 60 ? 'var(--warning)' : 'var(--danger)'
                        }}
                      />
                    </div>
                    <span className="breakdown-score">{item.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths */}
            {job.strengths && (
              <div className="card card-elevated animate-slide-in-right delay-2">
                <h3 className="detail-section-title strength-title">
                  <CheckCircle2 size={18} /> Why You Match
                </h3>
                <ul className="match-reasons">
                  {job.strengths.map((s, i) => (
                    <li key={i} className="match-reason strength">{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {job.gaps && (
              <div className="card card-elevated animate-slide-in-right delay-3">
                <h3 className="detail-section-title gap-title">
                  <XCircle size={18} /> What's Missing
                </h3>
                <ul className="match-reasons">
                  {job.gaps.map((g, i) => (
                    <li key={i} className="match-reason gap">{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
