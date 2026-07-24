import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromAuthHeader } from '@/lib/auth';

export async function DELETE(req, { params }) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sessionId = Number(id);
    if (!Number.isInteger(sessionId) || sessionId < 1) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Chat messages reference the session, so remove them first. This works for
    // existing databases even if their foreign key was created without cascade.
    await prisma.$transaction([
      prisma.chatMessage.deleteMany({ where: { sessionId, userId } }),
      prisma.chatSession.delete({ where: { id: sessionId } })
    ]);

    return NextResponse.json({ success: true, message: 'Chat thread deleted.' });

  } catch (err) {
    console.error('Delete chat session error:', err);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
