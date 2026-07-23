import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromAuthHeader } from '../../../lib/auth';
import { callOpenRouter } from '../../../lib/openrouter';

const DOUBT_SOLVER_PROMPT = (
  "You are PathAI, an expert AI/ML tutor. Explain concepts in simple, accessible terms with clear intuitive examples. " +
  "Assume the student is actively learning, avoid unnecessary academic jargon, and always relate answers back to practical " +
  "machine learning use cases. Use formatted markdown with code snippets where helpful."
);

export async function POST(req) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message = '', image_url = '', session_id = null } = await req.json();

    if (!message && !image_url) {
      return NextResponse.json({ error: 'Message content or image attachment is required' }, { status: 400 });
    }

    let session;
    if (session_id) {
      session = await prisma.chatSession.findFirst({
        where: { id: Number(session_id), userId }
      });
    }

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          userId,
          title: message ? message.slice(0, 40) : "Image Query"
        }
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        userId,
        sessionId: session.id,
        role: "user",
        content: message,
        imageUrl: image_url || ""
      }
    });

    // Fetch history for context
    const history = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { timestamp: 'desc' },
      take: 8
    });
    const historyAsc = history.reverse();

    const messagesPayload = [{ role: "system", content: DOUBT_SOLVER_PROMPT }];
    for (const msg of historyAsc) {
      if (msg.imageUrl && msg.role === 'user') {
        messagesPayload.push({
          role: "user",
          content: [
            { type: "text", text: msg.content || "Analyze attached image" },
            { type: "image_url", image_url: { url: msg.imageUrl } }
          ]
        });
      } else {
        messagesPayload.push({ role: msg.role, content: msg.content });
      }
    }

    let { content: aiReply, modelUsed } = await callOpenRouter(messagesPayload, 1000);

    if (!aiReply) {
      aiReply = "I am currently experiencing a network timeout with the OpenRouter model. Please try again in a moment!";
    }

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        userId,
        sessionId: session.id,
        role: "assistant",
        content: aiReply
      }
    });

    await prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      reply: aiReply,
      session_id: session.id,
      model_used: modelUsed
    });

  } catch (err) {
    console.error("Doubt Chat Error:", err);
    return NextResponse.json({ error: 'Failed to process doubt chat' }, { status: 500 });
  }
}
