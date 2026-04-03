/**
 * Fetch jobs from JSearch via RapidAPI, or return mock data.
 * Supports CV-aware smart search: when resumeData is provided,
 * uses Claude to generate targeted job search queries.
 */

let Anthropic;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch {
  Anthropic = null;
}

/** Strip markdown code fences from Claude's JSON responses */
function cleanJSON(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  return cleaned;
}

/**
 * Main entry point: fetch jobs, optionally using CV-aware smart search
 */
async function fetchJobs({ role = 'Software Engineer', location = 'Remote', experienceLevel = '', resumeData = null, resumeText = '', page = 1 }) {
  if (!process.env.RAPIDAPI_KEY) {
    return getMockJobs({ role, page });
  }

  // If CV data is available, use Claude to generate smart search queries
  if (resumeData && (resumeData.skills?.length > 0 || resumeText)) {
    const smartQueries = await generateSmartSearchQueries(resumeData, resumeText, location);
    if (smartQueries && smartQueries.length > 0) {
      console.log(`🔍 Smart search queries (page ${page}):`, smartQueries);
      return await fetchMultipleQueries(smartQueries, location, page);
    }
  }

  // Fallback: use the manual role
  return await fetchFromJSearch({ role, location, experienceLevel, page });
}

/**
 * Use Claude to analyze the CV and generate targeted job search queries
 */
async function generateSmartSearchQueries(resumeData, resumeText, location) {
  if (!process.env.ANTHROPIC_API_KEY || !Anthropic) {
    // Generate basic queries from resume data without AI
    return generateBasicQueries(resumeData);
  }

  const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

  const cvContext = resumeText
    ? `FULL CV TEXT:\n${resumeText.substring(0, 30000)}`
    : `CV SUMMARY:
Skills: ${resumeData.skills?.join(', ') || 'N/A'}
Experience Level: ${resumeData.experience?.level || 'N/A'}
Years: ${resumeData.experience?.years || 'N/A'}
Education: ${resumeData.education || 'N/A'}`;

  const prompt = `Analyze this candidate's CV and generate job search queries for a job board API like Indeed/LinkedIn.

${cvContext}

Generate 4-6 search queries. CRITICAL RULES:
- Each query must be SHORT: 2-4 words maximum (like you'd type into a job board search bar)
- Use common job titles, NOT executive/niche titles
- Include a MIX of specific and broad queries
- First 2 queries: their exact field (e.g. "Civil Engineer", "Project Manager Construction")
- Next 2 queries: related/broader roles (e.g. "Infrastructure Engineer", "Site Manager")
- Last 1-2: skill-based searches (e.g. "Dam Design", "EPC Projects")

BAD examples (too long/specific): "Chief Operating Officer COO Environmental Engineering Mining", "VP Operations Director Mining Environmental Infrastructure"
GOOD examples: "Civil Engineer", "Project Manager Mining", "Dam Engineer", "Environmental Engineer"

Return ONLY valid JSON (no markdown, no code fences):
{
  "queries": [
    {"query": "<2-4 word search query>", "reason": "<brief reason>"}
  ],
  "detectedRole": "<their most likely job title>",
  "experienceLevel": "<Junior|Mid|Senior|Lead|Principal>"
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].text;
    const parsed = JSON.parse(cleanJSON(content));
    return parsed.queries?.map(q => q.query) || [];
  } catch (e) {
    console.error('Smart query generation error:', e.message);
    return generateBasicQueries(resumeData);
  }
}

/**
 * Generate basic search queries from resume data without AI
 */
function generateBasicQueries(resumeData) {
  const queries = [];
  const level = resumeData.experience?.level || '';
  const skills = resumeData.skills || [];

  // Try to build role-specific queries from skills
  if (skills.length > 0) {
    // Use top 2 skills as query terms
    queries.push(`${level} ${skills.slice(0, 2).join(' ')}`.trim());
    if (skills.length > 2) {
      queries.push(`${level} ${skills.slice(2, 4).join(' ')}`.trim());
    }
  }

  return queries.length > 0 ? queries : null;
}

/**
 * Run JSearch queries sequentially (to avoid rate limits) and deduplicate results
 */
async function fetchMultipleQueries(queries, location, page = 1) {
  const allJobs = new Map();
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  // Run queries sequentially with delay (max 4 to get a broad pool of ~40 jobs)
  const queryList = queries.slice(0, 4);
  console.log(`  → Searching (page ${page}):`, queryList);

  for (const query of queryList) {
    const jobs = await fetchFromJSearch({ role: query, location, experienceLevel: '', page });
    for (const job of jobs) {
      if (!allJobs.has(job.id)) {
        allJobs.set(job.id, job);
      }
    }
    // Brief pause between requests to respect rate limits
    if (queryList.indexOf(query) < queryList.length - 1) {
      await delay(300);
    }
  }

  const jobs = [...allJobs.values()];

  // Return the entire broad pool (usually 20-40 jobs)
  // The matching engine will score all of them and we pick the top 15 highest scoring later!
  if (jobs.length > 0) {
    return jobs;
  }

  // If first queries returned nothing, try remaining ones
  if (queries.length > 4) {
    console.log(`  → First batch empty, trying (page ${page}):`, queries.slice(4));
    for (const query of queries.slice(4)) {
      await delay(300);
      const jobs = await fetchFromJSearch({ role: query, location, experienceLevel: '', page });
      for (const job of jobs) {
        if (!allJobs.has(job.id)) {
          allJobs.set(job.id, job);
        }
      }
    }
  }

  if (allJobs.size > 0) {
    return [...allJobs.values()].slice(0, 15);
  }

  // Last resort: broadest possible search
  console.log('  → All queries returned 0 results, trying broadest fallback');
  const broadQuery = queries[0].split(' ')[0];
  return await fetchFromJSearch({ role: broadQuery, location, experienceLevel: '', page });
}

async function fetchFromJSearch({ role, location, experienceLevel, page = 1 }) {
  const query = `${role} in ${location}`;
  const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=${page}&num_pages=1&date_posted=month`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      console.error('JSearch API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return [];
    }

    return data.data.slice(0, 10).map((job, i) => ({
      id: job.job_id || String(i + 1),
      title: job.job_title || 'Untitled Position',
      company: job.employer_name || 'Unknown Company',
      location: job.job_city
        ? `${job.job_city}, ${job.job_state || ''} ${job.job_is_remote ? '(Remote)' : ''}`
        : job.job_is_remote ? 'Remote' : 'Location not specified',
      description: job.job_description || 'No description available.',
      requirements: extractRequirements(job.job_description || ''),
      applyUrl: job.job_apply_link || '#',
      salary: job.job_min_salary
        ? `$${Math.round(job.job_min_salary / 1000)}k - $${Math.round(job.job_max_salary / 1000)}k`
        : null,
      posted: job.job_posted_at_datetime_utc
        ? formatPostedDate(job.job_posted_at_datetime_utc)
        : 'Recently',
      matchScore: 0,
      strengths: [],
      gaps: [],
      fitCategory: 'low',
    }));
  } catch (err) {
    console.error('JSearch fetch error:', err);
    return [];
  }
}

function extractRequirements(description) {
  const techKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'react', 'angular', 'vue',
    'node.js', 'express', 'django', 'flask', 'sql', 'postgresql', 'mongodb',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'graphql',
    'rest', 'api', 'agile', 'scrum', 'ci/cd', 'terraform',
    // Engineering/construction keywords
    'autocad', 'revit', 'civil 3d', 'primavera', 'ms project', 'staad pro',
    'structural analysis', 'geotechnical', 'hydrology', 'environmental',
    'project management', 'pmp', 'pe license', 'eit', 'fidic',
    'bim', 'gis', 'matlab', 'sap2000', 'etabs'
  ];

  const lower = description.toLowerCase();
  return techKeywords
    .filter(kw => lower.includes(kw))
    .map(kw => kw.charAt(0).toUpperCase() + kw.slice(1))
    .slice(0, 8);
}

function formatPostedDate(dateStr) {
  const posted = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 30)} month${diffDays >= 60 ? 's' : ''} ago`;
}

function getMockJobs({ page = 1 } = {}) {
  const jobs = [
    {
      id: '1', title: 'Senior Frontend Engineer', company: 'Stripe',
      location: 'San Francisco, CA (Remote)',
      description: 'Build and maintain complex UI components for our payments dashboard.',
      requirements: ['React', 'TypeScript', 'CSS', 'GraphQL', 'Testing'],
      applyUrl: 'https://stripe.com/jobs', salary: '$180k - $250k', posted: '2 days ago',
      matchScore: 0, strengths: [], gaps: [], fitCategory: 'low',
    },
    {
      id: '2', title: 'Full Stack Developer', company: 'Notion',
      location: 'New York, NY (Hybrid)',
      description: 'Join our product engineering team to build features used by millions.',
      requirements: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'REST APIs'],
      applyUrl: 'https://notion.so/careers', salary: '$150k - $200k', posted: '1 day ago',
      matchScore: 0, strengths: [], gaps: [], fitCategory: 'low',
    },
    {
      id: '3', title: 'Backend Engineer', company: 'Datadog',
      location: 'Boston, MA (Remote)',
      description: 'Build scalable data pipelines processing billions of events per day.',
      requirements: ['Python', 'Go', 'AWS', 'Kubernetes', 'Kafka'],
      applyUrl: 'https://datadog.com/careers', salary: '$170k - $230k', posted: '3 days ago',
      matchScore: 0, strengths: [], gaps: [], fitCategory: 'low',
    },
    {
      id: '4', title: 'React Developer', company: 'Shopify',
      location: 'Remote (Global)',
      description: 'Build beautiful, performant merchant-facing UIs.',
      requirements: ['React', 'JavaScript', 'CSS', 'Accessibility', 'Performance'],
      applyUrl: 'https://shopify.com/careers', salary: '$140k - $185k', posted: '5 hours ago',
      matchScore: 0, strengths: [], gaps: [], fitCategory: 'low',
    },
  ];

  // If asking for a later page in demo mode, scramble the jobs to simulate "new" results
  if (page > 1) {
    const shuffled = [...jobs].sort(() => 0.5 - Math.random());
    return shuffled.map(j => ({
      ...j,
      id: `${j.id}_p${page}`,
      posted: `Page ${page} Result`
    }));
  }

  return jobs;
}

module.exports = { fetchJobs };
