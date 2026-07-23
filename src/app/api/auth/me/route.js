import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserIdFromAuthHeader } from '../../../../lib/auth';

export async function GET(req) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      profile: {
        current_streak: user.profile?.currentStreak || 1,
        last_active_date: user.profile?.lastActiveDate || new Date()
      }
    });

  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
  }
}
