/**
 * AI/ML ATS Resume Scorer — TF-IDF, cosine similarity, keyword coverage,
 * and domain skill matching (no external ML deps).
 */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its', 'this', 'that', 'these',
  'those', 'i', 'you', 'he', 'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'when',
  'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'just', 'also', 'now', 'here', 'there', 'then', 'once', 'if', 'about', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
  'our', 'your', 'their', 'my', 'me', 'him', 'her', 'us', 'them', 'any', 'work', 'working',
  'experience', 'years', 'year', 'role', 'team', 'using', 'use', 'used', 'including',
]);

const AIML_SKILLS = [
  'python', 'pytorch', 'tensorflow', 'keras', 'scikit-learn', 'sklearn', 'scikit learn',
  'machine learning', 'deep learning', 'artificial intelligence', 'ai', 'ml', 'dl',
  'nlp', 'natural language processing', 'computer vision', 'cv',
  'transformer', 'transformers', 'bert', 'gpt', 'llm', 'large language model',
  'neural network', 'neural networks', 'cnn', 'rnn', 'lstm', 'gan', 'autoencoder',
  'reinforcement learning', 'supervised learning', 'unsupervised learning',
  'feature engineering', 'hyperparameter tuning', 'cross validation', 'grid search',
  'pandas', 'numpy', 'matplotlib', 'seaborn', 'jupyter', 'notebook',
  'mlops', 'docker', 'kubernetes', 'k8s', 'ci/cd', 'cicd',
  'aws', 'gcp', 'azure', 'sagemaker', 'vertex ai',
  'sql', 'postgresql', 'mongodb', 'spark', 'hadoop', 'etl', 'data pipeline',
  'hugging face', 'huggingface', 'langchain', 'openai', 'rag', 'fine-tuning', 'finetuning',
  'xgboost', 'lightgbm', 'random forest', 'svm', 'logistic regression',
  'opencv', 'yolo', 'resnet', 'attention mechanism', 'embedding', 'vector database',
  'fastapi', 'flask', 'django', 'rest api', 'graphql',
  'git', 'github', 'gitlab', 'jira', 'agile', 'scrum',
  'statistics', 'probability', 'linear algebra', 'calculus', 'optimization',
  'a/b testing', 'ab testing', 'model deployment', 'model serving', 'onnx',
  'cuda', 'gpu', 'distributed training', 'data augmentation',
];

const RESUME_SECTIONS = [
  'experience', 'education', 'skills', 'projects', 'certifications',
  'summary', 'objective', 'achievements', 'publications', 'research',
];

function normalizeText(text) {
  return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function extractNGrams(text, n = 2) {
  const words = tokenize(text);
  const ngrams = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

function tokenize(text) {
  return normalizeText(text)
    .replace(/[^\w\s+#.-/]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function getAllTerms(text) {
  const unigrams = tokenize(text);
  const bigrams = extractNGrams(text, 2);
  return [...unigrams, ...bigrams];
}

function computeTF(terms) {
  const tf = {};
  terms.forEach((t) => {
    tf[t] = (tf[t] || 0) + 1;
  });
  const maxFreq = Math.max(...Object.values(tf), 1);
  Object.keys(tf).forEach((k) => {
    tf[k] = tf[k] / maxFreq;
  });
  return tf;
}

function computeIDF(docTermsList) {
  const idf = {};
  const N = docTermsList.length;
  docTermsList.forEach((terms) => {
    const unique = new Set(terms);
    unique.forEach((term) => {
      idf[term] = (idf[term] || 0) + 1;
    });
  });
  Object.keys(idf).forEach((term) => {
    idf[term] = Math.log((N + 1) / (idf[term] + 1)) + 1;
  });
  return idf;
}

function toTfidfVector(tf, idf) {
  const vec = {};
  Object.keys(tf).forEach((term) => {
    vec[term] = tf[term] * (idf[term] || 1);
  });
  return vec;
}

function cosineSimilarity(vecA, vecB) {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  keys.forEach((k) => {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function findSkillMatches(text, skills) {
  const normalized = normalizeText(text);
  const found = [];
  const missing = [];
  skills.forEach((skill) => {
    if (normalized.includes(skill)) {
      found.push(skill);
    } else {
      missing.push(skill);
    }
  });
  return { found, missing };
}

function extractJobKeywords(jobDescription) {
  const terms = getAllTerms(jobDescription);
  const freq = {};
  terms.forEach((t) => {
    freq[t] = (freq[t] || 0) + 1;
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([term]) => term);
}

function keywordCoverageScore(resumeText, jobKeywords) {
  if (!jobKeywords.length) return { score: 0.5, matched: [], missing: [] };
  const normalized = normalizeText(resumeText);
  const matched = [];
  const missing = [];
  jobKeywords.forEach((kw) => {
    if (normalized.includes(kw)) matched.push(kw);
    else missing.push(kw);
  });
  const score = matched.length / jobKeywords.length;
  return { score, matched, missing: missing.slice(0, 15) };
}

function sectionScore(resumeText) {
  const normalized = normalizeText(resumeText);
  const found = RESUME_SECTIONS.filter((s) => normalized.includes(s));
  return found.length / Math.min(RESUME_SECTIONS.length, 6);
}

function formattingIssues(resumeText) {
  const issues = [];
  if (resumeText.length < 200) {
    issues.push('Resume content is too short — add more detail about projects and experience.');
  }
  if (/[^\x00-\x7F]/.test(resumeText) && resumeText.length < 500) {
    issues.push('Non-ASCII characters detected — ensure PDF text is selectable and ATS-readable.');
  }
  if ((resumeText.match(/\|/g) || []).length > 5) {
    issues.push('Multiple table/column separators detected — use single-column layout for ATS parsers.');
  }
  if (!/\d/.test(resumeText)) {
    issues.push('No quantified metrics found — add numbers (%, users, accuracy, latency improvements).');
  }
  const normalized = normalizeText(resumeText);
  const hasSkills = RESUME_SECTIONS.slice(0, 3).some((s) => normalized.includes(s));
  if (!hasSkills) {
    issues.push('Missing standard section headers (Experience, Education, Skills).');
  }
  if (issues.length === 0) {
    issues.push('Ensure consistent date formatting (MM/YYYY) and standard bullet points.');
  }
  return issues.slice(0, 4);
}

function buildImprovements({ missingJobKeywords, missingAimlSkills, coverage, cosine, sections }) {
  const improvements = [];
  if (missingJobKeywords.length > 0) {
    improvements.push(
      `Add job-specific keywords from the posting: ${missingJobKeywords.slice(0, 5).join(', ')}.`
    );
  }
  if (missingAimlSkills.length > 0) {
    improvements.push(
      `Highlight AI/ML skills: ${missingAimlSkills.slice(0, 5).map((s) => s.replace(/\b\w/g, (c) => c.toUpperCase())).join(', ')}.`
    );
  }
  if (coverage < 0.5) {
    improvements.push('Tailor your resume summary and skills section to mirror the job description language.');
  }
  if (cosine < 0.3) {
    improvements.push('Increase semantic overlap with the job posting by aligning project descriptions with required responsibilities.');
  }
  if (sections < 0.5) {
    improvements.push('Add clear sections: Summary, Skills, Experience, Projects, and Education.');
  }
  improvements.push('Quantify impact with metrics (e.g., "improved model accuracy by 12%", "deployed to 10K users").');
  improvements.push('Place the most relevant AI/ML projects and frameworks near the top of your resume.');
  return improvements.slice(0, 6);
}

function eligibilityLabel(score) {
  if (score >= 75) return { label: 'Highly Eligible', emoji: '✅' };
  if (score >= 50) return { label: 'Moderately Eligible', emoji: '⚡' };
  return { label: 'Low Compatibility', emoji: '⚠️' };
}

/**
 * Main ATS scoring function.
 * Returns score 0-100 plus detailed ML breakdown.
 */
export function scoreResumeATS(resumeText, jobDescription = '') {
  const resume = (resumeText || '').trim();
  const job = (jobDescription || '').trim();

  if (!resume) {
    return { error: 'Resume text is required' };
  }

  const defaultJob =
    job ||
    'AI Machine Learning Engineer Python PyTorch TensorFlow deep learning NLP computer vision MLOps Docker Kubernetes data science model deployment scikit-learn';

  const resumeTerms = getAllTerms(resume);
  const jobTerms = getAllTerms(defaultJob);
  const corpus = [resumeTerms, jobTerms];
  const idf = computeIDF(corpus);

  const resumeVec = toTfidfVector(computeTF(resumeTerms), idf);
  const jobVec = toTfidfVector(computeTF(jobTerms), idf);
  const cosine = cosineSimilarity(resumeVec, jobVec);

  const jobKeywords = extractJobKeywords(defaultJob);
  const { score: coverage, matched: matchedKeywords, missing: missingJobKeywords } =
    keywordCoverageScore(resume, jobKeywords);

  const { found: aimlFound, missing: missingAimlRaw } = findSkillMatches(resume, AIML_SKILLS);
  const jobAiml = findSkillMatches(defaultJob, AIML_SKILLS);
  const missingAimlSkills = jobAiml.found.filter((s) => !aimlFound.includes(s)).slice(0, 12);

  const sections = sectionScore(resume);
  const aimlDensity = Math.min(aimlFound.length / 8, 1);

  const weightedScore =
    cosine * 0.35 +
    coverage * 0.35 +
    aimlDensity * 0.2 +
    sections * 0.1;

  const overallScore = Math.round(Math.min(100, Math.max(0, weightedScore * 100)));
  const { label, emoji } = eligibilityLabel(overallScore);

  const missingKeywords = [
    ...new Set([
      ...missingAimlSkills.slice(0, 8),
      ...missingJobKeywords.slice(0, 7).map((k) => k.replace(/\b\w/g, (c) => c.toUpperCase())),
    ]),
  ].slice(0, 12);

  const issues = formattingIssues(resume);
  const improvements = buildImprovements({
    missingJobKeywords,
    missingAimlSkills,
    coverage,
    cosine,
    sections,
  });

  const summary = job
    ? `${emoji} ${label} for this role (${overallScore}%). TF-IDF similarity: ${(cosine * 100).toFixed(0)}%, keyword match: ${(coverage * 100).toFixed(0)}%, AI/ML skills detected: ${aimlFound.length}.`
    : `${emoji} ${label} (${overallScore}%). Scored against general AI/ML engineer requirements. Add a job description for targeted analysis.`;

  return {
    overall_score: overallScore,
    eligibility: label,
    eligibility_emoji: emoji,
    is_eligible: overallScore >= 50,
    ml_breakdown: {
      tfidf_cosine_similarity: Math.round(cosine * 100),
      keyword_coverage_pct: Math.round(coverage * 100),
      aiml_skills_found: aimlFound.length,
      aiml_skills_matched: aimlFound.slice(0, 15),
      section_completeness_pct: Math.round(sections * 100),
      matched_job_keywords: matchedKeywords.slice(0, 10),
    },
    missing_keywords: missingKeywords,
    formatting_issues: issues,
    actionable_improvements: improvements,
    summary,
  };
}
