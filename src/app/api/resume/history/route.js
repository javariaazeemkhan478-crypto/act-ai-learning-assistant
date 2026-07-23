import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromAuthHeader } from '@/lib/auth';

export async function GET(req) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scans = await prisma.resumeScan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        atsScore: true,
        jobDescription: true,
        feedbackJson: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      scans.map((scan) => ({
        id: scan.id,
        ats_score: scan.atsScore,
        job_preview: (scan.jobDescription || '').slice(0, 120),
        eligibility: scan.feedbackJson?.eligibility || null,
        eligibility_emoji: scan.feedbackJson?.eligibility_emoji || null,
        created_at: scan.createdAt,
      }))
    );
  } catch (err) {
    console.error('Resume History Error:', err);
    return NextResponse.json({ error: 'Failed to fetch resume history' }, { status: 500 });
  }
}
