import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromAuthHeader } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Next.js 16 provides dynamic route params asynchronously.
    const { id } = await params;
    const itemId = Number(id);
    if (!Number.isInteger(itemId) || itemId < 1) {
      return NextResponse.json({ error: 'Invalid roadmap item' }, { status: 400 });
    }

    const item = await prisma.roadmapItem.findFirst({
      where: { id: itemId, roadmap: { userId } }
    });

    if (!item) {
      return NextResponse.json({ error: 'Roadmap item not found' }, { status: 404 });
    }

    const updated = await prisma.roadmapItem.update({
      where: { id: itemId },
      data: { isCompleted: !item.isCompleted }
    });

    return NextResponse.json({
      id: updated.id,
      week_number: updated.weekNumber,
      topic: updated.topic,
      subtopics: updated.subtopics,
      resource_link: updated.resourceLink,
      resources: updated.resources,
      is_completed: updated.isCompleted
    });

  } catch (err) {
    console.error('Roadmap toggle error:', err);
    return NextResponse.json({ error: 'Failed to toggle item' }, { status: 500 });
  }
}

export async function POST(req, ctx) {
  return PATCH(req, ctx);
}
