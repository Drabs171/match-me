const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Try to load Anthropic SDK
let Anthropic;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch {
}

/** Strip markdown code fences from Claude's JSON responses */
function cleanJSON(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  return cleaned;
}

/**
 * Extract text from uploaded file buffer
 */
async function extractText(file) {
  if (file.mimetype === 'application/pdf') {
    const data = await pdfParse(file.buffer);
    return data.text;
  } else {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }
}

/**
 * Parse resume using Claude or fall back to basic extraction
 */
async function parseResume(file) {
  const text = await extractText(file);

  let result;
  if (process.env.ANTHROPIC_API_KEY && Anthropic) {
    result = await parseWithClaude(text);
  } else {
    result = basicParse(text);
  }

  // Include raw text so frontend can use it for CV rewrites
  result.resumeText = text;
  return result;
}

/**
 * AI-powered parsing via Claude
 */
async function parseWithClaude(text) {
  const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Analyze this resume and return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "skills": ["skill1", "skill2", ...],
  "experience": {
    "years": <number>,
    "level": "Junior" | "Mid-Level" | "Senior" | "Lead",
    "summary": "<1-2 sentence summary>"
  },
  "education": "<highest degree>",
  "strengthScore": <0-100>,
  "feedback": {
    "strengths": ["<specific strength>", ...],
    "weaknesses": ["<specific weakness>", ...],
    "suggestions": ["<actionable suggestion>", ...]
  },
  "brutalFeedback": {
    "strengths": ["<brutally honest strength>", ...],
    "weaknesses": ["<brutally honest weakness — be harsh and direct>", ...],
    "suggestions": ["<blunt, no-nonsense suggestion>", ...]
  }
}

Be thorough. For brutalFeedback, be genuinely harsh — tell them what no recruiter would say to their face. For regular feedback, be constructive but honest.

RESUME TEXT:
${text.substring(0, 30000)}`
      }
    ]
  });

  try {
    const content = response.content[0].text;
    return JSON.parse(cleanJSON(content));
  } catch (e) {
    console.error('Failed to parse Claude response:', e);
    return basicParse(text);
  }
}

/**
 * Basic keyword-based parsing fallback
 */
function basicParse(text) {
  const lowerText = text.toLowerCase();

  // Common tech skills to detect
  const skillKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php',
    'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring',
    'sql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
    'git', 'ci/cd', 'agile', 'scrum', 'rest apis', 'graphql',
    'html', 'css', 'sass', 'tailwind',
    'machine learning', 'data science', 'tensorflow', 'pytorch',
    'figma', 'sketch', 'adobe', 'photoshop'
  ];

  const detectedSkills = skillKeywords.filter(skill =>
    lowerText.includes(skill.toLowerCase())
  );

  // Try to detect experience years
  const yearMatch = text.match(/(\d+)\+?\s*years?\s*(of)?\s*(experience|exp)/i);
  const years = yearMatch ? parseInt(yearMatch[1]) : 2;

  const level = years >= 8 ? 'Senior' : years >= 4 ? 'Mid-Level' : 'Junior';

  // Education detection
  const hasPhD = /ph\.?d|doctorate/i.test(text);
  const hasMasters = /master|m\.?s\.|mba/i.test(text);
  const hasBachelors = /bachelor|b\.?s\.|b\.?a\./i.test(text);
  const education = hasPhD ? 'Ph.D.' : hasMasters ? "Master's Degree" : hasBachelors ? "Bachelor's Degree" : 'Not specified';

  const strengthScore = Math.min(95, Math.max(30,
    30 + detectedSkills.length * 5 + years * 3 + (hasBachelors ? 5 : 0) + (hasMasters ? 10 : 0)
  ));

  return {
    skills: detectedSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    experience: { years, level, summary: `${level} professional with ${years} years of experience.` },
    education,
    strengthScore,
    feedback: {
      strengths: detectedSkills.length > 5
        ? ['Diverse technical skill set', 'Multiple relevant technologies detected']
        : ['Resume uploaded and parsed successfully'],
      weaknesses: ['Could not perform deep AI analysis — add your Anthropic API key for detailed feedback'],
      suggestions: ['Add your ANTHROPIC_API_KEY to the .env file for AI-powered insights'],
    },
    brutalFeedback: {
      strengths: ['Your resume was parsed — that\'s about all we can say without AI analysis'],
      weaknesses: ['Without AI analysis, your feedback is limited — configure the API key'],
      suggestions: ['Set up your Anthropic API key to unlock brutal honesty mode'],
    }
  };
}

module.exports = { parseResume };
