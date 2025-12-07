
import { GoogleGenAI, GenerateContentResponse, Tool, Modality } from "@google/genai";
import { Message, AppSettings } from '../types';
import { getGeminiTools, executeAppAction } from './appsService';
import { streamOpenRouterResponse } from './openRouterService';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CHATBHARAT_VOICE_INSTRUCTION = `
STRICT IDENTITY INSTRUCTIONS:
1.  **YOUR NAME:** Your name is **ChatBharat** (चैटभारत).
2.  **WHO ARE YOU:** You are an advanced AI operating system named ChatBharat Ultra.
3.  **PROHIBITED:** You must **NEVER** identify yourself as "Gemini", "Google's AI", "Bard", or "OpenAI". If the user asks, you are simply "ChatBharat".
4.  **CREATOR:** If asked who made you, say "I am ChatBharat, created to help you."

TONE & STYLE:
"तुम एक नैचरल, दोस्ताना, और बुद्धिमान AI हो।
तुम्हारा जवाब सटीक (precise) और प्रैक्टिकल होना चाहिए।
हवा में बातें मत करो — step-by-step plan और code solutions दो।
अगर यूज़र हिंदी में पूछे, तो Hinglish (Hindi+English mix) में नैचरल जवाब दो।
तुम हर वॉइस मैसेज को पहले समझोगे, फिर उसी टोन में रिप्लाई दोगे जैसे दो दोस्त आराम से बात कर रहे हों।"

ADDITIONAL RULES:
1. **Web Search**: If the user asks about recent events, news, or specific data, use the Google Search tool.
2. **Streaming**: Responses should be generated progressively.
3. **Multimodal**: Analyze images if provided.
`.trim();

const AGENT_PERSONAS: Record<string, { name: string, instruction: string }> = {
    'devmaster': {
        name: 'DevMaster',
        instruction: `
        🔥 **ACTIVATING DEVMASTER PROTOCOL** 🔥
        You are now DevMaster, an elite Senior Software Architect and Coding Wizard.
        - **Focus:** Pure code quality, performance, architecture, and debugging.
        - **Output:** Provide complete, production-ready code blocks. Do not give partial snippets unless asked.
        - **Style:** Technical, precise, and authoritative.
        - **Canvas:** If writing a script or full component, mention: "You can run this in the Canvas."
        `
    },
    'bizguru': {
        name: 'BizGuru',
        instruction: `
        💰 **ACTIVATING BIZGURU PROTOCOL** 💰
        You are now BizGuru, a wealthy business strategist and entrepreneur.
        - **Focus:** ROI, profit margins, marketing, farming business, and side hustles.
        - **Style:** Practical, money-minded, and motivating.
        - **Advice:** Always focus on low-investment, high-return strategies.
        `
    },
    'studybuddy': {
        name: 'StudyBuddy',
        instruction: `
        📚 **ACTIVATING STUDYBUDDY PROTOCOL** 📚
        You are now StudyBuddy, a genius tutor for Indian students (CBSE/ICSE/JEE/NEET).
        - **Focus:** Syllabus coverage, exam tips, memory tricks, and timetables.
        - **Style:** Encouraging, simple, and structured.
        - **Method:** Use analogies to explain complex topics.
        `
    },
    'techfixer': {
        name: 'TechFixer',
        instruction: `
        🔧 **ACTIVATING TECHFIXER PROTOCOL** 🔧
        You are now TechFixer, a master troubleshooter.
        - **Focus:** Resolving crashes, deployment errors, server issues, and bugs.
        - **Style:** Step-by-step, analytical, and solution-oriented.
        - **Output:** Diagnose the error first, then provide the fix.
        `
    }
};

export const determineActiveAgent = (text: string): string | null => {
  const t = text.toLowerCase();
  // Code & Dev
  if (/(code|react|typescript|python|java|kotlin|script|function|api|component|css|html|algorithm)/.test(t)) return 'devmaster';
  // Business & Money
  if (/(money|earn|profit|business|farm|freelance|client|investment|startup|idea|rupees|dollar)/.test(t)) return 'bizguru';
  // Education
  if (/(study|exam|board|syllabus|physics|math|chemistry|student|learn|prepare|timetable|revision)/.test(t)) return 'studybuddy';
  // Tech Support
  if (/(crash|error|deploy|server|database|supabase|firebase|vercel|netlify|bug|fix|issue|not working)/.test(t)) return 'techfixer';
  
  return null;
};

export const checkContentSafety = async (text: string, userId: string = 'default_user'): Promise<{ allowed: boolean, error?: string }> => {
    return { allowed: true };
};

export function buildSystemPrompt(settings?: AppSettings, gptInstruction?: string): string {
  if (gptInstruction) return gptInstruction + "\n\n" + CHATBHARAT_VOICE_INSTRUCTION;

  const memoryEnabled = settings?.personalization?.memory?.enabled ?? true;
  const custom = settings?.personalization?.custom_instructions ?? "";
  const baseStyle = settings?.personalization?.baseStyle || "Professional";
  const isRoastMode = settings?.personalization?.roast_mode ?? false;
  const voicePersona = settings?.voice_config?.voice_persona_prompt ?? "";

  const enforcement: string[] = [CHATBHARAT_VOICE_INSTRUCTION];
  
  if (isRoastMode) {
      enforcement.push(`
      🚨 **ROAST MODE ENABLED** 🚨
      You are now in "Roast Mode" (Evil Twin Personality).
      - **Attitude:** Sarcastic, brutally honest, witty, and funny.
      - **Tone:** Use internet slang, emojis (💀, 😂), and be edgy.
      - **Goal:** Roast the user's question before answering it.
      `);
  } else {
      enforcement.push(`COMMUNICATION STYLE: ${baseStyle}. Adopt this tone for all responses.`);
  }

  // Inject Voice Persona (affecting text tone as well if provided)
  if (voicePersona && voicePersona.trim().length > 0) {
      enforcement.push(`CUSTOM PERSONA / VOICE IDENTITY:
      "${voicePersona.trim()}"
      Strictly adopt this persona, speaking style, and behavior in all responses.`);
  }
  
  // Inject Memories
  const memories = settings?.personalization?.memories || [];
  if (memoryEnabled && memories.length > 0) {
      const memoryText = memories.map(m => `- ${m.content}`).join('\n');
      enforcement.push(`LONG TERM MEMORY:\n${memoryText}`);
  }

  if (custom && custom.trim().length > 0) {
    enforcement.push(`USER CUSTOM INSTRUCTIONS: ${custom.trim()}`);
  }

  return enforcement.join("\n\n");
}

const sanitizeHistory = (messages: Message[], maxDepth: number = 10) => {
    const formatted = [];
    const recent = messages.slice(-maxDepth);
    
    let lastRole = null;
    for (const msg of recent) {
        if (!msg.content && !msg.image) continue;
        const role = msg.role === 'model' ? 'model' : 'user';
        if (role === lastRole && role === 'user') formatted.pop();

        if (msg.image) {
             const match = msg.image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
             if (match) {
                 formatted.push({
                     role: role,
                     parts: [{ inlineData: { mimeType: match[1], data: match[2] } }, { text: msg.content || " " }]
                 });
             } else {
                 formatted.push({ role, parts: [{ text: msg.content }] });
             }
        } else {
            formatted.push({ role, parts: [{ text: msg.content }] });
        }
        lastRole = role;
    }
    if (formatted.length > 0 && formatted[formatted.length - 1].role === 'user') formatted.pop();
    return formatted;
};

// --- CORE GENERATION LOGIC ---

async function* executeGemini(
    history: Message[],
    currentPrompt: string,
    systemInstruction: string,
    settings: AppSettings,
    attachmentData?: string,
    isDeepThinking?: boolean,
    modelMode?: 'Flash' | 'Pro' | 'Reasoning'
): AsyncGenerator<string | { groundingMetadata: any } | { activeAgentId: string }, void, unknown> {
    const brain = settings.brain || { creativity_level: 0.7, thinking_power: 'Balanced', memory_depth: 10, fact_check: false };
    const chatHistory = sanitizeHistory(history.slice(0, -1), brain.memory_depth);
    
    const appTools = getGeminiTools();
    const tools: Tool[] = [];
    
    const needsSearch = brain.fact_check || currentPrompt.toLowerCase().includes('news') || isDeepThinking || modelMode === 'Reasoning';

    if (needsSearch) tools.push({ googleSearch: {} });
    if (appTools.length > 0) tools.push({ functionDeclarations: appTools });

    let modelName = 'gemini-2.5-flash'; 
    let thinkingBudget = 0;

    if (modelMode === 'Pro') modelName = 'gemini-3-pro-preview';
    else if (modelMode === 'Reasoning') {
        modelName = 'gemini-2.5-flash';
        thinkingBudget = 8192;
    } else if (brain.thinking_power === 'Deep') thinkingBudget = 4096;
    else if (brain.thinking_power === 'O1-Preview') thinkingBudget = 8192;

    let config: any = { systemInstruction, tools: tools.length > 0 ? tools : undefined };
    if (thinkingBudget > 0) config.thinkingConfig = { thinkingBudget };
    config.temperature = brain.creativity_level;

    console.log(`[Gemini] Using ${modelName}`);

    const chat = ai.chats.create({ model: modelName, config: config, history: chatHistory });

    let msgPayload: any = { message: currentPrompt };
    if (attachmentData) {
        const match = attachmentData.match(/^data:([a-zA-Z0-9.\/-]+);base64,(.+)$/);
        if (match) {
            msgPayload = { message: [{ inlineData: { mimeType: match[1], data: match[2] } }, { text: currentPrompt || "Analyze this." }] };
        }
    }

    const resultStream = await chat.sendMessageStream(msgPayload);

    for await (const chunk of resultStream) {
        const responseChunk = chunk as GenerateContentResponse;
        
        if (responseChunk.candidates?.[0]?.groundingMetadata) {
            yield { groundingMetadata: responseChunk.candidates[0].groundingMetadata };
        }

        if (responseChunk.functionCalls && responseChunk.functionCalls.length > 0) {
            const call = responseChunk.functionCalls[0];
            yield `\n[Using App: ${call.name}...]`;
            const toolResult = await executeAppAction(call.name, call.args);
            const finalRes = await chat.sendMessage({ message: [{ functionResponse: { name: call.name, response: { result: toolResult } } }] });
            if (finalRes.text) yield finalRes.text;
            return;
        }

        if (responseChunk.text) yield responseChunk.text;
    }
}

export async function* streamGeminiResponse(
  history: Message[],
  currentPrompt: string,
  settings: AppSettings,
  gptInstruction?: string,
  attachmentData?: string,
  isDeepThinking?: boolean,
  modelMode?: 'Flash' | 'Pro' | 'Reasoning'
): AsyncGenerator<string | { groundingMetadata: any } | { activeAgentId: string }, void, unknown> {
    let systemInstruction = buildSystemPrompt(settings, gptInstruction);
    
    // --- AUTO DETECT AGENT ---
    // Only detect if not using a specific custom GPT
    if (!gptInstruction) {
        const autoAgentId = determineActiveAgent(currentPrompt);
        if (autoAgentId) {
            const agent = AGENT_PERSONAS[autoAgentId];
            console.log(`[Auto-Detect] Switching to ${agent.name}`);
            
            // Inject Agent Persona
            systemInstruction += `\n\n${agent.instruction}`;
            
            // Signal UI immediately
            yield { activeAgentId: autoAgentId };
        }
    }

    const developer = settings.developer || { primary_provider: 'Gemini' };
    
    if (developer.primary_provider === 'OpenRouter') {
        // ... (OpenRouter logic) ...
        try {
            yield* streamOpenRouterResponse(history, currentPrompt, systemInstruction, (developer as any).openrouter_key);
            return;
        } catch(e) { /* Fallback */ }
    }

    try {
        yield* executeGemini(history, currentPrompt, systemInstruction, settings, attachmentData, isDeepThinking, modelMode);
    } catch (geminiError) {
         yield "⚠️ System Error. Please check connection.";
    }
}

export const generateResponse = async (history: Message[], currentPrompt: string, settings: AppSettings): Promise<string> => {
    let fullText = "";
    const generator = streamGeminiResponse(history, currentPrompt, settings);
    for await (const chunk of generator) {
        if (typeof chunk === 'string') fullText += chunk;
    }
    return fullText;
};

// ... exports for generateTitle, generateImage, generateSummary, generateWriting ...
export const generateWriting = async (topic: string, tone: string, format: string, length: string): Promise<string> => {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Write a ${length} ${format} about ${topic} in ${tone} tone.` });
    return response.text || "";
};
export const generateTitle = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Title for: ${prompt}` });
    return response.text?.replace(/"/g, '').trim() || "New Chat";
};
export const generateImage = async (prompt: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] } });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData ? `data:${response.candidates[0].content.parts[0].inlineData.mimeType};base64,${response.candidates[0].content.parts[0].inlineData.data}` : null;
    } catch { return null; }
};
export const generateSummary = async (messages: Message[]): Promise<string> => {
    const transcript = messages.slice(-30).map(m => `${m.role}: ${m.content}`).join('\n');
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Summarize:\n${transcript}` });
    return response.text || "";
};
