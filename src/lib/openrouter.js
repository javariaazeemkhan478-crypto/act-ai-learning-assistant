const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const FALLBACK_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-r1:free",
  "google/gemini-2.0-flash-lite-preview-02-05:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "openrouter/free"
];

export function getOpenRouterKey() {
  return process.env.OPENROUTER_API_KEY || '';
}

export async function callOpenRouter(messages, maxTokens = 1000, preferredModel = null) {
  const apiKey = getOpenRouterKey();
  const modelsToTry = preferredModel ? [preferredModel] : FALLBACK_MODELS;

  for (const tryModel of modelsToTry) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://vercel.app',
          'X-Title': 'PathAI'
        },
        body: JSON.stringify({
          model: tryModel,
          messages,
          max_tokens: maxTokens
        })
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        return {
          content: data.choices[0].message.content,
          modelUsed: tryModel
        };
      }
    } catch (err) {
      console.error(`OpenRouter error with ${tryModel}:`, err);
      continue;
    }
  }

  return { content: null, modelUsed: null };
}
