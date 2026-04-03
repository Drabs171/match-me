/**
 * Matching Engine — scores resume against job listings
 *
 * Uses fuzzy text matching for real-world accuracy:
 *   Skills overlap:    35%
 *   Experience level:  25%
 *   Description match: 30%
 *   Education:         10%
 */

function matchResumeToJobs(resume, jobs) {
  // Build a comprehensive search corpus from the resume
  const resumeCorpus = buildResumeCorpus(resume);

  return jobs.map(job => {
    const scores = computeScores(resume, job, resumeCorpus);
    const totalScore = Math.round(
      scores.skills * 0.35 +
      scores.experience * 0.25 +
      scores.description * 0.30 +
      scores.education * 0.10
    );

    const strengths = generateStrengths(resume, job, scores);
    const gaps = generateGaps(resume, job, scores);

    return {
      ...job,
      matchScore: totalScore,
      strengths,
      gaps,
      fitCategory: totalScore >= 80 ? 'strong' : totalScore >= 60 ? 'reach' : 'low',
    };
  });
}

/**
 * Build a searchable text corpus from the resume
 */
function buildResumeCorpus(resume) {
  const parts = [];

  // Skills
  if (resume.skills) {
    parts.push(...resume.skills.map(s => s.toLowerCase()));
  }

  // Experience summary
  if (resume.experience?.summary) {
    parts.push(resume.experience.summary.toLowerCase());
  }

  // Education
  if (resume.education) {
    parts.push(resume.education.toLowerCase());
  }

  // Raw resume text (most important for fuzzy matching)
  if (resume.resumeText) {
    parts.push(resume.resumeText.toLowerCase());
  }

  return parts.join(' ');
}

/**
 * Tokenize text into meaningful words (3+ chars, no stop words)
 */
function tokenize(text) {
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
    'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'from',
    'they', 'will', 'with', 'this', 'that', 'what', 'when', 'make', 'like',
    'each', 'just', 'than', 'then', 'very', 'also', 'into', 'over', 'such',
    'most', 'some', 'well', 'here', 'them', 'only', 'come', 'its', 'more',
    'work', 'year', 'years', 'about', 'would', 'there', 'their', 'which',
    'could', 'other', 'were', 'being', 'must', 'should', 'does', 'shall',
    'working', 'including', 'ability', 'strong', 'experience', 'required',
    'preferred', 'knowledge', 'understanding', 'responsibilities',
    'requirements', 'qualifications', 'position', 'role', 'candidate',
    'looking', 'join', 'team', 'company', 'opportunity', 'apply',
  ]);

  return text.toLowerCase()
    .split(/[\s,;:.()\[\]{}|/\\]+/)
    .map(w => w.replace(/[^a-z0-9\-+#]/g, ''))
    .filter(w => w.length >= 3 && !stopWords.has(w));
}

/**
 * Find n-gram matches (bigrams and trigrams) for better phrase matching
 */
function getNGrams(words, n) {
  const grams = [];
  for (let i = 0; i <= words.length - n; i++) {
    grams.push(words.slice(i, i + n).join(' '));
  }
  return grams;
}

function computeScores(resume, job, resumeCorpus) {
  const jobDesc = (job.description || '').toLowerCase();
  const jobTitle = (job.title || '').toLowerCase();
  const resumeSkills = (resume.skills || []).map(s => s.toLowerCase());

  // ── 1) Skills Score: fuzzy matching against job description ──
  let skillMatches = 0;
  for (const skill of resumeSkills) {
    // Split multi-word skills and check if they appear in job desc
    const skillWords = skill.split(/[\s&,\/]+/).filter(w => w.length >= 3);
    const found = skillWords.some(sw => jobDesc.includes(sw) || jobTitle.includes(sw));
    if (found) skillMatches++;
  }
  // Also check if job requirements overlap with skills
  const jobReqs = (job.requirements || []).map(r => r.toLowerCase());
  for (const req of jobReqs) {
    if (resumeCorpus.includes(req)) skillMatches++;
  }
  const totalSkillChecks = resumeSkills.length + jobReqs.length;
  const skillsScore = totalSkillChecks > 0
    ? Math.min(100, Math.round((skillMatches / totalSkillChecks) * 100 * 1.5)) // boost factor
    : 50;

  // ── 2) Experience Level Score ──
  const resumeYears = resume.experience?.years || 0;
  let requiredYears = 2;
  const yearMatch = jobDesc.match(/(\d+)\+?\s*years?/);
  if (yearMatch) requiredYears = parseInt(yearMatch[1]);
  if (jobTitle.includes('senior') || jobTitle.includes('sr.')) requiredYears = Math.max(requiredYears, 5);
  if (jobTitle.includes('lead') || jobTitle.includes('principal')) requiredYears = Math.max(requiredYears, 7);
  if (jobTitle.includes('director') || jobTitle.includes('vp')) requiredYears = Math.max(requiredYears, 10);
  if (jobTitle.includes('junior') || jobTitle.includes('jr.') || jobTitle.includes('entry')) requiredYears = Math.min(requiredYears, 2);

  let experienceScore;
  if (resumeYears >= requiredYears) {
    experienceScore = 100;
  } else if (resumeYears >= requiredYears * 0.75) {
    experienceScore = 80;
  } else if (resumeYears >= requiredYears * 0.5) {
    experienceScore = 60;
  } else {
    experienceScore = Math.max(20, Math.round(100 * (resumeYears / requiredYears)));
  }

  // ── 3) Description Match Score: token overlap between resume and job ──
  const jobTokens = [...new Set(tokenize(jobDesc))];
  const jobBigrams = [...new Set(getNGrams(tokenize(jobDesc), 2))];
  
  // Check unigram overlap
  const unigramMatches = jobTokens.filter(t => resumeCorpus.includes(t)).length;
  const unigramScore = jobTokens.length > 0
    ? (unigramMatches / jobTokens.length) * 100
    : 50;

  // Check bigram overlap (phrase matching is more meaningful)
  const bigramMatches = jobBigrams.filter(bg => resumeCorpus.includes(bg)).length;
  const bigramScore = jobBigrams.length > 0
    ? (bigramMatches / jobBigrams.length) * 100
    : 50;

  // Weighted combo: bigrams matter more
  const descriptionScore = Math.min(100, Math.round(unigramScore * 0.4 + bigramScore * 0.6 + 10)); // +10 base boost

  // ── 4) Education Score ──
  const educLevel = (resume.education || '').toLowerCase();
  let educationScore = 50;
  if (educLevel.includes('ph.d') || educLevel.includes('doctorate')) educationScore = 100;
  else if (educLevel.includes('master') || educLevel.includes('m.s.') || educLevel.includes('mba') || educLevel.includes('msc')) educationScore = 85;
  else if (educLevel.includes('bachelor') || educLevel.includes('b.s.') || educLevel.includes('b.a.') || educLevel.includes('bsc') || educLevel.includes('beng') || educLevel.includes('b.eng')) educationScore = 70;
  else if (educLevel.includes('diploma') || educLevel.includes('associate') || educLevel.includes('certificate')) educationScore = 55;

  // Boost education if field matches job domain
  if (resumeSkills.some(s => jobTitle.includes(s.split(/\s+/)[0]))) {
    educationScore = Math.min(100, educationScore + 10);
  }

  return {
    skills: Math.min(100, skillsScore),
    experience: Math.min(100, experienceScore),
    description: Math.min(100, descriptionScore),
    education: Math.min(100, educationScore),
  };
}

function generateStrengths(resume, job, scores) {
  const strengths = [];
  const resumeSkills = (resume.skills || []).map(s => s.toLowerCase());
  const jobDesc = (job.description || '').toLowerCase();
  const jobTitle = (job.title || '').toLowerCase();

  // Find which skills actually matched
  const matchedSkills = resumeSkills.filter(skill => {
    const words = skill.split(/[\s&,\/]+/).filter(w => w.length >= 3);
    return words.some(w => jobDesc.includes(w) || jobTitle.includes(w));
  });

  if (matchedSkills.length > 0) {
    const display = matchedSkills.slice(0, 3).map(s =>
      s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    );
    strengths.push(`Your ${display.join(', ')} skills directly match this role`);
  }

  if (scores.experience >= 80) {
    strengths.push(`Your experience level aligns well with this role`);
  }

  if (scores.description >= 60) {
    strengths.push(`Strong keyword overlap with the job description`);
  }

  if (scores.education >= 70) {
    strengths.push(`Your education background meets the expectations`);
  }

  if (strengths.length === 0) {
    strengths.push('Some transferable skills detected');
  }

  return strengths;
}

function generateGaps(resume, job, scores) {
  const gaps = [];
  const resumeSkills = (resume.skills || []).map(s => s.toLowerCase());
  const jobReqs = (job.requirements || []).map(r => r.toLowerCase());
  const missing = jobReqs.filter(r => !resumeSkills.some(s => s.includes(r) || r.includes(s)));

  if (missing.length > 0) {
    gaps.push(`Missing listed requirements: ${missing.slice(0, 3).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}`);
  }

  if (scores.experience < 60) {
    gaps.push(`Experience level may be below what's expected for this role`);
  }

  if (scores.description < 40) {
    gaps.push(`Resume keywords don't align well with the job description`);
  }

  return gaps;
}

module.exports = { matchResumeToJobs };
