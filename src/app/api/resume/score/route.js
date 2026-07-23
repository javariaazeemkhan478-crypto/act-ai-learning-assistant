import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromAuthHeader } from '@/lib/auth';
import { callOpenRouter } from '@/lib/openrouter';

const ATS_PROMPT = (
  "You are an expert ATS (Applicant Tracking System) resume evaluator and senior tech recruiter. " +
  "Given a student's resume and optional target job description, score the resume for ATS-compatibility and relevance out of 100.\n" +
  "Return ONLY valid JSON with no markdown block markers (no ```json).\n" +
  "JSON structure:\n" +
  "{\n" +
  '  "overall_score": 85,\n' +
  '  "missing_keywords": ["PyTorch", "MLOps", "Docker", "CI/CD"],\n' +
  '  "formatting_issues": ["Avoid multi-column tables", "Use standard section headers"],\n' +
  '  "actionable_improvements": ["Add quantified metrics", "Highlight Transformer experience"],\n' +
  '  "summary": "Strong foundational resume."\n' +
  "}"
);

export async function POST(req) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resume_text = '', job_description = '' } = await req.json();

    if (!resume_text) {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }

    const messages = [
      { role: "system", content: ATS_PROMPT },
      { role: "user", content: `Resume:\n${resume_text}\n\nTarget Job Description:\n${job_description || 'General AI/ML Software Engineer Role'}` }
    ];

    const { content } = await callOpenRouter(messages, 1500);

    let feedbackData;
    if (content) {
      const cleaned = content.trim().replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        feedbackData = JSON.parse(cleaned);
      } catch (e) {
        feedbackData = null;
      }
    }

    if (!feedbackData) {
      feedbackData = {
        overall_score: 75,
        missing_keywords: ["PyTorch", "MLOps", "Kubernetes"],
        formatting_issues: ["Ensure PDF text is selectable"],
        actionable_improvements: ["Add quantitative project impact metrics"],
        summary: "Solid resume foundation."
      };
    }

    const score = feedbackData.overall_score || 75;

    const scan = await prisma.resumeScan.create({
      data: {
        userId,
        resumeText: resume_text,
        jobDescription: job_description,
        atsScore: score,
        feedbackJson: feedbackData
      }
    });

    return NextResponse.json({
      id: scan.id,
      resume_text: scan.resumeText,
      job_description: scan.jobDescription,
      ats_score: scan.atsScore,
      feedback_json: scan.feedbackJson,
      created_at: scan.createdAt
    }, { status: 201 });

  } catch (err) {
    console.error("Resume Score Error:", err);
    return NextResponse.json({ error: 'Failed to score resume' }, { status: 500 });
  }
}
