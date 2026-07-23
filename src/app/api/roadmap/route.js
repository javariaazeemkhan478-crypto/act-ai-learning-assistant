import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromAuthHeader } from '../../../lib/auth';

export async function GET(req) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roadmap = await prisma.roadmap.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: { orderBy: { weekNumber: 'asc' } } }
    });

    if (!roadmap) {
      return NextResponse.json({ detail: 'No roadmap created yet.' }, { status: 404 });
    }

    return NextResponse.json({
      id: roadmap.id,
      goal: roadmap.goal,
      level: roadmap.level,
      hours_per_week: roadmap.hoursPerWeek,
      created_at: roadmap.createdAt,
      json_content: roadmap.jsonContent,
      items: roadmap.items.map(item => ({
        id: item.id,
        week_number: item.weekNumber,
        topic: item.topic,
        subtopics: item.subtopics,
        resource_link: item.resourceLink,
        resources: item.resources,
        is_completed: item.isCompleted
      }))
    });

  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch roadmap' }, { status: 500 });
  }
}
