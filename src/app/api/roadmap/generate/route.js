import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromAuthHeader } from '@/lib/auth';
import { callOpenRouter } from '@/lib/openrouter';

export async function POST(req) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goal = 'Machine Learning Core', level = 'beginner', hours_per_week = 10 } = await req.json();

    const systemPrompt = (
      "You are an expert AI/ML Curriculum Designer. Generate a custom, structured week-by-week learning roadmap " +
      "for an AI/ML student. Return ONLY valid JSON with no markdown block markers (no ```json).\n" +
      "JSON structure:\n" +
      "{\n" +
      '  "goal": "...",\n' +
      '  "level": "...",\n' +
      '  "weeks": [\n' +
      '    {\n' +
      '      "week_number": 1,\n' +
      '      "topic": "Topic Name",\n' +
      '      "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3"]\n' +
      '    }\n' +
      '  ]\n' +
      '}\n' +
      `Design a 6 to 8 week curriculum for goal: '${goal}', student level: '${level}', available time: '${hours_per_week} hours/week'.`
    );

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Build a roadmap for ${goal} (${level} level, ${hours_per_week} hrs/week).` }
    ];

    const { content } = await callOpenRouter(messages, 1800);

    let data;
    if (content) {
      const cleaned = content.trim().replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        data = JSON.parse(cleaned);
      } catch (e) {
        data = null;
      }
    }

    if (!data) {
      data = {
        goal,
        level,
        weeks: [
          { week_number: 1, topic: `Foundations of ${goal}`, subtopics: ["Core Math & Vectors", "Python Setup", "Data Structures"] },
          { week_number: 2, topic: "Exploratory Data Analysis", subtopics: ["Pandas & NumPy", "Matplotlib Visualization", "Feature Cleaning"] },
          { week_number: 3, topic: "Supervised Learning Fundamentals", subtopics: ["Linear & Logistic Regression", "Decision Trees", "Model Evaluation"] },
          { week_number: 4, topic: "Deep Learning Principles", subtopics: ["Neural Networks", "Activation Functions", "Backpropagation"] },
          { week_number: 5, topic: `Advanced ${goal} Architectures`, subtopics: ["Model Optimization", "Transfer Learning", "Hyperparameter Tuning"] },
          { week_number: 6, topic: "Capstone ML Project & Deployment", subtopics: ["Model Export", "API Wrapping", "Deployment"] }
        ]
      };
    }

    // Delete previous user roadmap
    await prisma.roadmap.deleteMany({ where: { userId } });

    // Create new Roadmap
    const roadmap = await prisma.roadmap.create({
      data: {
        userId,
        goal,
        level,
        hoursPerWeek: Number(hours_per_week),
        jsonContent: data,
        items: {
          create: data.weeks.map(w => ({
            weekNumber: w.week_number || 1,
            topic: w.topic || 'Topic',
            subtopics: w.subtopics || [],
            resourceLink: '',
            resources: []
          }))
        }
      },
      include: { items: true }
    });

    return NextResponse.json({
      id: roadmap.id,
      goal: roadmap.goal,
      level: roadmap.level,
      hours_per_week: roadmap.hoursPerWeek,
      created_at: roadmap.createdAt,
      json_content: roadmap.jsonContent,
      items: roadmap.items.map(item => ({
        id: item.id,
        week_number: item.weekNumber,
        topic: item.topic,
        subtopics: item.subtopics,
        resource_link: item.resourceLink,
        resources: item.resources,
        is_completed: item.isCompleted
      }))
    }, { status: 201 });

  } catch (err) {
    console.error("Roadmap Generate Error:", err);
    return NextResponse.json({ error: 'Failed to generate roadmap' }, { status: 500 });
  }
}
