const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { parseResume } = require('./services/resumeParser');
const { fetchJobs } = require('./services/jobFetcher');
const { matchResumeToJobs } = require('./services/matchingEngine');
const { rewriteCV } = require('./services/cvRewriter');
const { analyzeAndGenerateInterview, evaluateAnswer, generateInterviewSummary } = require('./services/interviewCoach');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(helmet());

// ─── Rate Limiters ───
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests to AI endpoints. Please wait a few minutes.' },
});

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

// File upload config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are accepted'), false);
    }
  },
});

// ─── Routes ───

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasRapidAPIKey: !!process.env.RAPIDAPI_KEY,
  });
});

// Analyze resume
app.post('/api/analyze', aiLimiter, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const result = await parseResume(req.file);
    res.json(result);
  } catch (err) {
    console.error('Resume analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

// Fetch jobs (CV-aware smart search)
app.post('/api/jobs', aiLimiter, async (req, res) => {
  try {
    const { role, location, experienceLevel, resumeData, resumeText, page } = req.body;
    const jobs = await fetchJobs({ role, location, experienceLevel, resumeData, resumeText, page });
    res.json({ jobs });
  } catch (err) {
    console.error('Job fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Match resume to jobs
app.post('/api/match', async (req, res) => {
  try {
    const { resume, jobs } = req.body;
    const matched = matchResumeToJobs(resume, jobs);
    res.json({ jobs: matched });
  } catch (err) {
    console.error('Matching error:', err);
    res.status(500).json({ error: 'Failed to match jobs' });
  }
});

// Rewrite CV for a specific job
app.post('/api/rewrite', aiLimiter, async (req, res) => {
  try {
    const { resumeText, jobDescription, jobTitle } = req.body;
    const result = await rewriteCV({ resumeText, jobDescription, jobTitle });
    res.json(result);
  } catch (err) {
    console.error('Rewrite error:', err);
    res.status(500).json({ error: 'Failed to rewrite CV' });
  }
});

// ─── Interview Coach Routes ───

// Generate interview prep
app.post('/api/interview/prepare', async (req, res) => {
  try {
    const { jobTitle, company, jobDescription, resumeText, matchScore } = req.body;
    const result = await analyzeAndGenerateInterview({ jobTitle, company, jobDescription, resumeText, matchScore });
    res.json(result);
  } catch (err) {
    console.error('Interview prep error:', err);
    res.status(500).json({ error: 'Failed to generate interview prep' });
  }
});

// Evaluate an answer
app.post('/api/interview/evaluate', async (req, res) => {
  try {
    const { question, answer, jobTitle, company, jobDescription, resumeText, criticalMode } = req.body;
    const result = await evaluateAnswer({ question, answer, jobTitle, company, jobDescription, resumeText, criticalMode });
    res.json(result);
  } catch (err) {
    console.error('Answer evaluation error:', err);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

// Generate interview summary
app.post('/api/interview/summary', async (req, res) => {
  try {
    const { questionsAndAnswers, jobTitle, company, resumeText } = req.body;
    const result = await generateInterviewSummary({ questionsAndAnswers, jobTitle, company, resumeText });
    res.json(result);
  } catch (err) {
    console.error('Interview summary error:', err);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Generate and download a tailored CV as a .docx Word file
app.post('/api/download-cv', async (req, res) => {
  try {
    const { tailoredCV, candidateName, jobTitle, company } = req.body;
    if (!tailoredCV) return res.status(400).json({ error: 'No CV text provided' });

    const lines = tailoredCV.split('\n');
    const docChildren = [];

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        // Blank line → spacer paragraph
        docChildren.push(new Paragraph({ spacing: { after: 80 } }));
        continue;
      }

      // Detect section headings: ALL CAPS lines or lines ending with ':'
      const isHeading =
        (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !/^\d/.test(trimmed)) ||
        /^(Education|Experience|Skills|Summary|Profile|Employment|Qualifications|Certifications|References|Objective|Projects|Achievements|Publications|Awards|Languages|Interests|Volunteer|Training|Professional Development)[:\s]/i.test(trimmed);

      if (isHeading) {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: trimmed, bold: true, size: 26, color: '1F7A63' })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 80 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } },
          })
        );
        continue;
      }

      // Bullet points (lines starting with -, •, *, ■, ▪)
      if (/^[-•*■▪]/.test(trimmed)) {
        docChildren.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: trimmed.replace(/^[-•*■▪]\s*/, ''), size: 22 })],
            spacing: { after: 60 },
          })
        );
        continue;
      }

      // Name line (first non-blank line — larger + bold)
      if (docChildren.filter(p => p instanceof Paragraph && p.root?.length > 1).length === 0) {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: trimmed, bold: true, size: 36 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          })
        );
        continue;
      }

      // Regular paragraph
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed, size: 22 })],
          spacing: { after: 60 },
        })
      );
    }

    const doc = new Document({
      sections: [{ properties: {}, children: docChildren }],
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `Tailored_CV_${(company || 'Job').replace(/\s+/g, '_')}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('DOCX generation error:', err);
    res.status(500).json({ error: 'Failed to generate Word document' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Match Me! API server running on http://localhost:${PORT}`);
  console.log(`   Anthropic API: ${process.env.ANTHROPIC_API_KEY ? '✅ Configured' : '⚠️  Not set (using mock data)'}`);
  console.log(`   RapidAPI:      ${process.env.RAPIDAPI_KEY ? '✅ Configured' : '⚠️  Not set (using mock data)'}\n`);
});
