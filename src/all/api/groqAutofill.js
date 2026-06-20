/**
 * groqAutofill.js — Uses Groq AI to auto-fill project details
 * based on the project name and live link.
 * Tries multiple models in order until one succeeds.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Try models in order — first available one wins
const MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
];

/**
 * Call Groq AI to generate project details from name + link.
 * Returns an object with suggested field values.
 */
export async function fetchProjectDetails(projectName, link, categories) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('VITE_GROQ_API_KEY is not configured');

  const categoryList = categories.map(c => c.label).join(', ');

  const prompt = `You are a helpful assistant that generates project metadata for a link-sharing platform.

Given the following project:
- Name: "${projectName}"
- URL: "${link}"

Available categories: ${categoryList}

Analyze the project name and URL to determine what this project/tool/website is about. Then generate the following fields in JSON format:

{
  "details": "A brief 1-2 sentence overview of what this project does (max 200 chars)",
  "subdetails": "Technical details, key features, and requirements (max 300 chars)",
  "guide": "A brief step-by-step guide on how to use it (max 300 chars)",
  "source": "The platform/source (e.g. GitHub, GitLab, npm, Official Website, etc.)",
  "category": "The best matching category from the available list above (exact label)",
  "subCategory": "A suggested subcategory if applicable, or empty string",
  "accessType": "FREE or PAID or BOTH based on what you can infer",
  "image": "A suggested favicon or logo URL if you can infer one from the domain, otherwise empty string",
  "implementation": "If this is a code library/tool/API, provide a short useful code snippet showing basic usage. If it is NOT a code project, return empty string. Keep under 500 chars."
}

Rules:
- Be concise and factual. If you cannot determine something, use an empty string.
- For category, pick the BEST match from the available list (exact label).
- For source, infer from the URL domain (github.com → GitHub, npm.js.org → npm, etc.).
- For implementation, ONLY provide code if the project is a library, framework, CLI tool, or API.
- Return ONLY valid JSON, no markdown, no explanation`;

  let lastError;

  for (const model of MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a JSON-only response bot. Return only valid JSON.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errMsg = err?.error?.message || `Groq API error: ${res.status}`;
        // If model is blocked/not found, try next model
        if (res.status === 400 || res.status === 404 || errMsg.includes('blocked') || errMsg.includes('not found')) {
          lastError = new Error(errMsg);
          continue;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error('Empty response from AI');

      // Parse JSON — handle potential markdown code blocks
      let cleaned = content;
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      return JSON.parse(cleaned);

    } catch (err) {
      if (err.name === 'AbortError') {
        lastError = new Error('AI request timed out. Try again.');
        continue;
      }
      if (err instanceof SyntaxError) {
        throw new Error('AI returned invalid JSON. Please try again.');
      }
      lastError = err;
      // If it's a model-specific error, try next model
      if (err.message?.includes('blocked') || err.message?.includes('not found')) continue;
      throw err;
    }
  }

  throw lastError || new Error('All AI models unavailable. Try again later.');
}
