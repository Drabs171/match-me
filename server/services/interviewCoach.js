// Try to load Anthropic SDK
let Anthropic;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch {
  Anthropic = null;
}

/** Strip markdown code fences from Claude's JSON responses */
function cleanJSON(text) {
  let cleaned = text.trim();
  // Remove ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  return cleaned;
}

/**
 * Analyze a job + CV and generate a full interview prep package
 */
async function analyzeAndGenerateInterview({ jobTitle, company, jobDescription, resumeText, matchScore }) {
  if (!process.env.ANTHROPIC_API_KEY || !Anthropic) {
    return getMockInterviewPrep(jobTitle, company, matchScore);
  }

  const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are an elite career coach, recruiter, and interview strategist. Analyze this job and candidate, then generate a complete interview preparation package.

JOB TITLE: ${jobTitle}
COMPANY: ${company}
JOB DESCRIPTION:
${(jobDescription || '').substring(0, 4000)}

${resumeText ? `CANDIDATE'S CV:
${resumeText.substring(0, 30000)}` : 'No CV available — generate general interview questions for this role.'}

MATCH SCORE: ${matchScore || 'N/A'}%

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "companyAnalysis": {
    "summary": "<2-3 sentence summary of what the company does and its culture>",
    "likelyCares": ["<value 1>", "<value 2>", ...],
    "companyTone": "<e.g. fast-paced startup, corporate enterprise, mission-driven nonprofit>",
    "hiringManagerPriorities": ["<priority 1>", "<priority 2>", ...]
  },
  "roleAnalysis": {
    "summary": "<2-3 sentence summary of what this role involves day-to-day>",
    "topSkills": ["<skill 1>", "<skill 2>", ...],
    "dayToDay": ["<daily task 1>", "<daily task 2>", ...],
    "successLooksLike": "<1-2 sentences on what success in this role would look like>"
  },
  "cvWeakSpots": [
    {"area": "<weak area>", "concern": "<why an interviewer would probe this>"}
  ],
  "likelyInterviewerConcerns": ["<concern 1>", "<concern 2>", ...],
  "interviewFocusAreas": ["<focus 1>", "<focus 2>", ...],
  "questions": [
    {
      "id": 1,
      "category": "<Introduction|Company-Fit|Values|Competency|Behavioural|Situational|Technical|Day-to-Day|CV-Challenge|Closing>",
      "question": "<the interview question>",
      "why": "<why this question matters for this role>",
      "suggestedAnswer": "<a strong sample answer tailored to this role and CV>",
      "criticalFollowUp": "<a tough follow-up a critical interviewer would ask>"
    }
  ]
}

Generate exactly 12-15 questions across ALL categories. Make questions SPECIFIC to ${company} and ${jobTitle} — NOT generic.
${resumeText ? 'Include at least 3 CV-Challenge questions that probe weak spots, vague claims, gaps, or unsupported achievements in the CV.' : ''}
For CV-Challenge questions, reference specific things from the CV.
For Closing questions, suggest smart questions the CANDIDATE should ask the employer.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].text;
    return JSON.parse(cleanJSON(content));
  } catch (e) {
    console.error('Interview prep generation error:', e.message);
    return getMockInterviewPrep(jobTitle, company, matchScore);
  }
}

/**
 * Evaluate a user's answer to an interview question
 */
async function evaluateAnswer({ question, answer, jobTitle, company, jobDescription, resumeText, criticalMode }) {
  if (!process.env.ANTHROPIC_API_KEY || !Anthropic) {
    return getMockEvaluation(criticalMode);
  }

  const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

  const modeInstruction = criticalMode
    ? `You are a CRITICAL, DEMANDING interviewer. You are:
- Skeptical of vague or rehearsed-sounding answers
- Relentless in asking for evidence, metrics, and specifics
- Quick to challenge inflated claims
- Testing whether the candidate truly owns their achievements vs riding team results
- Direct and professional, but NOT rude or insulting
- Looking for depth, not surface-level responses
When the answer is weak, say so clearly. Generate a tough, skeptical follow-up question.`
    : `You are a fair but thorough interviewer. Provide balanced, constructive feedback.`;

  const prompt = `${modeInstruction}

You are evaluating a candidate's answer during a mock interview.

ROLE: ${jobTitle} at ${company}
JOB CONTEXT: ${(jobDescription || '').substring(0, 2000)}
${resumeText ? `CANDIDATE CV CONTEXT: ${resumeText.substring(0, 30000)}` : ''}

INTERVIEW QUESTION: ${question}

CANDIDATE'S ANSWER: ${answer}

Evaluate this answer and return ONLY valid JSON:
{
  "overallScore": <0-10>,
  "scores": {
    "relevance": <0-10>,
    "clarity": <0-10>,
    "confidence": <0-10>,
    "roleAlignment": <0-10>,
    "evidence": <0-10>,
    "specificity": <0-10>,
    "credibility": <0-10>,
    "communication": <0-10>
  },
  "whatWorked": ["<strength 1>", "<strength 2>"],
  "whatWasWeak": ["<weakness 1>", "<weakness 2>"],
  "whatWasMissing": ["<missing element 1>", "<missing element 2>"],
  "whatSoundedVague": ["<vague part 1>"],
  "strongerAnswer": "<a complete, stronger version of the answer that this candidate could realistically give based on their CV>",
  "followUpQuestion": "<a ${criticalMode ? 'tough, skeptical' : 'natural'} follow-up question based on their answer>",
  "coachNote": "<1-2 sentences of coaching advice>"
}

${criticalMode ? 'Be DEMANDING. If the answer lacks specifics, metrics, or proof — call it out directly. Score harshly but fairly.' : 'Be constructive and encouraging while being honest about weaknesses.'}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].text;
    return JSON.parse(cleanJSON(content));
  } catch (e) {
    console.error('Answer evaluation error:', e.message);
    return getMockEvaluation(criticalMode);
  }
}

/**
 * Generate final interview summary
 */
async function generateInterviewSummary({ questionsAndAnswers, jobTitle, company, resumeText }) {
  if (!process.env.ANTHROPIC_API_KEY || !Anthropic) {
    return getMockSummary();
  }

  const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

  const qaText = questionsAndAnswers.map((qa, i) =>
    `Q${i + 1} [${qa.category}]: ${qa.question}\nAnswer: ${qa.answer}\nScore: ${qa.score}/10`
  ).join('\n\n');

  const prompt = `You are a senior interview coach. A candidate just completed a full mock interview for the role of ${jobTitle} at ${company}.

Here is every question, answer, and score:

${qaText}

${resumeText ? `Their CV:\n${resumeText.substring(0, 30000)}` : ''}

Generate a comprehensive interview summary. Return ONLY valid JSON:
{
  "readinessScore": <0-100>,
  "readinessLevel": "<Not Ready|Needs Work|Getting There|Interview Ready|Strong Candidate>",
  "strongestAreas": ["<area 1>", "<area 2>", "<area 3>"],
  "weakestAreas": ["<area 1>", "<area 2>", "<area 3>"],
  "likelyConcernsForInterviewer": ["<concern 1>", "<concern 2>"],
  "credibilityRisks": ["<risk 1>", "<risk 2>"],
  "vagueAnswers": ["<summary of vague answer 1>", "<summary of vague answer 2>"],
  "top5ImprovementsBeforeInterview": ["<improvement 1>", "<improvement 2>", "<improvement 3>", "<improvement 4>", "<improvement 5>"],
  "top5CVFixes": ["<fix 1>", "<fix 2>", "<fix 3>", "<fix 4>", "<fix 5>"],
  "questionsToAskEmployer": ["<smart question 1>", "<smart question 2>", "<smart question 3>", "<smart question 4>", "<smart question 5>"],
  "overallCoachingNote": "<2-3 paragraph coaching summary — be direct, honest, and actionable>"
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].text;
    return JSON.parse(cleanJSON(content));
  } catch (e) {
    console.error('Summary generation error:', e.message);
    return getMockSummary();
  }
}

// ─── Mock Data Fallbacks ───

function getMockInterviewPrep(jobTitle, company, matchScore) {
  return {
    companyAnalysis: {
      summary: `${company} is a technology company focused on building products used by millions. They value engineering excellence, collaboration, and shipping quality software.`,
      likelyCares: ['Technical depth', 'Ownership mentality', 'Shipping velocity', 'Team collaboration', 'User empathy'],
      companyTone: 'Fast-paced, product-driven tech company',
      hiringManagerPriorities: ['Can this person ship features independently?', 'Do they have depth in our stack?', 'Will they raise the bar for the team?']
    },
    roleAnalysis: {
      summary: `As a ${jobTitle} at ${company}, you would own features end-to-end from design to deployment. Day-to-day involves writing production code, code reviews, and collaborating with product and design.`,
      topSkills: ['React', 'Node.js', 'System Design', 'Testing', 'Communication'],
      dayToDay: ['Write and review production code', 'Collaborate with product managers on feature specs', 'Debug and resolve production issues', 'Participate in sprint planning and standups', 'Mentor junior developers'],
      successLooksLike: 'Shipping high-quality features on time, reducing tech debt, and becoming a go-to person for your area of the codebase.'
    },
    cvWeakSpots: [
      { area: 'Impact metrics', concern: 'Several bullet points lack quantified results — interviewers will probe for numbers' },
      { area: 'Leadership claims', concern: '"Led" appears without team size or scope — expect challenges on what you actually owned' },
      { area: 'Tech stack gaps', concern: 'Some required skills are listed but not demonstrated with specific projects' }
    ],
    likelyInterviewerConcerns: [
      'Can they work independently or do they need heavy guidance?',
      'Do they have real depth or just surface-level experience?',
      'Can they handle ambiguity and changing requirements?'
    ],
    interviewFocusAreas: ['Technical problem-solving', 'System design', 'Ownership & initiative', 'Communication skills', 'Cultural fit'],
    questions: [
      { id: 1, category: 'Introduction', question: 'Walk me through your background and what brought you to apply for this role.', why: 'Tests self-awareness and narrative clarity', suggestedAnswer: 'Start with your most relevant experience, connect it to this specific role, and explain why this company excites you. Keep it under 2 minutes.', criticalFollowUp: 'That was a nice summary, but what specifically about this role excited you enough to apply?' },
      { id: 2, category: 'Company-Fit', question: `Why ${company} specifically? What do you know about how we work?`, why: 'Tests research depth and genuine interest', suggestedAnswer: 'Reference specific products, recent news, or values. Show you understand their mission.', criticalFollowUp: 'You mentioned our product — but have you actually used it? What would you change?' },
      { id: 3, category: 'Competency', question: 'Describe a feature you built end-to-end. What were the technical decisions you made and why?', why: 'Tests technical ownership and decision-making', suggestedAnswer: 'Pick a specific feature, explain the architecture decisions, tradeoffs you considered, and the outcome.', criticalFollowUp: 'What would you do differently if you had to build it again?' },
      { id: 4, category: 'Behavioural', question: 'Tell me about a time you disagreed with a technical decision. How did you handle it?', why: 'Tests conflict resolution and communication', suggestedAnswer: 'Use STAR format: describe the situation, your perspective, how you communicated it, and the outcome.', criticalFollowUp: 'Did you actually change the outcome, or did you just go along with it?' },
      { id: 5, category: 'Situational', question: 'You discover a critical bug in production on a Friday afternoon. Walk me through your response.', why: 'Tests crisis management and prioritization', suggestedAnswer: 'Show your incident response process: assess severity, communicate to stakeholders, fix or rollback, then post-mortem.', criticalFollowUp: 'What if the fix requires changing code written by someone else who is on vacation?' },
      { id: 6, category: 'Technical', question: 'How would you design a system that handles real-time data updates for thousands of concurrent users?', why: 'Tests system design thinking', suggestedAnswer: 'Discuss WebSockets or SSE, load balancing, caching layers, and how you would handle failures.', criticalFollowUp: 'What happens when your WebSocket server crashes under load? How do you recover?' },
      { id: 7, category: 'CV-Challenge', question: 'Your CV says you "led" a project. How large was the team, and what decisions were specifically yours?', why: 'Tests whether leadership claim is substantiated', suggestedAnswer: 'Be specific: team size, your exact responsibilities, decisions you made, and outcomes you drove.', criticalFollowUp: 'If I spoke to your manager, what would they say your specific contribution was?' },
      { id: 8, category: 'CV-Challenge', question: 'You mention improving performance. By how much? How did you measure it?', why: 'Tests whether claims have evidence', suggestedAnswer: 'Give exact metrics: load time reduced from X to Y, throughput increased by Z%.', criticalFollowUp: 'How do you know the improvement was specifically because of your change and not other factors?' },
      { id: 9, category: 'CV-Challenge', question: 'There seems to be a gap between these two roles. What were you doing during that period?', why: 'Tests transparency and honesty', suggestedAnswer: 'Be honest and frame it positively — learning, freelancing, personal development.', criticalFollowUp: 'What specifically did you learn during that time that makes you better for this role?' },
      { id: 10, category: 'Values', question: 'What does quality code mean to you? How do you balance speed and quality?', why: 'Tests engineering values alignment', suggestedAnswer: 'Discuss testing, code review, documentation, and when you make pragmatic tradeoffs.', criticalFollowUp: 'Give me an example where you shipped something you were not proud of. What happened?' },
      { id: 11, category: 'Day-to-Day', question: 'Walk me through how you would approach your first 30 days in this role.', why: 'Tests onboarding mindset and initiative', suggestedAnswer: 'Week 1: understand codebase and team processes. Week 2-3: ship a small fix. Week 4: take on a meaningful feature.', criticalFollowUp: 'What if the codebase is a mess and documentation is nonexistent? How do you adapt?' },
      { id: 12, category: 'Closing', question: 'What questions do you have for us?', why: 'Tests genuine curiosity and preparation', suggestedAnswer: 'Ask about team structure, biggest technical challenges, how success is measured, and growth opportunities.', criticalFollowUp: 'N/A — this is the candidate asking questions' }
    ]
  };
}

function getMockEvaluation(criticalMode) {
  return {
    overallScore: criticalMode ? 5 : 7,
    scores: {
      relevance: criticalMode ? 6 : 7,
      clarity: criticalMode ? 5 : 7,
      confidence: criticalMode ? 5 : 6,
      roleAlignment: criticalMode ? 6 : 7,
      evidence: criticalMode ? 4 : 6,
      specificity: criticalMode ? 4 : 6,
      credibility: criticalMode ? 5 : 7,
      communication: criticalMode ? 6 : 7
    },
    whatWorked: ['You addressed the question directly', 'Good mention of relevant experience'],
    whatWasWeak: criticalMode
      ? ['Too vague — no specific numbers or metrics', 'Sounds rehearsed rather than authentic', 'Missing concrete examples']
      : ['Could use more specific examples', 'Consider adding metrics to strengthen your claim'],
    whatWasMissing: ['Quantified results', 'Specific technical details', 'Connection to this role specifically'],
    whatSoundedVague: criticalMode
      ? ['The entire answer lacked depth — it could apply to any role at any company']
      : ['Some claims could be more specific'],
    strongerAnswer: 'In my previous role at [Company], I owned the development of [specific feature] serving [X users]. I designed the architecture using [specific tech], which reduced [metric] by [X%]. The project involved a team of [N], and I was specifically responsible for [exact responsibilities]. This experience directly maps to this role because [connection].',
    followUpQuestion: criticalMode
      ? 'That still sounds general. What was the measurable outcome, and how do you know it was your contribution specifically?'
      : 'Can you elaborate on the technical approach you took?',
    coachNote: criticalMode
      ? 'You need to go deeper. Every claim needs proof — numbers, metrics, specific examples. Practice answering with the format: "I did X, which resulted in Y, measured by Z."'
      : 'Solid foundation. Add more specific metrics and connect your experience directly to this role to make it stronger.'
  };
}

function getMockSummary() {
  return {
    readinessScore: 62,
    readinessLevel: 'Needs Work',
    strongestAreas: ['Communication clarity', 'Technical knowledge', 'Enthusiasm for the role'],
    weakestAreas: ['Lack of specific metrics', 'Vague leadership claims', 'Insufficient company research'],
    likelyConcernsForInterviewer: ['Candidate may not have the depth they claim', 'Unclear on independent vs team achievements'],
    credibilityRisks: ['Performance claims without numbers', 'Leadership language without evidence of scope'],
    vagueAnswers: ['Answer about leading a project lacked team size and scope', 'Performance improvement claim had no metrics'],
    top5ImprovementsBeforeInterview: [
      'Prepare 3-5 specific stories with metrics (STAR format)',
      'Research the company\'s recent products and challenges',
      'Practice explaining your unique contribution vs team achievements',
      'Prepare thoughtful questions that show genuine interest',
      'Rehearse your introduction — keep it under 90 seconds'
    ],
    top5CVFixes: [
      'Add metrics to every bullet point (%, $, time saved)',
      'Replace "led" with specific scope (team of X, budget of $Y)',
      'Remove vague phrases like "various technologies"',
      'Add a skills section that matches this job\'s requirements',
      'Explain career transitions briefly to address gap concerns'
    ],
    questionsToAskEmployer: [
      'What does the first 90-day success plan look like for this role?',
      'What is the team\'s biggest technical challenge right now?',
      'How does the engineering team balance shipping speed with code quality?',
      'What growth opportunities exist for someone in this role?',
      'Can you tell me about the team I\'d be working with directly?'
    ],
    overallCoachingNote: 'You have the right energy and a solid technical foundation, but your answers lack the specificity that separates good candidates from great ones. Every interviewer wants proof — not claims. Before your real interview, prepare 5 concrete stories with clear metrics. Know exactly what YOU did versus what the team did.\n\nYour biggest risk is sounding rehearsed without depth. When pushed, you need to go deeper with real numbers and real examples. Practice with a friend who will challenge vague answers.\n\nThe good news: your technical knowledge is strong and your communication is clear. With better preparation on specifics, you can move from "maybe" to "definitely hire."'
  };
}

module.exports = { analyzeAndGenerateInterview, evaluateAnswer, generateInterviewSummary };
