import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma, isDatabaseError, databaseErrorMessage } from '@/lib/prisma';
import { hashPassword, signAccessToken, signRefreshToken } from '@/lib/auth';

// A guest is an isolated account with no personal details, so the learning
// tools can be used before someone decides whether to register.
export async function POST() {
  try {
    const guestId = randomUUID().replace(/-/g, '').slice(0, 16);
    const user = await prisma.user.create({
      data: {
        username: `guest_${guestId}`,
        passwordHash: await hashPassword(randomUUID()),
        firstName: 'Guest',
        profile: { create: { currentStreak: 1, lastActiveDate: new Date() } }
      },
      include: { profile: true }
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: 'Guest learner',
        email: '',
        first_name: 'Guest',
        last_name: '',
        is_guest: true,
        profile: {
          current_streak: user.profile?.currentStreak || 1,
          last_active_date: user.profile?.lastActiveDate || new Date()
        }
      },
      access: signAccessToken(user),
      refresh: signRefreshToken(user)
    }, { status: 201 });
  } catch (err) {
    console.error('Guest session error:', err);
    if (isDatabaseError(err)) {
      return NextResponse.json({ error: databaseErrorMessage(err) }, { status: 503 });
    }
    return NextResponse.json({ error: 'Unable to start a guest session' }, { status: 500 });
  }
}
