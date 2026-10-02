import { GoogleGenAI } from '@google/genai';

/**
 * Khatu Shri AI Advisor System Instruction
 * Configured as specified for Bhopal-based dropshipping marketplace.
 */
export const SYSTEM_PROMPT = `You are the Khatu Shri AI Advisor for a Bhopal-based Indian dropshipping marketplace selling A2 dairy, khadi apparel, organic groceries, copper ware, and puja samagri. For Ayurvedic questions give warm practical Hinglish guidance ending with a disclaimer to consult a vaidya. For mandi price questions give indicative ranges with a 'prices vary daily' note. For reselling questions recommend specific catalog products with wholesale prices and suggest 30–50% markup selling prices. Keep answers under 120 words.`;

/**
 * Access API key from environment variables without ever logging or exposing it.
 */
export function getGeminiApiKey(): string {
  const key = 
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_GEMINI_API_KEY || import.meta.env?.GEMINI_API_KEY)) ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    '';
  return typeof key === 'string' ? key.trim() : '';
}

let clientInstance: GoogleGenAI | null = null;

/**
 * Initializes and returns the @google/genai SDK instance.
 * Fails gracefully if the key is absent.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not defined.');
  }

  if (!clientInstance) {
    clientInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return clientInstance;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  groundingMetadata?: any;
  timestamp?: string;
  isStreaming?: boolean;
}

export interface StreamAdvisorCallbacks {
  onToken: (token: string, accumulatedText: string) => void;
  onGroundingMetadata?: (metadata: any) => void;
}

/**
 * Streams responses token-by-token from Gemini API with search grounding support.
 * Checks for client-side API key first, and seamlessly falls back to server streaming route.
 */
export async function streamAdvisorChat(
  messages: Array<{ role: 'user' | 'model'; text: string }>,
  enableSearchGrounding: boolean = true,
  callbacks: StreamAdvisorCallbacks
): Promise<{ text: string; groundingMetadata?: any }> {
  const apiKey = getGeminiApiKey();

  // Mode 1: Client-Side direct SDK streaming if API key is present in environment
  if (apiKey) {
    try {
      const ai = getGeminiClient();
      
      const contents = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      const config: any = {
        systemInstruction: SYSTEM_PROMPT,
      };

      if (enableSearchGrounding) {
        config.tools = [{ googleSearch: {} }];
      }

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents,
        config,
      });

      let fullText = '';
      let capturedMetadata: any = null;

      for await (const chunk of responseStream) {
        const metadata = chunk.candidates?.[0]?.groundingMetadata;
        if (metadata) {
          capturedMetadata = { ...capturedMetadata, ...metadata };
          if (callbacks.onGroundingMetadata) {
            callbacks.onGroundingMetadata(capturedMetadata);
          }
        }

        const token = chunk.text;
        if (token) {
          fullText += token;
          callbacks.onToken(token, fullText);
        }
      }

      return { text: fullText, groundingMetadata: capturedMetadata };
    } catch (clientErr) {
      console.warn('Client-side Gemini stream attempt failed, checking server endpoint...', clientErr);
      // Fall through to server-side streaming
    }
  }

  // Mode 2: Server-side streaming endpoint via SSE (Server-Sent Events)
  const response = await fetch('/api/advisor/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      enableSearchGrounding,
    }),
  });

  if (!response.ok) {
    let errorDetail = `Server error ${response.status}`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.error || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  if (!response.body) {
    throw new Error('Streaming response body not supported by browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let capturedMetadata: any = null;
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.replace(/^data:\s*/, '');
      if (dataStr === '[DONE]') continue;

      try {
        const payload = JSON.parse(dataStr);
        if (payload.token) {
          fullText += payload.token;
          callbacks.onToken(payload.token, fullText);
        }
        if (payload.groundingMetadata) {
          capturedMetadata = { ...capturedMetadata, ...payload.groundingMetadata };
          if (callbacks.onGroundingMetadata) {
            callbacks.onGroundingMetadata(capturedMetadata);
          }
        }
      } catch {
        // partial json fragment
      }
    }
  }

  return { text: fullText, groundingMetadata: capturedMetadata };
}
