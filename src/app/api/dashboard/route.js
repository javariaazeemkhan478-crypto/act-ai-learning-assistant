import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromAuthHeader } from '@/lib/auth';

export async function GET(req) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedOffset = Number(searchParams.get('year_offset') || 0);
    const yearOffset = Number.isInteger(requestedOffset) ? Math.min(Math.max(requestedOffset, 0), 10) : 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setFullYear(today.getFullYear() - yearOffset);
    const activityStart = new Date(today);
    activityStart.setDate(activityStart.getDate() - 59);

    // Run the dashboard work in parallel. The former implementation performed
    // 180 sequential counts for the heatmap, making every update feel delayed.
    const [user, roadmap, totalChats, totalDebugQueries, totalResumeScans, recentChats, recentDebugs, recentResumes] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }),
      prisma.roadmap.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { items: true } }),
      prisma.chatMessage.count({ where: { userId, role: 'user' } }),
      prisma.debugQuery.count({ where: { userId } }),
      prisma.resumeScan.count({ where: { userId } }),
      prisma.chatMessage.findMany({ where: { userId, role: 'user', timestamp: { gte: activityStart } }, select: { timestamp: true } }),
      prisma.debugQuery.findMany({ where: { userId, timestamp: { gte: activityStart } }, select: { timestamp: true } }),
      prisma.resumeScan.findMany({ where: { userId, createdAt: { gte: activityStart } }, select: { createdAt: true } })
    ]);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let totalItems = 0;
    let completedItems = 0;
    let pendingItems = 0;
    let completionPercentage = 0;
    let roadmapData = null;

    if (roadmap) {
      totalItems = roadmap.items.length;
      completedItems = roadmap.items.filter(i => i.isCompleted).length;
      pendingItems = totalItems - completedItems;
      if (totalItems > 0) {
        completionPercentage = Math.round((completedItems / totalItems) * 1000) / 10;
      }
      roadmapData = {
        id: roadmap.id,
        goal: roadmap.goal,
        level: roadmap.level,
        hours_per_week: roadmap.hoursPerWeek,
        total_weeks: Array.isArray(roadmap.jsonContent?.weeks) ? roadmap.jsonContent.weeks.length : 0
      };
    }

    const activityByDate = new Map();
    const addActivity = (date) => {
      const key = date.toISOString().slice(0, 10);
      activityByDate.set(key, (activityByDate.get(key) || 0) + 1);
    };
    recentChats.forEach(({ timestamp }) => addActivity(timestamp));
    recentDebugs.forEach(({ timestamp }) => addActivity(timestamp));
    recentResumes.forEach(({ createdAt }) => addActivity(createdAt));
    const activityGrid = [];
    for (let i = 59; i >= 0; i--) {
      const dayDate = new Date(today);
      dayDate.setDate(dayDate.getDate() - i);
      const dateStr = dayDate.toISOString().split('T')[0];
      const totalDayActivity = activityByDate.get(dateStr) || 0;
      let level = 0;
      if (totalDayActivity >= 7) level = 4;
      else if (totalDayActivity >= 4) level = 3;
      else if (totalDayActivity >= 2) level = 2;
      else if (totalDayActivity >= 1) level = 1;

      activityGrid.push({
        date: dateStr,
        count: totalDayActivity,
        level
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        is_guest: user.username.startsWith('guest_'),
        profile: {
          current_streak: user.profile?.currentStreak || 1,
          last_active_date: user.profile?.lastActiveDate || new Date()
        }
      },
      current_streak: user.profile?.currentStreak || 1,
      completion_percentage: completionPercentage,
      total_items: totalItems,
      completed_items: completedItems,
      pending_items: pendingItems,
      total_chats: totalChats,
      total_debug_queries: totalDebugQueries,
      total_resume_scans: totalResumeScans,
      roadmap: roadmapData,
      activity_period: {
        start: activityStart.toISOString().slice(0, 10),
        end: today.toISOString().slice(0, 10),
        year_offset: yearOffset
      },
      activity_grid: activityGrid
    });

  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
