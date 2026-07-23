import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromAuthHeader } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scanId = parseInt(params.id, 10);
    if (Number.isNaN(scanId)) {
      return NextResponse.json({ error: 'Invalid scan ID' }, { status: 400 });
    }

    const scan = await prisma.resumeScan.findFirst({
      where: { id: scanId, userId },
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: scan.id,
      resume_text: scan.resumeText,
      job_description: scan.jobDescription,
      ats_score: scan.atsScore,
      feedback_json: scan.feedbackJson,
      created_at: scan.createdAt,
    });
  } catch (err) {
    console.error('Resume Scan Fetch Error:', err);
    return NextResponse.json({ error: 'Failed to fetch scan' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scanId = parseInt(params.id, 10);
    if (Number.isNaN(scanId)) {
      return NextResponse.json({ error: 'Invalid scan ID' }, { status: 400 });
    }

    const scan = await prisma.resumeScan.findFirst({
      where: { id: scanId, userId },
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    await prisma.resumeScan.delete({ where: { id: scanId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Resume Scan Delete Error:', err);
    return NextResponse.json({ error: 'Failed to delete scan' }, { status: 500 });
  }
}
