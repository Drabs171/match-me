import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, MessageSquare, BookOpen, Play, Zap, ZapOff, Send, Loader2,
  Target, AlertTriangle, CheckCircle2, XCircle, Brain, Shield, BarChart3,
  ChevronRight, Award, TrendingUp, Clock, Mic, MicOff, Timer
} from 'lucide-react';
import MatchScoreCircle from '../components/MatchScoreCircle';
import { mockJobs } from '../mockData';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import './InterviewPage.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

export default function InterviewPage() {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, getToken } = useAuth();

  const job = location.state?.job || mockJobs.find((j) => j.id === jobId) || mockJobs[0];
  const resumeText = location.state?.resumeText || '';

  // State
  const [activeTab, setActiveTab] = useState('prep'); // 'prep' | 'practice'
  const [criticalMode, setCriticalMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [prepData, setPrepData] = useState(null);

  // Practice interview state
  const [isPracticing, setIsPracticing] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Speech-to-text state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Timer state (5 minutes = 300 seconds)
  const QUESTION_TIME_LIMIT = 300;
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const timerRef = useRef(null);
  const autoSubmitRef = useRef(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load interview prep on mount
  useEffect(() => {
    loadInterviewPrep();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  // ─── Timer logic ───
  useEffect(() => {
    if (isPracticing && !interviewComplete && !isEvaluating) {
      // Start countdown
      setTimeLeft(QUESTION_TIME_LIMIT);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            autoSubmitRef.current = true;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [currentQuestionIndex, isPracticing, interviewComplete, isEvaluating]);

  // Handle auto-submit when timer hits 0
  useEffect(() => {
    if (autoSubmitRef.current && timeLeft === 0 && !isEvaluating && isPracticing && !interviewComplete) {
      autoSubmitRef.current = false;
      stopListening();
      handleTimerExpiry();
    }
  }, [timeLeft]);

  // ─── Speech-to-text setup ───
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserAnswer(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'aborted') setIsListening(false);
      };

      recognition.onend = () => {
        // Restart if still listening (browser may stop after silence)
        if (recognitionRef.current?._shouldListen) {
          try { recognitionRef.current.start(); } catch {}
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }
    return () => stopListening();
  }, []);

  function toggleListening() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  function startListening() {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current._shouldListen = true;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.error('Could not start speech recognition:', e);
    }
  }

  function stopListening() {
    if (!recognitionRef.current) return;
    recognitionRef.current._shouldListen = false;
    try { recognitionRef.current.stop(); } catch {}
    setIsListening(false);
  }

  function handleTimerExpiry() {
    const answer = userAnswer.trim();
    if (answer) {
      // Auto-submit whatever they have
      handleSubmitAnswer();
    } else {
      // Skip with a "no answer" marker
      const currentQ = prepData.questions[currentQuestionIndex];
      setConversationHistory(prev => [...prev, { type: 'answer', text: '[No answer — time expired]' }]);
      setConversationHistory(prev => [...prev, {
        type: 'feedback',
        evaluation: {
          overallScore: 0,
          whatWorked: [],
          whatWasWeak: ['No answer was provided before time ran out'],
          whatWasMissing: ['An actual response to the question'],
          whatSoundedVague: [],
          strongerAnswer: '',
          followUpQuestion: '',
          coachNote: 'You ran out of time. In a real interview, silence is the worst answer. Even a partial answer is better than nothing.'
        },
        questionIndex: currentQuestionIndex
      }]);

      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < prepData.questions.length) {
        setCurrentQuestionIndex(nextIndex);
        setTimeout(() => {
          setConversationHistory(prev => [...prev, {
            type: 'question',
            category: prepData.questions[nextIndex].category,
            text: prepData.questions[nextIndex].question,
            questionIndex: nextIndex
          }]);
        }, 800);
      } else {
        setInterviewComplete(true);
        generateSummary('[No answer — time expired]', { overallScore: 0 });
      }
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  async function loadInterviewPrep() {
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/interview/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          jobDescription: job.description,
          resumeText,
          matchScore: job.matchScore
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPrepData(data);
      }
    } catch (err) {
      console.error('Failed to load interview prep:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function startPracticeInterview() {
    setIsPracticing(true);
    setCurrentQuestionIndex(0);
    setConversationHistory([]);
    setInterviewComplete(false);
    setSummary(null);
    setActiveTab('practice');
    setTimeLeft(QUESTION_TIME_LIMIT);
    stopListening();

    if (prepData?.questions?.[0]) {
      setConversationHistory([{
        type: 'question',
        category: prepData.questions[0].category,
        text: prepData.questions[0].question,
        questionIndex: 0
      }]);
    }
  }

  async function handleSubmitAnswer() {
    if (!userAnswer.trim() || isEvaluating) return;

    // Stop timer and mic
    clearInterval(timerRef.current);
    stopListening();

    const currentQ = prepData.questions[currentQuestionIndex];
    const answer = userAnswer.trim();
    setUserAnswer('');

    // Add user's answer to conversation
    setConversationHistory(prev => [...prev, { type: 'answer', text: answer }]);
    setIsEvaluating(true);

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/interview/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
        body: JSON.stringify({
          question: currentQ.question,
          answer,
          jobTitle: job.title,
          company: job.company,
          jobDescription: job.description,
          resumeText,
          criticalMode
        }),
      });

      let evaluation;
      if (res.ok) {
        evaluation = await res.json();
      } else {
        evaluation = { overallScore: 6, whatWorked: ['Answer received'], whatWasWeak: ['Could not evaluate'], strongerAnswer: '', followUpQuestion: '', coachNote: 'API error — try again.' };
      }

      // Add feedback to conversation
      setConversationHistory(prev => [...prev, {
        type: 'feedback',
        evaluation,
        questionIndex: currentQuestionIndex
      }]);

      // Move to next question or finish
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < prepData.questions.length) {
        setCurrentQuestionIndex(nextIndex);
        setTimeout(() => {
          setConversationHistory(prev => [...prev, {
            type: 'question',
            category: prepData.questions[nextIndex].category,
            text: prepData.questions[nextIndex].question,
            questionIndex: nextIndex
          }]);
        }, 800);
      } else {
        setInterviewComplete(true);
        generateSummary(answer, evaluation);
      }
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setIsEvaluating(false);
      inputRef.current?.focus();
    }
  }

  async function generateSummary(lastAnswer, lastEval) {
    setIsGeneratingSummary(true);
    try {
      const questionsAndAnswers = conversationHistory
        .filter(c => c.type === 'answer')
        .map((c, i) => ({
          question: prepData.questions[i]?.question || '',
          category: prepData.questions[i]?.category || '',
          answer: c.text,
          score: conversationHistory.find(h => h.type === 'feedback' && h.questionIndex === i)?.evaluation?.overallScore || 0
        }));

      // Add the last answer that hasn't been added to history yet
      questionsAndAnswers.push({
        question: prepData.questions[currentQuestionIndex]?.question || '',
        category: prepData.questions[currentQuestionIndex]?.category || '',
        answer: lastAnswer,
        score: lastEval?.overallScore || 0
      });

      const token = await getToken();
      const res = await fetch(`${API_BASE}/interview/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
        body: JSON.stringify({
          questionsAndAnswers,
          jobTitle: job.title,
          company: job.company,
          resumeText
        }),
      });

      if (res.ok) {
        const summaryData = await res.json();
        setSummary(summaryData);

        // Persist interview to history
        saveInterviewToHistory(questionsAndAnswers, summaryData);
      }
    } catch (err) {
      console.error('Summary error:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  }

  async function saveInterviewToHistory(questionsAndAnswers, summaryData) {
    try {
      if (!user) return;
      
      const recordDetails = {
        matchScore: job.matchScore,
        criticalMode,
        questionsCount: questionsAndAnswers.length,
        avgScore: Math.round(questionsAndAnswers.reduce((s, q) => s + q.score, 0) / questionsAndAnswers.length * 10) / 10,
        readinessScore: summaryData.readinessScore,
        readinessLevel: summaryData.readinessLevel,
        strongestAreas: summaryData.strongestAreas,
        weakestAreas: summaryData.weakestAreas,
        top5Improvements: summaryData.top5ImprovementsBeforeInterview,
        top5CVFixes: summaryData.top5CVFixes,
        coachingNote: summaryData.overallCoachingNote,
        questionsAndAnswers,
      };

      await supabase.from('interview_history').insert([{
        user_id: user.id,
        job_title: job.title,
        company: job.company,
        overall_score: summaryData.readinessScore,
        questions_and_answers: recordDetails
      }]);
    } catch (e) {
      console.error('Failed to save interview history:', e);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  }

  // Compute average score from feedback entries
  const avgScore = (() => {
    const feedbacks = conversationHistory.filter(c => c.type === 'feedback');
    if (!feedbacks.length) return 0;
    return Math.round(feedbacks.reduce((sum, f) => sum + (f.evaluation?.overallScore || 0), 0) / feedbacks.length * 10);
  })();

  const getCategoryIcon = (cat) => {
    const icons = {
      'Introduction': '👋', 'Company-Fit': '🏢', 'Values': '💎',
      'Competency': '⚡', 'Behavioural': '🧠', 'Situational': '🎯',
      'Technical': '💻', 'Day-to-Day': '📋', 'CV-Challenge': '🔍', 'Closing': '🤝'
    };
    return icons[cat] || '❓';
  };

  if (isLoading) {
    return (
      <main className="interview-page" id="interview-page">
        <div className="container">
          <div className="interview-loading">
            <Loader2 size={40} className="spinning" />
            <h2>Preparing Your Interview</h2>
            <p>Analyzing {job.company}'s culture, the {job.title} role, and your CV to generate tailored interview questions...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="interview-page" id="interview-page">
      <div className="container">
        {/* Header */}
        <div className="interview-header animate-fade-in-up">
          <button className="btn btn-ghost back-btn" onClick={() => navigate(`/job/${jobId}`, { state: { job, resumeText } })}>
            <ArrowLeft size={16} /> Back to Job
          </button>
          <div className="interview-header-info">
            <h1><Brain size={28} /> Interview Panel</h1>
            <div className="interview-header-meta">
              <span className="interview-role">{job.title}</span>
              <span className="interview-company">@ {job.company}</span>
              <MatchScoreCircle score={job.matchScore} size={60} label="Match" />
            </div>
          </div>
          <div className="interview-controls">
            <div className="interview-tabs">
              <button
                className={`tab-btn ${activeTab === 'prep' ? 'active' : ''}`}
                onClick={() => setActiveTab('prep')}
              >
                <BookOpen size={15} /> Interview Prep
              </button>
              <button
                className={`tab-btn ${activeTab === 'practice' ? 'active' : ''}`}
                onClick={() => { setActiveTab('practice'); if (!isPracticing) startPracticeInterview(); }}
              >
                <MessageSquare size={15} /> Practice Interview
              </button>
            </div>
            <button
              className={`mode-toggle ${criticalMode ? 'critical' : ''}`}
              onClick={() => setCriticalMode(!criticalMode)}
              title={criticalMode ? 'Switch to Standard Mode' : 'Switch to Critical Interviewer Mode'}
            >
              {criticalMode ? <Zap size={14} /> : <ZapOff size={14} />}
              {criticalMode ? 'Critical Mode' : 'Standard Mode'}
            </button>
          </div>
        </div>

        {/* Three-Column Layout */}
        <div className="interview-grid">
          {/* LEFT: Analysis Panel */}
          <aside className="interview-analysis">
            {prepData?.companyAnalysis && (
              <div className="card card-elevated analysis-card animate-fade-in-up delay-1">
                <h3><Shield size={16} /> Company Intel</h3>
                <p className="analysis-summary">{prepData.companyAnalysis.summary}</p>
                <div className="analysis-tags">
                  <span className="analysis-tone">{prepData.companyAnalysis.companyTone}</span>
                </div>
                <h4>What They Value</h4>
                <ul className="analysis-list">
                  {prepData.companyAnalysis.likelyCares.map((v, i) => (
                    <li key={i}><CheckCircle2 size={13} /> {v}</li>
                  ))}
                </ul>
                <h4>Hiring Manager Priorities</h4>
                <ul className="analysis-list priorities">
                  {prepData.companyAnalysis.hiringManagerPriorities.map((p, i) => (
                    <li key={i}><Target size={13} /> {p}</li>
                  ))}
                </ul>
              </div>
            )}

            {prepData?.roleAnalysis && (
              <div className="card card-elevated analysis-card animate-fade-in-up delay-2">
                <h3><BarChart3 size={16} /> Role Analysis</h3>
                <p className="analysis-summary">{prepData.roleAnalysis.summary}</p>
                <h4>Day-to-Day</h4>
                <ul className="analysis-list">
                  {prepData.roleAnalysis.dayToDay.map((d, i) => (
                    <li key={i}><ChevronRight size={13} /> {d}</li>
                  ))}
                </ul>
                <h4>Success Looks Like</h4>
                <p className="success-note">{prepData.roleAnalysis.successLooksLike}</p>
              </div>
            )}

            {prepData?.cvWeakSpots?.length > 0 && (
              <div className="card card-elevated analysis-card weak-spots animate-fade-in-up delay-3">
                <h3><AlertTriangle size={16} /> CV Weak Spots</h3>
                {prepData.cvWeakSpots.map((ws, i) => (
                  <div key={i} className="weak-spot-item">
                    <strong>{ws.area}</strong>
                    <p>{ws.concern}</p>
                  </div>
                ))}
              </div>
            )}

            {prepData?.interviewFocusAreas && (
              <div className="card card-elevated analysis-card animate-fade-in-up delay-4">
                <h3><Target size={16} /> Focus Areas</h3>
                <div className="focus-tags">
                  {prepData.interviewFocusAreas.map((f, i) => (
                    <span key={i} className="focus-tag">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* CENTER: Interview Area */}
          <section className="interview-center">
            {activeTab === 'prep' && prepData?.questions && (
              <div className="prep-view">
                <div className="prep-header">
                  <h2>Interview Questions</h2>
                  <p>{prepData.questions.length} tailored questions for {job.title} at {job.company}</p>
                  <button className="btn btn-primary start-practice-btn" onClick={startPracticeInterview}>
                    <Play size={16} /> Start Practice Interview
                  </button>
                </div>

                {/* Group questions by category */}
                {[...new Set(prepData.questions.map(q => q.category))].map(category => (
                  <div key={category} className="question-category-group">
                    <h3 className="category-header">
                      <span className="category-icon">{getCategoryIcon(category)}</span>
                      {category}
                    </h3>
                    {prepData.questions.filter(q => q.category === category).map(q => (
                      <div key={q.id} className="prep-question-card card">
                        <div className="prep-q-header">
                          <span className="prep-q-number">Q{q.id}</span>
                          <p className="prep-q-text">{q.question}</p>
                        </div>
                        <div className="prep-q-why">
                          <Target size={13} /> <em>Why: {q.why}</em>
                        </div>
                        <div className="prep-q-answer">
                          <h5>💡 Suggested Answer</h5>
                          <p>{q.suggestedAnswer}</p>
                        </div>
                        {q.criticalFollowUp && (
                          <div className="prep-q-followup">
                            <h5>🔥 Critical Follow-Up</h5>
                            <p>{q.criticalFollowUp}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'practice' && (
              <div className="practice-view">
                {!isPracticing ? (
                  <div className="practice-start">
                    <Brain size={48} />
                    <h2>Ready to Practice?</h2>
                    <p>Questions are asked one at a time, and you'll get detailed feedback on each answer.</p>
                    {criticalMode && (
                      <div className="critical-warning">
                        <Zap size={16} /> Critical Interviewer Mode is ON — expect tough, skeptical follow-ups.
                      </div>
                    )}
                    <button className="btn btn-primary" onClick={startPracticeInterview}>
                      <Play size={16} /> Start Interview
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Timer + Progress */}
                    <div className="interview-progress">
                      {!interviewComplete && !isEvaluating && (
                        <div className={`question-timer ${timeLeft <= 60 ? 'warning' : ''} ${timeLeft <= 15 ? 'critical' : ''}`}>
                          <Timer size={15} />
                          <span className="timer-display">{formatTime(timeLeft)}</span>
                          {timeLeft <= 60 && <span className="timer-label">remaining</span>}
                        </div>
                      )}
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${((currentQuestionIndex + (interviewComplete ? 1 : 0)) / (prepData?.questions?.length || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="progress-text">
                        {interviewComplete
                          ? 'Interview Complete'
                          : `Question ${currentQuestionIndex + 1} of ${prepData?.questions?.length || 0}`}
                      </span>
                    </div>

                    {/* Chat messages */}
                    <div className="chat-messages">
                      {conversationHistory.map((entry, i) => (
                        <div key={i} className={`chat-message ${entry.type}`}>
                          {entry.type === 'question' && (
                            <div className="chat-bubble interviewer">
                              <div className="chat-bubble-header">
                                <Brain size={16} />
                                <span className="interviewer-label">
                                  {criticalMode ? '🔥 Critical Interviewer' : 'Interviewer'}
                                </span>
                                <span className="q-category-badge">{entry.category}</span>
                              </div>
                              <p>{entry.text}</p>
                            </div>
                          )}
                          {entry.type === 'answer' && (
                            <div className="chat-bubble candidate">
                              <div className="chat-bubble-header">
                                <span className="candidate-label">You</span>
                              </div>
                              <p>{entry.text}</p>
                            </div>
                          )}
                          {entry.type === 'feedback' && (
                            <div className="chat-bubble feedback-bubble">
                              <div className="feedback-score-row">
                                <div className={`feedback-score ${entry.evaluation.overallScore >= 7 ? 'good' : entry.evaluation.overallScore >= 5 ? 'mid' : 'low'}`}>
                                  {entry.evaluation.overallScore}/10
                                </div>
                                <span className="feedback-label">Answer Score</span>
                              </div>

                              {entry.evaluation.whatWorked?.length > 0 && (
                                <div className="feedback-section good">
                                  <h5><CheckCircle2 size={13} /> What Worked</h5>
                                  <ul>{entry.evaluation.whatWorked.map((w, j) => <li key={j}>{w}</li>)}</ul>
                                </div>
                              )}

                              {entry.evaluation.whatWasWeak?.length > 0 && (
                                <div className="feedback-section weak">
                                  <h5><XCircle size={13} /> What Was Weak</h5>
                                  <ul>{entry.evaluation.whatWasWeak.map((w, j) => <li key={j}>{w}</li>)}</ul>
                                </div>
                              )}

                              {entry.evaluation.whatWasMissing?.length > 0 && (
                                <div className="feedback-section missing">
                                  <h5><AlertTriangle size={13} /> What Was Missing</h5>
                                  <ul>{entry.evaluation.whatWasMissing.map((w, j) => <li key={j}>{w}</li>)}</ul>
                                </div>
                              )}

                              {entry.evaluation.strongerAnswer && (
                                <div className="feedback-stronger">
                                  <h5>💪 Stronger Answer</h5>
                                  <p>{entry.evaluation.strongerAnswer}</p>
                                </div>
                              )}

                              {entry.evaluation.coachNote && (
                                <div className="feedback-coach">
                                  <p><em>💡 {entry.evaluation.coachNote}</em></p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {isEvaluating && (
                        <div className="chat-message">
                          <div className="chat-bubble interviewer evaluating">
                            <Loader2 size={16} className="spinning" />
                            <span>{criticalMode ? 'Critically analyzing your response...' : 'Evaluating your answer...'}</span>
                          </div>
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>

                    {/* Input area */}
                    {!interviewComplete ? (
                      <div className="chat-input-area">
                        <textarea
                          ref={inputRef}
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={isListening
                            ? '🎙️ Listening... speak your answer'
                            : criticalMode
                              ? 'Answer carefully — the critical interviewer is listening...'
                              : 'Type or use the mic to speak your answer... (Enter to submit)'}
                          disabled={isEvaluating}
                          rows={3}
                          id="interview-answer-input"
                        />
                        <div className="input-buttons">
                          {recognitionRef.current && (
                            <button
                              className={`btn mic-btn ${isListening ? 'listening' : ''}`}
                              onClick={toggleListening}
                              disabled={isEvaluating}
                              title={isListening ? 'Stop listening' : 'Speak your answer'}
                              type="button"
                            >
                              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>
                          )}
                          <button
                            className="btn btn-primary send-btn"
                            onClick={handleSubmitAnswer}
                            disabled={!userAnswer.trim() || isEvaluating}
                          >
                            {isEvaluating ? <Loader2 size={16} className="spinning" /> : <Send size={16} />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="interview-complete-banner">
                        <Award size={24} />
                        <span>Interview Complete! {isGeneratingSummary ? 'Generating summary...' : 'See your results →'}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>

          {/* RIGHT: Feedback & Scoring Panel */}
          <aside className="interview-feedback-panel">
            {/* Live Score */}
            {isPracticing && (
              <div className="card card-elevated score-card animate-fade-in-up">
                <h3><TrendingUp size={16} /> Live Performance</h3>
                <MatchScoreCircle score={avgScore} size={100} label="Readiness" />
                <div className="score-details">
                  <span className="answered-count">
                    <Clock size={13} /> {conversationHistory.filter(c => c.type === 'answer').length} answered
                  </span>
                </div>
              </div>
            )}

            {/* Concerns */}
            {prepData?.likelyInterviewerConcerns && (
              <div className="card card-elevated analysis-card animate-fade-in-up delay-2">
                <h3><AlertTriangle size={16} /> Likely Concerns</h3>
                <ul className="analysis-list concerns">
                  {prepData.likelyInterviewerConcerns.map((c, i) => (
                    <li key={i}><XCircle size={13} /> {c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interview Summary */}
            {summary && (
              <div className="card card-elevated summary-card animate-fade-in-up">
                <h3><Award size={16} /> Interview Summary</h3>
                <div className="summary-score">
                  <MatchScoreCircle score={summary.readinessScore} size={100} label="Readiness" />
                  <span className={`readiness-level ${summary.readinessLevel?.toLowerCase().replace(/\s/g, '-')}`}>
                    {summary.readinessLevel}
                  </span>
                </div>

                <div className="summary-section">
                  <h4><CheckCircle2 size={14} /> Strongest Areas</h4>
                  <ul>{summary.strongestAreas?.map((a, i) => <li key={i}>{a}</li>)}</ul>
                </div>

                <div className="summary-section">
                  <h4><XCircle size={14} /> Weakest Areas</h4>
                  <ul>{summary.weakestAreas?.map((a, i) => <li key={i}>{a}</li>)}</ul>
                </div>

                <div className="summary-section">
                  <h4><AlertTriangle size={14} /> Credibility Risks</h4>
                  <ul>{summary.credibilityRisks?.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>

                <div className="summary-section">
                  <h4><TrendingUp size={14} /> Top 5 Improvements</h4>
                  <ol>{summary.top5ImprovementsBeforeInterview?.map((imp, i) => <li key={i}>{imp}</li>)}</ol>
                </div>

                <div className="summary-section">
                  <h4>📝 Top 5 CV Fixes</h4>
                  <ol>{summary.top5CVFixes?.map((fix, i) => <li key={i}>{fix}</li>)}</ol>
                </div>

                <div className="summary-section">
                  <h4>🤝 Questions to Ask Employer</h4>
                  <ol>{summary.questionsToAskEmployer?.map((q, i) => <li key={i}>{q}</li>)}</ol>
                </div>

                {summary.overallCoachingNote && (
                  <div className="summary-coaching">
                    <h4>🎯 Coaching Summary</h4>
                    <p>{summary.overallCoachingNote}</p>
                  </div>
                )}
              </div>
            )}

            {isGeneratingSummary && (
              <div className="card card-elevated summary-loading">
                <Loader2 size={24} className="spinning" />
                <p>Generating your interview summary...</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
