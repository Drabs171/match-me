import { Link } from 'react-router-dom';
import { Shield, Database, Brain, Eye, Trash2, Mail, Lock, FileText } from 'lucide-react';
import './PrivacyPolicyPage.css';

const LAST_UPDATED = 'April 9, 2025';
const CONTACT_EMAIL = 'privacy@matchme.ai';

export default function PrivacyPolicyPage() {
  return (
    <main className="privacy-page" id="privacy-policy-page">
      <div className="container">

        {/* Hero */}
        <div className="privacy-hero animate-fade-in-up">
          <div className="privacy-hero-icon">
            <Shield size={40} />
          </div>
          <h1>Privacy Policy</h1>
          <p className="privacy-subtitle">
            We take your privacy seriously. Here's exactly what we collect, why, and how you can control it.
          </p>
          <span className="privacy-updated">Last updated: {LAST_UPDATED}</span>
        </div>

        {/* Quick Overview Cards */}
        <div className="privacy-overview animate-fade-in-up delay-1">
          <div className="privacy-overview-card good">
            <Database size={22} />
            <strong>Your CV data is yours</strong>
            <p>Stored securely and only used to match you with jobs.</p>
          </div>
          <div className="privacy-overview-card good">
            <Brain size={22} />
            <strong>AI processing</strong>
            <p>Your resume is sent to an AI to extract skills — never stored by the AI provider.</p>
          </div>
          <div className="privacy-overview-card good">
            <Trash2 size={22} />
            <strong>Delete anytime</strong>
            <p>You can delete all your data from your account at any time.</p>
          </div>
          <div className="privacy-overview-card good">
            <Eye size={22} />
            <strong>No selling data</strong>
            <p>We never sell, rent, or share your personal data with advertisers.</p>
          </div>
        </div>

        {/* Sections */}
        <div className="privacy-content animate-fade-in-up delay-2">

          <Section icon={<FileText size={20} />} title="1. What We Collect">
            <p>We collect only the minimum information needed to provide the Match Me! service:</p>
            <ul>
              <li><strong>Account information</strong> — your name and email address when you sign up.</li>
              <li><strong>Resume / CV files</strong> — the files you upload for analysis. We store the extracted text and parsed data (skills, experience, education) in our database linked to your account.</li>
              <li><strong>Job search activity</strong> — job listings you save and bookmarks you create.</li>
              <li><strong>Interview history</strong> — practice interview sessions you complete, including your answers and scores, stored so you can review your progress.</li>
              <li><strong>Usage data</strong> — standard server logs (IP address, browser type, pages visited) used for security and performance monitoring.</li>
            </ul>
          </Section>

          <Section icon={<Brain size={20} />} title="2. How We Use AI & Third-Party Services">
            <p>Match Me! uses the following third-party services to power its features:</p>
            <ul>
              <li>
                <strong>Anthropic Claude (AI analysis)</strong> — your resume text is sent to Anthropic's API to extract skills, parse your experience, generate job-tailored CV rewrites, and power the AI interview coach. Anthropic processes this data to return a result and does not retain your data for training purposes under their API terms.
              </li>
              <li>
                <strong>RapidAPI / JSearch (job listings)</strong> — anonymised search queries (job title, location, experience level) are sent to fetch relevant job listings. No personal or identifying information is included in these requests.
              </li>
              <li>
                <strong>Supabase (database & authentication)</strong> — your account data, resume records, saved jobs, and interview history are stored in a Supabase database hosted on secure cloud infrastructure.
              </li>
            </ul>
          </Section>

          <Section icon={<Database size={20} />} title="3. Resume & CV Storage">
            <p>When you upload a CV or resume:</p>
            <ul>
              <li>The file is processed in memory on our server — <strong>the original file is never stored on disk or in our database.</strong></li>
              <li>The extracted text and parsed data (skills, experience, education) <strong>are</strong> saved to your account so you can reuse past scans without re-uploading.</li>
              <li>Your resume data is stored encrypted at rest in our database.</li>
              <li>You can delete stored resumes at any time from your account settings.</li>
            </ul>
          </Section>

          <Section icon={<Lock size={20} />} title="4. How We Protect Your Data">
            <ul>
              <li>All data is transmitted over HTTPS / TLS encryption.</li>
              <li>Your account is protected by Supabase Auth with email verification and secure session tokens (JWT).</li>
              <li>Our API requires authenticated sessions — unauthenticated requests are rejected.</li>
              <li>All database tables use Row Level Security (RLS) — you can only access your own records.</li>
              <li>API keys and secrets are stored in environment variables and never exposed in client-side code.</li>
            </ul>
          </Section>

          <Section icon={<Eye size={20} />} title="5. Who Can See Your Data">
            <p>Your data is private to your account. The only cases where data may be accessed are:</p>
            <ul>
              <li><strong>You</strong> — always. You have full access to everything stored under your account.</li>
              <li><strong>Match Me! team</strong> — only for critical debugging or support, and only when necessary. We do not routinely read user data.</li>
              <li><strong>Third-party processors</strong> — Anthropic and Supabase, as described in Section 2, under their respective privacy policies and data processing agreements.</li>
              <li><strong>Legal requirements</strong> — if required by law or a valid court order.</li>
            </ul>
            <p>We <strong>never</strong> sell, rent, or share your personal data with advertisers, marketers, or other third parties for commercial purposes.</p>
          </Section>

          <Section icon={<Trash2 size={20} />} title="6. Your Rights & Choices">
            <p>You have full control over your data:</p>
            <ul>
              <li><strong>Access</strong> — view all data stored under your account at any time.</li>
              <li><strong>Delete</strong> — delete individual resumes, saved jobs, or interview history from within the app. To delete your entire account and all associated data, contact us at the email below.</li>
              <li><strong>Export</strong> — contact us to request a copy of your data in a portable format.</li>
              <li><strong>Opt out</strong> — you can stop using Match Me! and request full deletion of your data at any time.</li>
            </ul>
          </Section>

          <Section icon={<Database size={20} />} title="7. Data Retention">
            <p>We retain your data for as long as your account is active. Specifically:</p>
            <ul>
              <li><strong>Resume records</strong> — kept until you delete them or close your account.</li>
              <li><strong>Interview history</strong> — kept until you delete individual sessions or close your account.</li>
              <li><strong>Saved jobs</strong> — kept until you unsave them or close your account.</li>
              <li><strong>Server logs</strong> — retained for up to 30 days for security purposes then purged.</li>
            </ul>
          </Section>

          <Section icon={<Mail size={20} />} title="8. Contact Us">
            <p>
              If you have any questions, concerns, or requests about your privacy or this policy, please reach out:
            </p>
            <div className="privacy-contact-card">
              <Mail size={18} />
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </div>
            <p style={{ marginTop: '16px' }}>
              We aim to respond to all privacy-related requests within <strong>5 business days</strong>.
            </p>
          </Section>

        </div>

        {/* Footer CTA */}
        <div className="privacy-footer-cta animate-fade-in-up delay-3">
          <p>Ready to get started?</p>
          <Link to="/signup" className="btn btn-primary">Create Free Account</Link>
          <Link to="/" className="btn btn-secondary">Back to Home</Link>
        </div>

      </div>
    </main>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="privacy-section card card-elevated">
      <div className="privacy-section-header">
        <span className="privacy-section-icon">{icon}</span>
        <h2>{title}</h2>
      </div>
      <div className="privacy-section-body">
        {children}
      </div>
    </div>
  );
}
