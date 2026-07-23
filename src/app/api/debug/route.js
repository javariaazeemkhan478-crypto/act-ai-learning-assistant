import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromAuthHeader } from '@/lib/auth';
import { callOpenRouter } from '@/lib/openrouter';

const DEBUGGER_PROMPT = (
  "You are an expert multi-language programming and ML debugging assistant. " +
  "Given code snippets or error traces:\n" +
  "1. If the selected framework is 'Auto-Detect', identify the programming language/framework automatically first.\n" +
  "2. Identify the most likely root cause(s).\n" +
  "3. Provide the corrected, clean code snippet.\n" +
  "4. Explicitly state the expected output or behavior after applying the fix."
);

export async function POST(req) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code = '', framework = 'Auto-Detect' } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Code or error trace is required' }, { status: 400 });
    }

    const messages = [
      { role: "system", content: DEBUGGER_PROMPT },
      { role: "user", content: `Selected Framework/Language: ${framework}\n\nCode / Error Trace:\n\`\`\`\n${code}\n\`\`\`` }
    ];

    let { content: aiResponse } = await callOpenRouter(messages, 1400);

    if (!aiResponse) {
      aiResponse = "Unable to analyze code snippet at this time. Please check your network connection and try again.";
    }

    const debugRecord = await prisma.debugQuery.create({
      data: {
        userId,
        inputCode: code,
        framework,
        aiResponse
      }
    });

    return NextResponse.json({
      id: debugRecord.id,
      input_code: debugRecord.inputCode,
      framework: debugRecord.framework,
      ai_response: debugRecord.aiResponse,
      timestamp: debugRecord.timestamp
    }, { status: 201 });

  } catch (err) {
    console.error("Debug Code Error:", err);
    return NextResponse.json({ error: 'Failed to debug code' }, { status: 500 });
  }
}
