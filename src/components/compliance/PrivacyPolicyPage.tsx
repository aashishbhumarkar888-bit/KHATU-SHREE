import React, { useEffect } from 'react';
import { ArrowLeft, Lock, Database, Cloud, Cookie, ShieldCheck, Mail } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBackToHome: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBackToHome }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Privacy Policy | Khatu Shri Bhopal';
  }, []);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] pt-24 sm:pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Breadcrumb */}
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] hover:text-[#2D6A4F] mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </button>

        {/* Page Header */}
        <div className="bg-white border border-[#E8E5DF] p-6 sm:p-8 rounded-2xl shadow-sm mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-xs font-bold mb-3 uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Data Security &amp; Confidentiality</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1B4332] tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#78716C] mt-2 leading-relaxed">
            How Khatu Shri protects your personal data, Firebase records, and Google Drive access tokens.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-xs sm:text-sm text-[#57534E] leading-relaxed">
          
          {/* Section 1: Firebase Data Storage */}
          <section className="bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-2xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#1B4332] flex items-center gap-2">
              <Database className="w-5 h-5 text-[#D97706]" />
              <span>1. Firebase Data &amp; Firestore Security</span>
            </h2>
            <p>
              When you create an account, purchase products, or resell through Khatu Shri, your profile (name, verified email, phone number, Bhopal delivery address) and orders are securely stored in <strong>Google Cloud Firestore (Enterprise Edition)</strong> under strict zero-trust security rules:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#1C1917]">
              <li><strong>Zero-Trust Rule Isolation:</strong> Customers and resellers can exclusively access and read their own orders and profile documents. No other customer can view your personal purchase history or wholesale margins.</li>
              <li><strong>Secure Session Management:</strong> Firebase Authentication uses industry-standard JWT encryption for Google Popup and Email sign-ins.</li>
            </ul>
          </section>

          {/* Section 2: Google Drive Access Scope */}
          <section className="bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-2xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#1B4332] flex items-center gap-2">
              <Cloud className="w-5 h-5 text-[#1B4332]" />
              <span>2. Google Drive Access Scope &amp; Usage</span>
            </h2>
            <p>
              Khatu Shri offers an optional <strong>"Backup Invoice to Google Drive"</strong> feature powered by Google Identity Services (GIS).
            </p>
            <div className="bg-[#FAF7F2] border border-[#E8E5DF] p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#1B4332]">
                <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                <span>Restricted Drive Scope: https://www.googleapis.com/auth/drive.file</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>Created Files Only:</strong> Under this restricted scope, the application can ONLY access and create files that Khatu Shri itself generates. It has <em>zero technical ability to read, view, or modify your photos, personal spreadsheets, or existing Google Drive files</em>.</li>
                <li><strong>In-Memory Token Lifecycle:</strong> OAuth access tokens are stored strictly in browser volatile memory (never saved to localStorage or server databases) and automatically discarded when you close the tab.</li>
                <li><strong>Destination Folder:</strong> Invoices are uploaded exclusively to an app-created folder named <code>"Khatu Shri Invoices"</code> in your own personal Drive for your tax and accounting convenience.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Cookies & Local Storage */}
          <section className="bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-2xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#1B4332] flex items-center gap-2">
              <Cookie className="w-5 h-5 text-[#D97706]" />
              <span>3. Cookies &amp; Local Storage Usage</span>
            </h2>
            <p>
              We use lightweight browser local storage solely to deliver essential e-commerce capabilities:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#1C1917]">
              <li>Maintaining your shopping bag across page reloads.</li>
              <li>Preserving your selected Bhopal delivery locality (e.g. Arera Colony, MP Nagar).</li>
              <li>Bookmarking saved wishlist items.</li>
            </ul>
            <p>
              We do not utilize invasive third-party cross-site ad-tracking cookies.
            </p>
          </section>

          {/* Section 4: Data Rights & Contact */}
          <section className="bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-2xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#1B4332] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#1B4332]" />
              <span>4. Your Data Rights &amp; Deletion</span>
            </h2>
            <p>
              Under Indian Digital Personal Data Protection standards, you have the right to request a complete export or permanent deletion of your customer profile and address records. To request data purging, email our Data Protection Officer at <strong>privacy@khatushri.in</strong>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};
