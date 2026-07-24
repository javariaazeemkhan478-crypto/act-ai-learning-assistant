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

function builtInDebugAnalysis(code, framework) {
  const source = code.trim();
  const isPython = framework.toLowerCase().includes('python') || /\bdef\s+\w+|\bprint\(/.test(source);
  const isJavaScript = /\bconst\s+|\blet\s+|\bfunction\s+|console\.log|=>/.test(source);
  const detected = isPython ? 'Python' : isJavaScript ? 'JavaScript' : framework === 'Auto-Detect' ? 'Code snippet' : framework;
  const errorLine = source.split('\n').find((line) => /error|exception|traceback|undefined|not defined|syntaxerror|typeerror/i.test(line));
  let reason = 'The external AI service did not return in time, so PathAI used its built-in analyzer.';
  let corrected = source;
  let expected = 'Run the corrected code again and compare the reported line with the input values and variable names.';

  if (/cannot read properties of undefined|\.map\(/i.test(source)) {
    reason = 'A value is undefined when `.map()` is called. This usually means data has not loaded yet or the variable was not initialized as an array.';
    corrected = `const safeItems = Array.isArray(items) ? items : [];\nconst result = safeItems.map((item) => item);`;
    expected = 'The code safely produces an empty array until items is available, rather than throwing an undefined-property error.';
  } else if (/nameerror|is not defined/i.test(source)) {
    reason = 'A variable is used before it is declared, or its spelling does not match the declaration.';
    corrected = isPython ? '# Define the value before using it\nvalue = 0\nprint(value)' : 'const value = 0;\nconsole.log(value);';
    expected = 'The variable is defined before use, so the name-reference error is removed.';
  } else if (isPython && /\b(def|if|for|while|else|elif)\b[^\n:]*$/m.test(source)) {
    reason = 'A Python control statement appears to be missing its required trailing colon (`:`).';
    corrected = source.replace(/\b(def|if|for|while|else|elif)([^\n:]*)$/m, '$1$2:');
    expected = 'Python can parse the block correctly once the colon is present.';
  } else if (/syntaxerror/i.test(source)) {
    reason = 'The snippet contains a syntax error. Check unmatched brackets, quotes, commas, and language-specific block markers.';
    expected = 'After balancing brackets and quotes, the code should parse and run to the next logical step.';
  }

  return `## ${detected} Debug Analysis\n\n**Most likely reason:** ${reason}\n${errorLine ? `\n**Reported clue:** \`${errorLine.trim()}\`\n` : ''}\n### Safe corrected pattern\n\n\`\`\`${isPython ? 'python' : isJavaScript ? 'javascript' : ''}\n${corrected}\n\`\`\`\n\n**Expected behavior:** ${expected}\n\n> Paste the full error message and the surrounding lines for a more exact fix.`;
}

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

    let { content: aiResponse, modelUsed } = await callOpenRouter(messages, 1400);

    if (!aiResponse || /unable to analyze code snippet at this time/i.test(aiResponse)) {
      aiResponse = builtInDebugAnalysis(code, framework);
      modelUsed = 'built-in analyzer';
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
      model_used: modelUsed,
      timestamp: debugRecord.timestamp
    }, { status: 201 });

  } catch (err) {
    console.error("Debug Code Error:", err);
    return NextResponse.json({ error: 'Failed to debug code' }, { status: 500 });
  }
}
