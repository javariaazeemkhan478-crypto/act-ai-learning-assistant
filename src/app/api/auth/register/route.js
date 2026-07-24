import { NextResponse } from 'next/server';
import { prisma, isDatabaseError, databaseErrorMessage } from '@/lib/prisma';
import { hashPassword, signAccessToken, signRefreshToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { username, password, email, first_name, last_name } = await req.json();
    const trimmedUsername = (username || '').trim().toLowerCase();
    const trimmedEmail = (email || '').trim().toLowerCase();

    if (!trimmedUsername || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (trimmedUsername.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }

    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      return NextResponse.json({ error: 'Username may only contain letters, numbers, and underscores' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username: trimmedUsername } });
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    if (trimmedEmail) {
      const emailTaken = await prisma.user.findFirst({ where: { email: trimmedEmail } });
      if (emailTaken) {
        return NextResponse.json({ error: 'Email is already registered' }, { status: 400 });
      }
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username: trimmedUsername,
        email: trimmedEmail || '',
        passwordHash,
        firstName: first_name || '',
        lastName: last_name || '',
        profile: {
          create: {
            currentStreak: 1,
            lastActiveDate: new Date()
          }
        }
      },
      include: { profile: true }
    });

    const access = signAccessToken(user);
    const refresh = signRefreshToken(user);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        is_guest: false,
        profile: {
          current_streak: user.profile?.currentStreak || 1,
          last_active_date: user.profile?.lastActiveDate || new Date()
        }
      },
      access,
      refresh
    }, { status: 201 });

  } catch (err) {
    console.error('Register Error:', err);
    if (isDatabaseError(err)) {
      return NextResponse.json(
        { error: databaseErrorMessage(err) },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
