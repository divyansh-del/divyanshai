
import { Message } from '../types';

// Use a free model by default for fallback
const FALLBACK_MODEL = "google/gemma-2-9b-it:free"; 

// SAFE ACCESS for Vite env variables + HARDCODED FALLBACK KEY provided by user
const ENV_OPENROUTER_KEY = ((import.meta as any).env && (import.meta as any).env.VITE_OPENROUTER_API_KEY) || "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";

export async function* streamOpenRouterResponse(
  history: Message[],
  currentPrompt: string,
  systemInstruction: string,
  customKey?: string
): AsyncGenerator<string, void, unknown> {
  // Prefer custom key from settings, then env var/hardcoded key
  const apiKey = customKey || ENV_OPENROUTER_KEY;

  if (!apiKey) {
      yield "⚠️ OpenRouter API Key missing. Please check connection.";
      throw new Error("Missing OpenRouter Key");
  }

  try {
    const messages = [
        { role: 'system', content: systemInstruction },
        ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content })),
        { role: 'user', content: currentPrompt }
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin, // Required by OpenRouter
        "X-Title": "ChatBharat Ultra", // Required by OpenRouter
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: FALLBACK_MODEL,
        messages: messages,
        stream: true
      })
    });

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line === 'data: [DONE]') return;
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.substring(6));
            const content = json.choices[0]?.delta?.content;
            if (content) yield content;
          } catch (e) {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }

  } catch (error) {
    console.error("OpenRouter Error:", error);
    throw error; // Re-throw so main service knows to fallback
  }
}