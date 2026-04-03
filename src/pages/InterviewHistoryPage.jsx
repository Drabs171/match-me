import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History, ArrowLeft, Brain, Zap, TrendingUp, TrendingDown,
  Calendar, Target, Award, ChevronDown, ChevronUp, Trash2,
  BarChart3, CheckCircle2, XCircle, AlertTriangle, Loader2
} from 'lucide-react';
import MatchScoreCircle from '../components/MatchScoreCircle';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import './InterviewHistoryPage.css';

export default function InterviewHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'standard' | 'critical'
  const [rawHistory, setRawHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  async function loadHistory() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('interview_history')
      .select('*')
      .eq('user_id', user.id)
      .order('interview_date', { ascending: false });

    if (!error && data) {
      const mapped = data.map(row => ({
        id: row.id,
        date: row.interview_date,
        jobTitle: row.job_title,
        company: row.company,
        overallScore: row.overall_score,
        ...(row.questions_and_answers || {})
      }));
      setRawHistory(mapped);
    }
    setIsLoading(false);
  }

  const history = useMemo(() => {
    if (filter === 'standard') return rawHistory.filter(h => !h.criticalMode);
    if (filter === 'critical') return rawHistory.filter(h => h.criticalMode);
    return rawHistory;
  }, [rawHistory, filter]);

  // Progression stats
  const stats = useMemo(() => {
    if (history.length === 0) return null;

    const scores = history.map(h => h.readinessScore || 0);
    const latest = scores[0];
    const oldest = scores[scores.length - 1];
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const best = Math.max(...scores);
    const trend = history.length >= 2 ? latest - scores[1] : 0;

    // Unique roles practiced
    const uniqueRoles = [...new Set(history.map(h => `${h.jobTitle} @ ${h.company}`))];

    return { latest, oldest, avg, best, trend, totalInterviews: history.length, uniqueRoles };
  }, [history]);

  async function deleteInterview(id) {
    await supabase.from('interview_history').delete().eq('id', id);
    setRawHistory(prev => prev.filter(h => h.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  async function clearAll() {
    if (window.confirm('Delete all interview history? This cannot be undone.')) {
      await supabase.from('interview_history').delete().eq('user_id', user.id);
      setRawHistory([]);
    }
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function getReadinessColor(level) {
    if (!level) return '';
    const l = level.toLowerCase();
    if (l.includes('strong') || l.includes('ready')) return 'good';
    if (l.includes('getting')) return 'mid';
    return 'low';
  }

  return (
    <main className="history-page" id="interview-history-page">
      <div className="container">
        {/* Header */}
        <div className="history-header animate-fade-in-up">
          <button className="btn btn-ghost back-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} /> Dashboard
          </button>
          <div className="history-title-row">
            <h1><History size={28} /> Interview History</h1>
            {history.length > 0 && (
              <button className="btn btn-ghost btn-danger-text" onClick={clearAll}>
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>
        </div>

        {history.length === 0 ? (
          <div className="history-empty animate-fade-in-up">
            <Brain size={56} />
            <h2>No Interviews Yet</h2>
            <p>Complete a practice interview from any job posting and your results will appear here with progression tracking.</p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Go Find a Job
            </button>
          </div>
        ) : (
          <>
            {/* Progression Stats */}
            {stats && (
              <div className="progression-cards animate-fade-in-up">
                <div className="card card-elevated stat-card">
                  <div className="stat-icon"><BarChart3 size={20} /></div>
                  <div className="stat-value">{stats.totalInterviews}</div>
                  <div className="stat-label">Total Interviews</div>
                </div>
                <div className="card card-elevated stat-card">
                  <div className="stat-icon"><Target size={20} /></div>
                  <div className="stat-value">{stats.latest}%</div>
                  <div className="stat-label">Latest Readiness</div>
                  {stats.trend !== 0 && (
                    <div className={`stat-trend ${stats.trend > 0 ? 'up' : 'down'}`}>
                      {stats.trend > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {stats.trend > 0 ? '+' : ''}{stats.trend}%
                    </div>
                  )}
                </div>
                <div className="card card-elevated stat-card">
                  <div className="stat-icon"><Award size={20} /></div>
                  <div className="stat-value">{stats.best}%</div>
                  <div className="stat-label">Best Score</div>
                </div>
                <div className="card card-elevated stat-card">
                  <div className="stat-icon"><TrendingUp size={20} /></div>
                  <div className="stat-value">{stats.avg}%</div>
                  <div className="stat-label">Average Score</div>
                </div>
              </div>
            )}

            {/* Progression Chart (simple bar chart) */}
            {history.length >= 2 && (
              <div className="card card-elevated progression-chart animate-fade-in-up">
                <h3><TrendingUp size={16} /> Score Progression</h3>
                <div className="chart-container">
                  {[...history].reverse().slice(-15).map((h, i) => (
                    <div key={h.id} className="chart-bar-group">
                      <div
                        className={`chart-bar ${(h.readinessScore || 0) >= 70 ? 'good' : (h.readinessScore || 0) >= 50 ? 'mid' : 'low'}`}
                        style={{ height: `${Math.max(h.readinessScore || 0, 5)}%` }}
                        title={`${h.readinessScore}% — ${h.jobTitle} @ ${h.company}`}
                      >
                        <span className="chart-bar-label">{h.readinessScore}%</span>
                      </div>
                      <span className="chart-bar-date">{formatDate(h.date).split(',')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unique roles */}
            {stats?.uniqueRoles?.length > 0 && (
              <div className="roles-practiced animate-fade-in-up">
                <h4>Roles Practiced</h4>
                <div className="roles-tags">
                  {stats.uniqueRoles.map((r, i) => (
                    <span key={i} className="role-tag">{r}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="history-filters animate-fade-in-up">
              <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                All ({rawHistory.length})
              </button>
              <button className={`filter-btn ${filter === 'standard' ? 'active' : ''}`} onClick={() => setFilter('standard')}>
                Standard ({rawHistory.filter(h => !h.criticalMode).length})
              </button>
              <button className={`filter-btn ${filter === 'critical' ? 'active' : ''}`} onClick={() => setFilter('critical')}>
                <Zap size={13} /> Critical ({rawHistory.filter(h => h.criticalMode).length})
              </button>
            </div>

            {/* Interview List */}
            <div className="interview-list">
              {history.map((record, idx) => (
                <div key={record.id} className="card card-elevated interview-record animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="record-main" onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}>
                    <div className="record-left">
                      <MatchScoreCircle score={record.readinessScore || 0} size={55} label="Ready" />
                    </div>
                    <div className="record-info">
                      <div className="record-title-row">
                        <h3>{record.jobTitle}</h3>
                        {record.criticalMode && (
                          <span className="critical-badge"><Zap size={11} /> Critical</span>
                        )}
                      </div>
                      <p className="record-company">@ {record.company}</p>
                      <div className="record-meta">
                        <span><Calendar size={12} /> {formatDate(record.date)} at {formatTime(record.date)}</span>
                        <span>•</span>
                        <span>{record.questionsCount} questions</span>
                        <span>•</span>
                        <span>Avg: {record.avgScore}/10</span>
                      </div>
                    </div>
                    <div className="record-right">
                      <span className={`readiness-badge ${getReadinessColor(record.readinessLevel)}`}>
                        {record.readinessLevel || 'N/A'}
                      </span>
                      {expandedId === record.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {expandedId === record.id && (
                    <div className="record-detail">
                      <div className="detail-grid">
                        {/* Strengths */}
                        {record.strongestAreas?.length > 0 && (
                          <div className="detail-section">
                            <h4><CheckCircle2 size={14} /> Strongest Areas</h4>
                            <ul>{record.strongestAreas.map((a, i) => <li key={i}>{a}</li>)}</ul>
                          </div>
                        )}

                        {/* Weaknesses */}
                        {record.weakestAreas?.length > 0 && (
                          <div className="detail-section">
                            <h4><XCircle size={14} /> Weakest Areas</h4>
                            <ul>{record.weakestAreas.map((a, i) => <li key={i}>{a}</li>)}</ul>
                          </div>
                        )}

                        {/* Improvements */}
                        {record.top5Improvements?.length > 0 && (
                          <div className="detail-section full-width">
                            <h4><TrendingUp size={14} /> Key Improvements</h4>
                            <ol>{record.top5Improvements.slice(0, 3).map((imp, i) => <li key={i}>{imp}</li>)}</ol>
                          </div>
                        )}
                      </div>

                      {/* Coaching Note */}
                      {record.coachingNote && (
                        <div className="detail-coaching">
                          <h4>🎯 Coach Summary</h4>
                          <p>{record.coachingNote}</p>
                        </div>
                      )}

                      {/* Q&A Breakdown */}
                      {record.questionsAndAnswers?.length > 0 && (
                        <div className="qa-breakdown">
                          <h4><Brain size={14} /> Question Scores</h4>
                          <div className="qa-scores">
                            {record.questionsAndAnswers.map((qa, i) => (
                              <div key={i} className="qa-score-item" title={qa.question}>
                                <div className={`qa-score-dot ${qa.score >= 7 ? 'good' : qa.score >= 5 ? 'mid' : 'low'}`}>
                                  {qa.score}
                                </div>
                                <span className="qa-score-cat">{qa.category}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="record-actions">
                        <button className="btn btn-ghost btn-sm btn-danger-text" onClick={(e) => { e.stopPropagation(); deleteInterview(record.id); }}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
