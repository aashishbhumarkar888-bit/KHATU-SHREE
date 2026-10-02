import React, { useState } from 'react';
import { WHATSAPP_NUMBER } from '../../config/adminConfig';

export const WhatsAppFloatButton: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const cleanNumber = WHATSAPP_NUMBER.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
    'नमस्ते Khatu Shri! I would like to inquire about products and dropshipping.'
  )}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 pointer-events-auto">
      {/* Tooltip Pill */}
      {isHovered && (
        <div className="hidden sm:flex items-center gap-1.5 bg-[#1B4332] text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg border border-[#2D6A4F] animate-in fade-in slide-in-from-right-2 duration-150 whitespace-nowrap">
          <span>WhatsApp Care ({WHATSAPP_NUMBER})</span>
        </div>
      )}

      {/* Floating Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#25D366] hover:bg-[#20BA5A] text-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 cursor-pointer relative"
        title={`Chat with Khatu Shri on WhatsApp (${WHATSAPP_NUMBER})`}
        aria-label="Chat with Khatu Shri on WhatsApp"
      >
        {/* Pulsing indicator */}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#D97706] border-2 border-white animate-pulse" />

        {/* Official WhatsApp SVG Icon */}
        <svg
          viewBox="0 0 24 24"
          width="26"
          height="26"
          fill="currentColor"
          className="shrink-0"
        >
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.32a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.19.53-1.09 1.04-1.52 1.09-.43.05-.98.07-2.83-.69-2.24-.92-3.69-3.21-3.8-3.37-.11-.15-.92-1.22-.92-2.33 0-1.11.58-1.65.79-1.87.21-.22.46-.28.61-.28.16 0 .31 0 .45.01.14.01.34-.05.53.4.19.46.66 1.61.72 1.73.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.31-.36.42-.12.11-.24.23-.1.47.14.24.62 1.02 1.33 1.65.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.53-.12.21.08 1.34.63 1.57.75.23.12.38.18.44.28.06.1.06.58-.13 1.11z" />
        </svg>
      </a>
    </div>
  );
};
