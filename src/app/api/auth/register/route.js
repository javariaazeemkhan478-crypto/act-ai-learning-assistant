import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signAccessToken, signRefreshToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { username, password, email, first_name, last_name } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email: email || '',
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
        profile: {
          current_streak: user.profile?.currentStreak || 1,
          last_active_date: user.profile?.lastActiveDate || new Date()
        }
      },
      access,
      refresh
    }, { status: 201 });

  } catch (err) {
    console.error("Register Error:", err);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
