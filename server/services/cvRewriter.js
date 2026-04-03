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
 * Rewrite CV bullets for a specific job using Claude
 */
async function rewriteCV({ resumeText, jobDescription, jobTitle }) {
  if (process.env.ANTHROPIC_API_KEY && Anthropic) {
    return await rewriteWithClaude({ resumeText, jobDescription, jobTitle });
  }
  return getMockRewrite({ jobTitle, resumeText });
}

async function rewriteWithClaude({ resumeText, jobDescription, jobTitle }) {
  const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: `You are a professional CV consultant. A candidate wants to tailor their CV for this specific job.

JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${(jobDescription || '').substring(0, 8000)}

${resumeText ? `CANDIDATE'S CURRENT CV TEXT:\n${resumeText.substring(0, 30000)}` : 'No CV text provided — give generic improvement advice for this role.'}

Your response MUST follow this EXACT format with no deviation:

METADATA_START
{
  "changes": [
    {
      "original": "<exact old text that was changed>",
      "rewritten": "<the new improved text>",
      "reason": "<short explanation of why it was changed for this specific job>"
    }
  ],
  "keywordSuggestions": ["<keyword1>", "<keyword2>"],
  "atsTips": ["<tip1>", "<tip2>"]
}
METADATA_END

CV_START
<Write the COMPLETE, fully rewritten CV here as plain text. Preserve all sections. Rewrite bullet points to emphasise relevance to the job. Do NOT summarise — include every section from the original.>
CV_END

Rules:
- Rewrite the ENTIRE CV — do not truncate or summarise.
- Keep ALL sections: Contact, Summary, Experience, Education, Skills, Certifications, etc.
- Include 3-5 changes in the metadata.
- METADATA block must be valid JSON with no markdown fences.`
      }
    ]
  });

  try {
    const raw = response.content[0].text;

    // Extract metadata JSON
    const metaMatch = raw.match(/METADATA_START\s*([\s\S]*?)\s*METADATA_END/);
    const metaJSON = metaMatch ? JSON.parse(cleanJSON(metaMatch[1])) : {};

    // Extract the full CV text
    const cvMatch = raw.match(/CV_START\s*([\s\S]*?)\s*CV_END/);
    const tailoredCV = cvMatch ? cvMatch[1].trim() : raw;

    return {
      tailoredCV,
      changes: metaJSON.changes || [],
      keywordSuggestions: metaJSON.keywordSuggestions || [],
      atsTips: metaJSON.atsTips || [],
    };
  } catch (e) {
    console.error('Failed to parse Claude response in cvRewriter:', e);
    return getMockRewrite({ jobTitle, resumeText });
  }
}

function getMockRewrite({ jobTitle, resumeText }) {
  const mockCV = resumeText ? resumeText : `John Doe
Software Engineer

Experience:
- Worked on frontend features using React

Skills:
React, HTML, CSS`;

  const tailored = mockCV.replace(
    'Worked on frontend features using React',
    `Led development of 12+ production React features for ${jobTitle || 'the role'}, driving 23% improvement in user engagement and reducing page bounce rates by 15% through performance optimization and A/B tested UX improvements`
  );

  return {
    tailoredCV: tailored,
    changes: [
      {
        original: 'Worked on frontend features using React',
        rewritten: `Led development of 12+ production React features for ${jobTitle || 'the role'}...`,
        reason: 'Added specific metrics and tied the experience directly to the expected responsibilities of this role.'
      }
    ],
    keywordSuggestions: [
      'performance optimization',
      'component architecture',
      'CI/CD pipeline',
      'TypeScript migration',
      'A/B testing',
      'cross-functional collaboration'
    ],
    atsTips: [
      `Use "${jobTitle || 'the exact role title'}" in your resume header and summary section`,
      'Quantify every achievement — recruiters scan for numbers first',
      'Mirror the exact technical terms from the job posting in your skills section',
      'Use strong action verbs: "Architected", "Shipped", "Optimized" instead of "Worked on", "Helped with"'
    ]
  };
}

module.exports = { rewriteCV };
