// ─── Mock Data for Demo Mode ───
// Used when no API keys are configured

export const mockResumeAnalysis = {
  skills: [
    'JavaScript', 'React', 'Node.js', 'Python', 'TypeScript',
    'SQL', 'Git', 'REST APIs', 'CSS', 'HTML'
  ],
  experience: {
    years: 3,
    level: 'Mid-Level',
    summary: 'Full-stack developer with 3 years of experience building web applications using React, Node.js, and Python.'
  },
  education: 'B.S. Computer Science',
  strengthScore: 72,
  feedback: {
    strengths: [
      'Strong JavaScript and React skills — these are in high demand',
      'Good mix of frontend and backend experience',
      'Solid foundation with CS degree',
      'REST API experience is valuable for most roles'
    ],
    weaknesses: [
      'No cloud platform experience (AWS/GCP/Azure) — most companies require this',
      'Missing DevOps skills (Docker, CI/CD, Kubernetes)',
      'No mention of testing frameworks or methodologies',
      'CV lacks quantified impact metrics (numbers, percentages, scale)'
    ],
    suggestions: [
      'Add specific metrics: "Improved page load time by 40%" > "Improved performance"',
      'Include a cloud cert (AWS Solutions Architect is quickest win)',
      'Add testing tools: Jest, Cypress, or Playwright',
      'Rewrite bullet points to follow STAR format (Situation, Task, Action, Result)'
    ]
  },
  brutalFeedback: {
    strengths: [
      'You can actually code — that puts you ahead of 60% of applicants',
      'React + Node combo is still the most employable stack in 2025',
      'Having a CS degree still matters for resume screening'
    ],
    weaknesses: [
      'Your CV screams "junior" — no measurable impact anywhere',
      'Zero cloud experience = instant rejection at most tech companies',
      'You have NO testing experience listed — this is a red flag',
      'Your skills section is generic — so is every other applicant\'s',
      'No leadership or mentoring experience after 3 years is concerning'
    ],
    suggestions: [
      'Rewrite EVERY bullet with numbers or you\'re wasting space',
      'Get AWS certified this month — it takes 2 weeks of study',
      'Add a "Projects" section with deployed apps or die in the ATS black hole',
      'Stop listing HTML/CSS as separate skills — it makes you look junior'
    ]
  }
};

export const mockJobs = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    company: 'Stripe',
    location: 'San Francisco, CA (Remote)',
    description: 'We are looking for a Senior Frontend Engineer to join our Payments team. You will build and maintain complex UI components for our dashboard used by millions of businesses. Requires deep expertise in React, TypeScript, and performance optimization.',
    requirements: ['React', 'TypeScript', 'CSS', 'Performance Optimization', 'GraphQL', 'Testing'],
    matchScore: 74,
    strengths: ['Strong React and JavaScript experience matches core requirements', 'Frontend focus aligns with your background', 'REST API skills transfer well to GraphQL'],
    gaps: ['Missing TypeScript depth — listed but no projects demonstrate it', 'No GraphQL experience', 'Role requires 5+ years, you have 3'],
    fitCategory: 'reach',
    applyUrl: 'https://stripe.com/jobs',
    salary: '$180k - $250k',
    posted: '2 days ago'
  },
  {
    id: '2',
    title: 'Full Stack Developer',
    company: 'Notion',
    location: 'New York, NY (Hybrid)',
    description: 'Join our product engineering team to build features used by millions. We use React, Node.js, and PostgreSQL. Looking for someone who can own features end-to-end from design to deployment.',
    requirements: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'REST APIs'],
    matchScore: 88,
    strengths: ['Your React + Node.js stack directly matches', 'Full-stack experience is exactly what they want', 'SQL experience covers PostgreSQL requirement'],
    gaps: ['TypeScript required — need to demonstrate deeper proficiency', 'No mention of feature ownership experience in your CV'],
    fitCategory: 'strong',
    applyUrl: 'https://notion.so/careers',
    salary: '$150k - $200k',
    posted: '1 day ago'
  },
  {
    id: '3',
    title: 'Backend Engineer',
    company: 'Datadog',
    location: 'Boston, MA (Remote)',
    description: 'Join the infrastructure team to build scalable data pipelines processing billions of events per day. Deep experience with distributed systems, Go or Python, and cloud platforms required.',
    requirements: ['Python', 'Go', 'AWS', 'Distributed Systems', 'Kubernetes', 'Kafka'],
    matchScore: 42,
    strengths: ['Python experience is a match', 'Understanding of REST APIs shows systems thinking'],
    gaps: ['No Go experience — primary backend language', 'No cloud platform (AWS) experience', 'No distributed systems background', 'Kubernetes and Kafka are required but missing'],
    fitCategory: 'low',
    applyUrl: 'https://datadog.com/careers',
    salary: '$170k - $230k',
    posted: '3 days ago'
  },
  {
    id: '4',
    title: 'React Developer',
    company: 'Shopify',
    location: 'Remote (Global)',
    description: 'Build beautiful, performant merchant-facing UIs. We need someone who loves React, cares deeply about UX, and can work across time zones. Experience with e-commerce is a plus.',
    requirements: ['React', 'JavaScript', 'CSS', 'HTML', 'Accessibility', 'Performance'],
    matchScore: 91,
    strengths: ['React, JS, CSS, HTML — you check every core box', 'Frontend skill set perfectly aligns', 'Remote-friendly culture matches flexibility'],
    gaps: ['No accessibility (a11y) experience mentioned', 'No e-commerce domain experience'],
    fitCategory: 'strong',
    applyUrl: 'https://shopify.com/careers',
    salary: '$140k - $185k',
    posted: '5 hours ago'
  },
  {
    id: '5',
    title: 'Software Engineer II',
    company: 'Google',
    location: 'Mountain View, CA',
    description: 'Join Google Cloud to build next-generation developer tools. You will work on large-scale systems using C++, Java, or Python. Strong CS fundamentals and system design skills are essential.',
    requirements: ['Python', 'C++', 'Java', 'System Design', 'Algorithms', 'Cloud Platforms'],
    matchScore: 55,
    strengths: ['Python experience is relevant', 'CS degree covers fundamentals requirement', 'Algorithm knowledge from degree program'],
    gaps: ['No C++ or Java experience', 'No system design experience demonstrated', 'No cloud platform experience', 'Google expects 4+ years for L4'],
    fitCategory: 'low',
    applyUrl: 'https://careers.google.com',
    salary: '$160k - $240k',
    posted: '1 week ago'
  },
  {
    id: '6',
    title: 'Frontend Engineer',
    company: 'Vercel',
    location: 'Remote (US)',
    description: 'Help build the future of web development. Work on Next.js, our dashboard, and developer tools. Deep React expertise and passion for great developer experience required.',
    requirements: ['React', 'Next.js', 'TypeScript', 'Node.js', 'CSS', 'Performance'],
    matchScore: 82,
    strengths: ['Strong React and Node.js directly applicable', 'CSS expertise matches requirement', 'Your web dev background aligns with the mission'],
    gaps: ['No Next.js specific experience', 'TypeScript proficiency needs demonstration'],
    fitCategory: 'strong',
    applyUrl: 'https://vercel.com/careers',
    salary: '$155k - $210k',
    posted: '4 days ago'
  }
];

export const mockCVRewrite = {
  tailoredCV: `John Doe\nSoftware Engineer\n\nExperience:\n- Led development of 12+ production React features, driving a 23% improvement in user engagement and reducing page bounce rates by 15%\n\nSkills:\nReact, TypeScript, Next.js`,
  changes: [
    {
      original: 'Worked on frontend features using React',
      rewritten: 'Architected and shipped 12+ customer-facing React features, driving a 23% improvement in user engagement and reducing page bounce rates by 15%',
      reason: 'Added specific metrics and strong action verbs to demonstrate impact.'
    }
  ],
  keywordSuggestions: ['TypeScript', 'performance optimization', 'CI/CD', 'component architecture', 'A/B testing'],
  atsTips: [
    'Use exact job title keywords from the posting in your experience section',
    'Include the company\'s tech stack in your skills section',
    'Quantify every achievement — recruiters scan for numbers first',
    'Use active verbs: "Architected", "Shipped", "Optimized" > "Worked on", "Helped with"'
  ]
};
