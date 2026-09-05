import { GoogleGenAI, Type } from '@google/genai';
import { getGeminiApiKey } from './secrets.js';

let genAIClient: GoogleGenAI | null = null;

async function getGenAIClient(): Promise<GoogleGenAI> {
  const apiKey = await getGeminiApiKey();
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

/**
 * Generates the next response in a multi-turn conversation.
 */
export async function generateChatResponse(messages: ChatMessage[]): Promise<string> {
  const ai = await getGenAIClient();

  // Map messages to Gemini format
  const contents = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents,
    config: {
      systemInstruction:
        'You are MindVault AI, an articulate, supportive, and intellectually deep personal knowledge companion and reflection partner. Your purpose is to help the user learn, explore thoughts, brainstorm creative ideas, and journal meaningfully. Always provide clear, thoughtful, and well-structured answers using clean Markdown.',
      temperature: 0.7,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('No response returned from Gemini API');
  }

  return text;
}

export interface ConversationSummary {
  title: string;
  summary: string;
  topics: string[];
}

/**
 * Generates an executive title, concise summary, and topic tags for a conversation.
 */
export async function summarizeConversation(messages: ChatMessage[]): Promise<ConversationSummary> {
  const ai = await getGenAIClient();

  const conversationTranscript = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
    .join('\n\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: `Analyze the following user-AI dialogue from MindVault AI. Generate a concise, meaningful title (max 7 words), an insightful summary (2-4 sentences highlighting core concepts and decisions), and 2 to 5 relevant topic tags.\n\nDIALOGUE:\n${conversationTranscript}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'A crisp, meaningful title for this conversation (maximum 7 words).',
          },
          summary: {
            type: Type.STRING,
            description: 'A concise summary of key discussions, ideas explored, or conclusions.',
          },
          topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of 2-5 tags or domain keywords.',
          },
        },
        required: ['title', 'summary', 'topics'],
      },
    },
  });

  const text = response.text;
  if (!text) {
    return {
      title: 'MindVault Conversation',
      summary: 'A multi-turn exploration and reflection session.',
      topics: ['Reflection', 'Knowledge'],
    };
  }

  try {
    return JSON.parse(text) as ConversationSummary;
  } catch (err) {
    console.error('Failed to parse summary JSON:', err);
    return {
      title: 'MindVault Conversation',
      summary: text.slice(0, 300),
      topics: ['MindVault'],
    };
  }
}

export interface WeeklyReflectionOutput {
  topics: string[];
  learned: string;
  patterns: string;
  nextSteps: string[];
  motivationalInsight: string;
}

/**
 * Generates an AI Weekly Reflection based strictly on the authenticated user's conversations.
 */
export async function generateWeeklyReflection(
  conversations: Array<{ title: string; summary: string; topics?: string[] }>
): Promise<WeeklyReflectionOutput> {
  const ai = await getGenAIClient();

  const contentSummary = conversations
    .map(
      (c, i) =>
        `Conversation #${i + 1}: "${c.title}"\nTopics: ${(c.topics || []).join(', ')}\nSummary: ${c.summary}`
    )
    .join('\n\n');

  const prompt = `You are MindVault AI's Personal Growth & Synthesis Engine.
You have been provided with the recent saved conversations of this individual user.
Synthesize their week across these 5 strict pillars:
1. Main Topics: High-level themes and subjects explored.
2. What You Learned: Clear conceptual synthesis of the knowledge, techniques, or insights gained.
3. Recurring Interests & Patterns: Cognitive habits, curiosities, or recurring challenges noticed across conversations.
4. Recommended Next Steps: Exactly 3 pragmatic, high-impact action items or learning trajectories to pursue next.
5. AI Insight: A poignant, empowering, and motivational personal reflection tailored specifically to their demonstrated thoughts.

USER'S SAVED SESSIONS:
${contentSummary}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of main topics discussed this week.',
          },
          learned: {
            type: Type.STRING,
            description: 'A rich synthesis of what the user learned and explored.',
          },
          patterns: {
            type: Type.STRING,
            description: 'Recurring interests, mental models, and thematic patterns observed.',
          },
          nextSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Three recommended, actionable next steps.',
          },
          motivationalInsight: {
            type: Type.STRING,
            description: 'A short, uplifting, and customized motivational insight.',
          },
        },
        required: ['topics', 'learned', 'patterns', 'nextSteps', 'motivationalInsight'],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Failed to generate weekly reflection response from Gemini');
  }

  return JSON.parse(text) as WeeklyReflectionOutput;
}
