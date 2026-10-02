import { GoogleGenAI, ThinkingLevel } from '@google/genai';

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in server environment');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export const KHATU_ADVISOR_SYSTEM_PROMPT = `You are the Khatu Shri AI Advisor for a Bhopal-based Indian dropshipping marketplace selling A2 dairy, khadi apparel, organic groceries, copper ware, and puja samagri. For Ayurvedic questions give warm practical Hinglish guidance ending with a disclaimer to consult a vaidya. For mandi price questions give indicative ranges with a 'prices vary daily' note. For reselling questions recommend specific catalog products with wholesale prices and suggest 30–50% markup selling prices. Keep answers under 120 words.`;

export async function streamAdvisorChatServer(
  messages: Array<{ role: 'user' | 'model'; text: string }>,
  enableSearchGrounding: boolean = true,
  onChunk: (token: string) => void,
  onMetadata?: (metadata: any) => void
) {
  const ai = getAiClient();
  const contents = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));

  const config: any = {
    systemInstruction: KHATU_ADVISOR_SYSTEM_PROMPT,
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
  let accumulatedMetadata: any = null;

  for await (const chunk of responseStream) {
    const meta = chunk.candidates?.[0]?.groundingMetadata;
    if (meta) {
      accumulatedMetadata = { ...accumulatedMetadata, ...meta };
      if (onMetadata) onMetadata(accumulatedMetadata);
    }

    const token = chunk.text;
    if (token) {
      fullText += token;
      onChunk(token);
    }
  }

  return { fullText, groundingMetadata: accumulatedMetadata };
}


export interface CuratorRequest {
  mode: 'consultation' | 'search' | 'studios';
  prompt: string;
}

export async function handleCuratorQuery(req: CuratorRequest) {
  const ai = getAiClient();
  const { mode, prompt } = req;

  if (mode === 'consultation') {
    // High thinking mode using gemini-3.1-pro-preview with thinkingLevel HIGH
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: `You are the Lead Ayurvedic Nutritionist & Dropship Quality Specialist for "Khatu Shri", based in Bhopal, Madhya Pradesh, India.
You provide deep, scientifically grounded, and traditional Ayurvedic wisdom regarding:
1. A2 Gir Cow Bilona Ghee vs industrial cream-separated ghee (Dugdha to Dadhi to Bilona process, butyric acid, gut microbiome).
2. Pure farm-fresh raw & pasteurized cow milk digestion, beta-casein types, and how to preserve nutrients.
3. Madhya Pradesh agricultural staples: Sehore Sharbati wheat flour (high protein & natural sweetness), cold-pressed yellow mustard oil (Allyl Isothiocyanate & low erucic acid), raw Satpura forest honey, and Bhimseni camphor.
4. Practical tests for adulteration check at home (iodine test, water swirl test, palm melting test for ghee).
Provide warm, authoritative, respectful counsel in English (with Hindi terms where natural). Use bullet points and clear nutritional breakdowns.`,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    return {
      text: response.text,
      mode,
      modelUsed: 'gemini-3.1-pro-preview (ThinkingLevel.HIGH)',
    };
  }

  if (mode === 'search') {
    // Search Grounding using gemini-3.5-flash with googleSearch tool
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are the Quality & Mandi Research Specialist at Khatu Shri, Bhopal MP. Use Google Search to provide up-to-date information on FSSAI dairy safety standards, MP Krishi Mandi prices (Sehore, Bhopal, Hoshangabad), GI tags for MP Sharbati wheat, and organic testing protocols in India. Ground your answer with verified facts.`,
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      text: response.text,
      mode,
      modelUsed: 'gemini-3.5-flash (Google Search Grounding)',
      groundingMetadata: response.candidates?.[0]?.groundingMetadata,
    };
  }

  if (mode === 'studios') {
    // Maps Grounding using gemini-3.5-flash with googleMaps tool
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are the Bhopal Store & Delivery Hub Locator for Khatu Shri. Use Google Maps to help users locate dairy hubs, organic markets, and delivery coverage across Bhopal, Madhya Pradesh, including MP Nagar Zone 1 & 2, Arera Colony (E1-E8), New Market / TT Nagar, Kolar Road, Shahpura, Ayodhya Bypass, Hoshangabad Road, and nearby Gaushalas on Raisen / Sehore Road. Provide clear landmark directions.`,
        tools: [{ googleMaps: {} }],
      },
    });

    return {
      text: response.text,
      mode,
      modelUsed: 'gemini-3.5-flash (Google Maps Grounding)',
      groundingMetadata: response.candidates?.[0]?.groundingMetadata,
    };
  }

  throw new Error(`Unsupported curator mode: ${mode}`);
}
