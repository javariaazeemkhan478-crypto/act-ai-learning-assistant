import { NextResponse } from 'next/server';
import { getUserIdFromAuthHeader } from '../../../../lib/auth';
import { callOpenRouter } from '../../../../lib/openrouter';

export async function POST(req) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic = "AI/ML Fundamentals" } = await req.json();

    const prompt = (
      `Generate 5 practice multiple choice questions (MCQs) for topic '${topic}'. ` +
      "Return ONLY valid JSON with no markdown block markers (no ```json).\n" +
      "JSON format:\n" +
      "{\n" +
      '  "topic": "...",\n' +
      '  "questions": [\n' +
      '    {\n' +
      '      "question": "Question text?",\n' +
      '      "options": ["A. Opt 1", "B. Opt 2", "C. Opt 3", "D. Opt 4"],\n' +
      '      "correct_index": 1,\n' +
      '      "explanation": "Why B is correct..."\n' +
      '    }\n' +
      '  ]\n' +
      "}"
    );

    const { content } = await callOpenRouter([{ role: "system", content: prompt }], 1400);

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
        questions: [
          {
            question: "Which loss function is commonly used for binary classification?",
            options: ["A. Mean Squared Error (MSE)", "B. Binary Cross-Entropy", "C. Categorical Cross-Entropy", "D. Hinge Loss"],
            correct_index: 1,
            explanation: "Binary Cross-Entropy measures the performance of a classification model whose output is a probability between 0 and 1."
          },
          {
            question: "What is the primary function of the Learning Rate hyperparameter?",
            options: ["A. Number of layers in network", "B. Step size during gradient descent optimization", "C. Size of mini-batches", "D. Number of training epochs"],
            correct_index: 1,
            explanation: "Learning rate controls how much we adjust model weights with respect to the loss gradient."
          }
        ]
      };
    }

    return NextResponse.json(data);

  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate MCQs' }, { status: 500 });
  }
}
