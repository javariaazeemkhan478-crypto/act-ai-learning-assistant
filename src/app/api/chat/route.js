import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromAuthHeader } from '@/lib/auth';
import { callOpenRouter } from '@/lib/openrouter';

const DOUBT_SOLVER_PROMPT = (
  "You are PathAI, an expert AI/ML tutor. Explain concepts in simple, accessible terms with clear intuitive examples. " +
  "Assume the student is actively learning, avoid unnecessary academic jargon, and always relate answers back to practical " +
  "machine learning use cases. Use formatted markdown with code snippets where helpful."
);

// Mermaid is deliberately generated locally for the Visual Flowchart action.
// This avoids malformed model output and gives learners an instant, dependable diagram.
function createVisualFlowchart(rawTopic) {
  const topic = String(rawTopic || 'AI ML Foundations')
    .replace(/[^a-zA-Z0-9\s/-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 56) || 'AI ML Foundations';

  return `## Visual learning flowchart: ${topic}

Follow this practical path, then return to any stage whenever you need revision.

\`\`\`mermaid
flowchart TD
    A["Start: ${topic}"] --> B["Build foundations"]
    B --> C["Learn core concepts"]
    C --> D["Practice with code"]
    D --> E["Build a small project"]
    E --> F["Review and improve"]
    F --> G["Apply your skills"]
\`\`\`

**Tip:** Complete each stage at your own pace and use the AI tutor whenever a concept needs a clearer explanation.`;
}

export async function POST(req) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message = '', image_url = '', session_id = null, visual_flowchart = false, topic = '' } = await req.json();

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

    await prisma.chatMessage.create({
      data: {
        userId,
        sessionId: session.id,
        role: "user",
        content: message,
        imageUrl: image_url || ""
      }
    });

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

    let aiReply;
    let modelUsed = null;
    if (visual_flowchart) {
      aiReply = createVisualFlowchart(topic || message);
      modelUsed = 'PathAI built-in visual flowchart';
    } else {
      ({ content: aiReply, modelUsed } = await callOpenRouter(messagesPayload, 1000));
      if (!aiReply) {
        aiReply = "I am currently experiencing a network timeout with the OpenRouter model. Please try again in a moment!";
      }
    }

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
