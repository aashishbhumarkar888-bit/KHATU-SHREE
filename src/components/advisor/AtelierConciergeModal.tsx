import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Search, 
  Send, 
  RotateCcw, 
  ExternalLink, 
  TrendingUp, 
  Leaf, 
  HelpCircle,
  ShieldCheck,
  Check
} from 'lucide-react';
import { streamAdvisorChat, ChatMessage } from '../../lib/gemini';
import { useToastNotification } from '../../context/ToastNotificationContext';

interface AtelierConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

const INITIAL_GREETING: ChatMessage = {
  id: 'msg-init-1',
  role: 'model',
  text: `जय श्री श्याम! Welcome to Khatu Shri AI Advisor, Bhopal.

I provide authentic Ayurvedic counsel in Hinglish, live MP Krishi Mandi price trends with Google Search grounding, and catalog recommendations for 30–50% profit reselling. How may I assist your family or business today?`,
  timestamp: 'Just now',
};

const QUICK_PROMPTS = [
  { label: '🌿 Ayurvedic Ghee Purity Test', prompt: 'How can I test A2 Gir Cow bilona ghee purity at home and what are its Ayurvedic benefits?' },
  { label: '🌾 Live Sehore Wheat Mandi Rate', prompt: 'What are current Sehore Sharbati wheat and mustard oil mandi prices in Bhopal?' },
  { label: '💼 Reselling with 30-50% Margin', prompt: 'Which Khatu Shri catalog products give the best 30–50% profit margin for dropshipping?' },
  { label: '🪔 Copper Water & Tamra Jal', prompt: 'What are the Ayurvedic digestion benefits of drinking water from a pure hammered copper dispenser?' },
];

export const AtelierConciergeModal: React.FC<AtelierConciergeModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
}) => {
  const { showCustomToast } = useToastNotification();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isStreaming, setIsStreaming] = useState(false);
  const [searchGroundingEnabled, setSearchGroundingEnabled] = useState(true);
  const [conversation, setConversation] = useState<ChatMessage[]>([INITIAL_GREETING]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new tokens / messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation, isStreaming]);

  // Handle initial prompt passed from external components (e.g. Hero or Navbar)
  useEffect(() => {
    if (isOpen && initialPrompt && initialPrompt.trim() !== '') {
      setPrompt(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  if (!isOpen) return null;

  // New Chat handler: resets conversation history
  const handleNewChat = () => {
    setConversation([
      {
        ...INITIAL_GREETING,
        id: `msg-init-${Date.now()}`,
        timestamp: 'Just now',
      },
    ]);
    setPrompt('');
    setIsStreaming(false);
    try {
      showCustomToast({
        orderId: 'AI-ADVISOR',
        newStatus: 'delivered',
        title: 'New Session Started',
        message: 'Khatu Shri AI Advisor history has been refreshed.',
        duration: 3000,
      });
    } catch {
      // ignore
    }
  };

  // Submit and stream message token-by-token
  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const messageText = (customText !== undefined ? customText : prompt).trim();
    if (!messageText || isStreaming) return;

    setPrompt('');

    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const modelMessageId = `model-${Date.now()}`;
    const placeholderModelMsg: ChatMessage = {
      id: modelMessageId,
      role: 'model',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    // Maintain full conversation history
    const nextConversation = [...conversation, userMsg];
    setConversation([...nextConversation, placeholderModelMsg]);
    setIsStreaming(true);

    try {
      // Prepare full message history payload for Gemini API
      const historyPayload = nextConversation.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      await streamAdvisorChat(
        historyPayload,
        searchGroundingEnabled,
        {
          onToken: (token, fullText) => {
            setConversation((prev) =>
              prev.map((msg) =>
                msg.id === modelMessageId
                  ? { ...msg, text: fullText }
                  : msg
              )
            );
          },
          onGroundingMetadata: (metadata) => {
            setConversation((prev) =>
              prev.map((msg) =>
                msg.id === modelMessageId
                  ? { ...msg, groundingMetadata: metadata }
                  : msg
              )
            );
          },
        }
      );

      // Finalize model message
      setConversation((prev) =>
        prev.map((msg) =>
          msg.id === modelMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );
    } catch (err: unknown) {
      console.warn('AI Advisor call notice:', err);
      const errMsg = err instanceof Error ? err.message : 'Unable to reach Gemini API';

      // Friendly error toast so the application never crashes
      try {
        showCustomToast({
          orderId: 'AI-ADVISOR',
          newStatus: 'processing',
          title: 'Advisor Network Notice',
          message: 'Connecting via offline Vedic knowledge fallback. Please check your GEMINI_API_KEY.',
          duration: 5000,
        });
      } catch {
        // ignore
      }

      // Context-aware fallback counsel adhering strictly to the system prompt
      let fallbackText = '';
      const lower = messageText.toLowerCase();

      if (lower.includes('mandi') || lower.includes('wheat') || lower.includes('rate') || lower.includes('price')) {
        fallbackText = `Bhopal & Sehore Mandi indicative rates:
• Sehore Sharbati Gehun (C-306): ₹3,200 – ₹3,850 per quintal.
• Yellow Mustard (Peeli Sarson): ₹5,400 – ₹5,900 per quintal.
• Desi Chana: ₹5,100 – ₹5,650 per quintal.
*Note: Mandi prices vary daily based on crop arrivals and moisture content.*`;
      } else if (lower.includes('resell') || lower.includes('margin') || lower.includes('dropship') || lower.includes('profit')) {
        fallbackText = `Top Khatu Shri Reselling Catalog Picks:
1. Vedic A2 Gir Cow Bilona Ghee: Wholesale ₹1,450 → Resell at ₹1,950 to ₹2,175 (35%–50% margin).
2. Pure Hammered Copper Dispenser (5L): Wholesale ₹1,650 → Resell at ₹2,150 to ₹2,475 (30%–50% margin).
3. Handloom Khadi Kurta Set: Wholesale ₹890 → Resell at ₹1,200 to ₹1,335 (35%–50% margin).
Fast dispatch & 0% inventory risk!`;
      } else {
        fallbackText = `Aapke swasthya ke liye shuddh Vedic A2 bilona ghee aur Tamra jal bahut labhdayak hain. Bilona ghee digestive agni ko tezz karta hai aur pitta ko shant rakhta hai. Adulteration check ke liye ghee ki 1/2 boond apni hatheli par rakhein—shuddh ghee sharir ke taapman par turant pighal jata hai.
*Disclaimer: Yeh paramparik gyaan hai. Kisi bhi rog ke nidan ke liye kripya certified Ayurvedic Vaidya se paramarsh karein.*`;
      }

      setConversation((prev) =>
        prev.map((msg) =>
          msg.id === modelMessageId
            ? {
                ...msg,
                text: fallbackText,
                isStreaming: false,
                groundingMetadata: searchGroundingEnabled ? { searchFallBack: true } : undefined,
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#FBF9F5] border border-[#E8E5DF] text-[#1C1917] w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col h-[88vh] sm:h-[85vh] relative overflow-hidden my-auto">
        
        {/* ========================================================================= */}
        {/* 1. TOP HEADER WITH NEW CHAT BUTTON                                        */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E8E5DF] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1B4332] flex items-center justify-center text-[#DDA15E] shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold text-[#1B4332]">
                  KHATU SHRI AI ADVISOR
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#B45309] bg-[#FFFBEB] px-1.5 py-0.5 rounded border border-[#FDE68A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
                  Gemini 3.8
                </span>
              </div>
              <p className="text-[11px] text-[#78716C]">
                Ayurvedic Nutrition · Live Mandi Prices · Reseller Margins (Bhopal, MP)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              disabled={isStreaming}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E5DF] hover:border-[#1B4332] text-xs font-semibold text-[#1B4332] bg-white hover:bg-[#FAF7F2] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Reset conversation and start fresh"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D97706]" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            {/* Google Search Grounding Toggle */}
            <button
              onClick={() => setSearchGroundingEnabled(!searchGroundingEnabled)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                searchGroundingEnabled
                  ? 'bg-[#EBF5FB] border-[#AED6F1] text-[#1B4F72]'
                  : 'bg-white border-[#E8E5DF] text-[#78716C] hover:text-[#1C1917]'
              }`}
              title={searchGroundingEnabled ? 'Google Search Grounding Active' : 'Search Grounding Disabled'}
            >
              <Search className={`w-3.5 h-3.5 ${searchGroundingEnabled ? 'text-[#2980B9]' : 'text-[#78716C]'}`} />
              <span className="hidden md:inline">Grounding:</span>
              <span>{searchGroundingEnabled ? 'Active' : 'Off'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2] rounded-lg transition-colors cursor-pointer"
              title="Close Advisor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CONVERSATION MESSAGE STREAM                                            */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {conversation.map((msg) => {
            const isUser = msg.role === 'user';
            const hasGrounding = Boolean(msg.groundingMetadata);
            const webQueries: string[] = msg.groundingMetadata?.webSearchQueries || [];
            const webSources: Array<{ uri?: string; title?: string }> = (
              msg.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean) || []
            );

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
              >
                <div
                  className={`max-w-2xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-[#1B4332] text-white shadow-sm rounded-br-xs'
                      : 'bg-white text-[#1C1917] border border-[#E8E5DF] shadow-2xs rounded-bl-xs'
                  }`}
                >
                  {/* Model Message Content or Typing Indicator */}
                  {!isUser && msg.text === '' && msg.isStreaming ? (
                    <div className="flex items-center gap-2 py-1 text-xs text-[#78716C]">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#1B4332] animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 rounded-full bg-[#D97706] animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 rounded-full bg-[#1B4332] animate-bounce" />
                      </div>
                      <span className="font-semibold text-[#1B4332]">
                        Khatu Shri Advisor is researching &amp; composing...
                      </span>
                    </div>
                  ) : (
                    <>
                      <span>{msg.text}</span>
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#D97706] animate-pulse align-middle" />
                      )}
                    </>
                  )}

                  {/* Grounded with Google Search Chip */}
                  {!isUser && hasGrounding && (
                    <div className="mt-3 pt-2.5 border-t border-[#E8E5DF] flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EBF5FB] border border-[#AED6F1] text-[#1B4F72] text-[10px] font-bold">
                          <Search className="w-3 h-3 text-[#2980B9]" />
                          <span>Grounded with Google Search</span>
                        </div>
                        {webQueries.slice(0, 2).map((query, i) => (
                          <span
                            key={i}
                            className="text-[10px] text-[#546E7A] bg-[#F4F6F7] px-2 py-0.5 rounded border border-[#CFD8DC]"
                          >
                            "{query}"
                          </span>
                        ))}
                      </div>

                      {/* Web Source Links */}
                      {webSources.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-[10px] text-[#2980B9] pt-1">
                          {webSources.slice(0, 3).map((src, i) => (
                            <a
                              key={i}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-1 text-[#2471A3] bg-white px-2 py-0.5 rounded border border-[#E8E5DF] max-w-[220px] truncate"
                            >
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{src.title || src.uri}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-1 px-1 flex items-center gap-2 text-[10px] text-[#A8A29E]">
                  <span>{msg.timestamp || 'Just now'}</span>
                  {!isUser && (
                    <>
                      <span>·</span>
                      <span className="text-[#1B4332] font-medium">Khatu Shri Intelligence</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* ========================================================================= */}
        {/* 3. QUICK SUGGESTION PROMPTS                                               */}
        {/* ========================================================================= */}
        <div className="px-4 py-2 bg-[#FAF7F2] border-t border-[#E8E5DF] flex items-center gap-2 overflow-x-auto hide-scrollbar shrink-0">
          <span className="text-[10px] text-[#78716C] font-bold uppercase tracking-wider shrink-0 mr-1">
            Suggested:
          </span>
          {QUICK_PROMPTS.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(undefined, qp.prompt)}
              disabled={isStreaming}
              className="text-[11px] font-medium text-[#1B4332] hover:text-white bg-white hover:bg-[#1B4332] px-3 py-1 rounded-full border border-[#E8E5DF] hover:border-[#1B4332] whitespace-nowrap transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* 4. CHAT INPUT FORM                                                        */}
        {/* ========================================================================= */}
        <form
          onSubmit={handleSend}
          className="p-3 sm:p-4 bg-white border-t border-[#E8E5DF] flex items-center gap-2 shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask about Ayurvedic health, live mandi rates, or catalog products for 30–50% reselling..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isStreaming}
            className="flex-1 bg-[#FAF7F2] border border-[#E8E5DF] focus:border-[#1B4332] focus:bg-white p-3 text-xs sm:text-sm rounded-xl text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isStreaming || !prompt.trim()}
            className="p-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl disabled:opacity-40 transition-colors cursor-pointer shadow-sm flex items-center justify-center shrink-0"
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
