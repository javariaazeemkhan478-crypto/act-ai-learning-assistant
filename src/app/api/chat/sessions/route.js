import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromAuthHeader } from '@/lib/auth';

export async function GET(req) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    return NextResponse.json(sessions.map(s => ({
      id: s.id,
      title: s.title,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
      messages: s.messages.map(m => ({
        id: m.id,
        session: m.sessionId,
        role: m.role,
        content: m.content,
        image_url: m.imageUrl,
        timestamp: m.timestamp
      }))
    })));

  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title = 'New Chat' } = await req.json();

    const session = await prisma.chatSession.create({
      data: { userId, title },
      include: { messages: true }
    });

    return NextResponse.json({
      id: session.id,
      title: session.title,
      created_at: session.createdAt,
      updated_at: session.updatedAt,
      messages: []
    }, { status: 201 });

  } catch (err) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
