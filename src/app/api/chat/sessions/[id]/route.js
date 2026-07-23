import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { getUserIdFromAuthHeader } from '../../../../../../lib/auth';

export async function DELETE(req, { params }) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = Number(params.id);

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await prisma.chatSession.delete({ where: { id: sessionId } });

    return NextResponse.json({ success: true, message: 'Chat thread deleted.' });

  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
