import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromAuthHeader } from '@/lib/auth';
import { callOpenRouter } from '@/lib/openrouter';
import { scoreResumeATS } from '@/lib/atsScorer';

const AI_ENHANCE_PROMPT = (
  'You are an expert AI/ML career coach. Given ML-based ATS analysis results, provide 2-3 extra ' +
  'specific, actionable resume improvements for an AI/ML role. Return ONLY a JSON array of strings, ' +
  'no markdown. Example: ["Add Kubernetes deployment experience", "Quantify NLP project F1 score"]'
);

async function enhanceWithAI(resumeText, jobDescription, mlResult) {
  try {
    if (!process.env.OPENROUTER_API_KEY) return null;
    const messages = [
      { role: 'system', content: AI_ENHANCE_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          job_description: jobDescription || 'General AI/ML Engineer',
          ml_score: mlResult.overall_score,
          missing_keywords: mlResult.missing_keywords,
          resume_excerpt: resumeText.slice(0, 1500),
        }),
      },
    ];
    const { content } = await callOpenRouter(messages, 400);
    if (!content) return null;
    const cleaned = content.trim().replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed.slice(0, 3) : null;
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resume_text = '', job_description = '' } = await req.json();

    if (!resume_text.trim()) {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }

    if (!job_description.trim()) {
      return NextResponse.json(
        { error: 'Job description is required for TF-IDF matching and eligibility scoring' },
        { status: 400 }
      );
    }

    const mlResult = scoreResumeATS(resume_text, job_description);
    if (mlResult.error) {
      return NextResponse.json({ error: mlResult.error }, { status: 400 });
    }

    const aiSuggestions = await enhanceWithAI(resume_text, job_description, mlResult);
    const feedbackData = {
      ...mlResult,
      actionable_improvements: aiSuggestions
        ? [...new Set([...mlResult.actionable_improvements, ...aiSuggestions])].slice(0, 8)
        : mlResult.actionable_improvements,
      scoring_method: 'TF-IDF cosine similarity + keyword coverage + AI/ML skill matching',
    };

    const score = feedbackData.overall_score;

    const scan = await prisma.resumeScan.create({
      data: {
        userId,
        resumeText: resume_text,
        jobDescription: job_description,
        atsScore: score,
        feedbackJson: feedbackData,
      },
    });

    return NextResponse.json(
      {
        id: scan.id,
        resume_text: scan.resumeText,
        job_description: scan.jobDescription,
        ats_score: scan.atsScore,
        feedback_json: scan.feedbackJson,
        created_at: scan.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Resume Score Error:', err);
    return NextResponse.json({ error: 'Failed to score resume' }, { status: 500 });
  }
}
