import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signAccessToken, signRefreshToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    const trimmedUsername = (username || '').trim().toLowerCase();

    if (!trimmedUsername || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: trimmedUsername },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = user.profile?.currentStreak || 1;
    const lastActive = user.profile?.lastActiveDate ? new Date(user.profile.lastActiveDate) : null;
    if (lastActive) lastActive.setHours(0, 0, 0, 0);

    if (lastActive && lastActive.getTime() !== today.getTime()) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastActive.getTime() === yesterday.getTime()) {
        streak += 1;
      } else {
        streak = 1;
      }

      await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: { currentStreak: streak, lastActiveDate: new Date() },
        create: { userId: user.id, currentStreak: streak, lastActiveDate: new Date() }
      });
    }

    const access = signAccessToken(user);
    const refresh = signRefreshToken(user);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        profile: {
          current_streak: streak,
          last_active_date: new Date()
        }
      },
      access,
      refresh
    });

  } catch (err) {
    console.error("Login Error:", err);
    return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 });
  }
}
