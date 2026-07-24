import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromAuthHeader } from '@/lib/auth';

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

    const roadmap = await prisma.roadmap.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    });

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

    const totalChats = await prisma.chatMessage.count({
      where: { userId, role: "user" }
    });
    const totalDebugQueries = await prisma.debugQuery.count({
      where: { userId }
    });
    const totalResumeScans = await prisma.resumeScan.count({
      where: { userId }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activityGrid = [];
    for (let i = 59; i >= 0; i--) {
      const dayDate = new Date(today);
      dayDate.setDate(dayDate.getDate() - i);
      const nextDayDate = new Date(dayDate);
      nextDayDate.setDate(nextDayDate.getDate() + 1);

      const dateStr = dayDate.toISOString().split('T')[0];

      const dayChats = await prisma.chatMessage.count({
        where: {
          userId,
          role: "user",
          timestamp: { gte: dayDate, lt: nextDayDate }
        }
      });
      const dayDebugs = await prisma.debugQuery.count({
        where: {
          userId,
          timestamp: { gte: dayDate, lt: nextDayDate }
        }
      });
      const dayResumes = await prisma.resumeScan.count({
        where: {
          userId,
          createdAt: { gte: dayDate, lt: nextDayDate }
        }
      });

      const totalDayActivity = dayChats + dayDebugs + dayResumes;
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
      activity_grid: activityGrid
    });

  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
