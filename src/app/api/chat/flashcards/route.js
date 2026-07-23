import { NextResponse } from 'next/server';
import { getUserIdFromAuthHeader } from '@/lib/auth';
import { callOpenRouter } from '@/lib/openrouter';

export async function POST(req) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic = "AI/ML Core Fundamentals" } = await req.json();

    const prompt = (
      `You are an expert AI tutor. Generate 6 high-yield study flashcards for topic '${topic}'. ` +
      "Return ONLY valid JSON with no markdown block markers (no ```json).\n" +
      "JSON format:\n" +
      "{\n" +
      '  "topic": "...",\n' +
      '  "cards": [\n' +
      '    {"question": "What is ...?", "answer": "Explanation..."}\n' +
      '  ]\n' +
      "}"
    );

    const { content } = await callOpenRouter([{ role: "system", content: prompt }], 1200);

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
        topic,
        cards: [
          { question: "What is Overfitting in Machine Learning?", answer: "When a model learns noise in training data instead of generalizing to new unseen data." },
          { question: "Difference between Supervised and Unsupervised Learning?", answer: "Supervised uses labeled targets; Unsupervised finds patterns in unlabeled data." },
          { question: "What is Backpropagation?", answer: "An algorithm that calculates gradients of the loss function using chain rule to update weights." },
          { question: "What is the purpose of Activation Functions?", answer: "They introduce non-linearity into neural networks so they can learn complex relationships." }
        ]
      };
    }

    return NextResponse.json(data);

  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate flashcards' }, { status: 500 });
  }
}
