import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Sparkles, 
  Key, 
  Eye, 
  EyeOff, 
  LogOut,
  Command,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isUserAdmin, ADMIN_EMAILS } from '../../config/adminConfig';
import { useToastNotification } from '../../context/ToastNotificationContext';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAdmin: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onNavigateToAdmin,
}) => {
  const { user, signInWithGoogle, signInWithEmail, signOut } = useAuth();
  const { showCustomToast } = useToastNotification();

  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [justAuthenticated, setJustAuthenticated] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = isUserAdmin(user?.email);

  // Focus input when modal opens in email mode
  useEffect(() => {
    if (isOpen) {
      setAuthError(null);
      setJustAuthenticated(false);
      if (authMode === 'email') {
        setTimeout(() => emailInputRef.current?.focus(), 150);
      }
    }
  }, [isOpen, authMode]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      const signedInUser = await signInWithGoogle();
      if (signedInUser && isUserAdmin(signedInUser.email)) {
        setJustAuthenticated(true);
        showCustomToast({
          orderId: 'ADMIN-AUTH',
          newStatus: 'delivered',
          title: 'Admin Access Granted',
          message: `Welcome back, ${signedInUser.displayName || signedInUser.email}! Redirecting to Central Console...`,
          duration: 3500,
        });
        setTimeout(() => {
          onClose();
          onNavigateToAdmin();
        }, 800);
      } else if (signedInUser) {
        setAuthError(`Account "${signedInUser.email}" is not authorized for administrative access.`);
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setAuthError(err?.message || 'Google administrator sign-in failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passInput) return;

    setAuthError(null);
    setIsSubmitting(true);
    try {
      await signInWithEmail(emailInput.trim(), passInput);
      if (isUserAdmin(emailInput.trim())) {
        setJustAuthenticated(true);
        showCustomToast({
          orderId: 'ADMIN-AUTH',
          newStatus: 'delivered',
          title: 'Admin Access Granted',
          message: `Welcome back, ${emailInput.trim()}! Redirecting to Central Console...`,
          duration: 3500,
        });
        setTimeout(() => {
          onClose();
          onNavigateToAdmin();
        }, 800);
      } else {
        setAuthError(`Email "${emailInput.trim()}" is not on the administrator allowlist.`);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Invalid administrator credentials. Please check password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      {/* Backdrop with ambient blur and subtle dark green gradient */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-[#0A1810]/75 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-[#FAF7F2] border border-[#2D6A4F]/40 text-[#1C1917] rounded-3xl shadow-[0_25px_60px_rgba(10,24,16,0.5)] overflow-hidden z-10 transition-all duration-300 animate-in zoom-in-95 fade-in ease-out">
        
        {/* Top Illuminated Keycap Banner */}
        <div className="relative bg-[#142D22] border-b border-[#2D6A4F] px-6 py-5 text-white overflow-hidden">
          {/* Ambient Gold Radial Glow */}
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#D97706]/15 blur-2xl pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#DDA15E]/60 to-transparent" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1B4332] border border-[#D97706]/50 flex items-center justify-center text-[#DDA15E] shadow-inner">
                {isAdmin || justAuthenticated ? (
                  <ShieldCheck className="w-5 h-5 text-[#34D399]" />
                ) : (
                  <Lock className="w-5 h-5 text-[#D97706]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold tracking-tight text-white">
                    Central Admin Console
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D97706]/20 text-[#FDE68A] border border-[#D97706]/40 font-semibold">
                    Restricted
                  </span>
                </div>
                <p className="text-[11px] text-[#A8A29E] mt-0.5">
                  Bhopal Gaushala &amp; Pan-India Dispatch Operations
                </p>
              </div>
            </div>

            {/* Shortcut Keys Badge */}
            <div className="flex items-center gap-1.5 bg-[#0A1810]/70 border border-[#2D6A4F] px-2.5 py-1 rounded-xl shadow-xs">
              <kbd className="px-1.5 py-0.5 bg-[#1B4332] text-[#DDA15E] rounded text-[10px] font-mono font-bold shadow-2xs">
                Ctrl
              </kbd>
              <span className="text-[10px] text-white/50">+</span>
              <kbd className="px-1.5 py-0.5 bg-[#1B4332] text-[#DDA15E] rounded text-[10px] font-mono font-bold shadow-2xs">
                Shift
              </kbd>
              <span className="text-[10px] text-white/50">+</span>
              <kbd className="px-1.5 py-0.5 bg-[#D97706] text-white rounded text-[10px] font-mono font-bold shadow-2xs">
                A
              </kbd>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Close admin login (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* STATE 1: Already Authenticated as Admin */}
          {isAdmin || justAuthenticated ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-4 sm:p-5 text-[#065F46]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#065F46] truncate">
                        {user?.displayName || 'Authorized Administrator'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#D1FAE5] text-[#047857] px-2 py-0.5 rounded-full border border-[#6EE7B7]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-[#047857] truncate mt-0.5 font-mono">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#047857] mt-3 pt-3 border-t border-[#A7F3D0]/60 leading-relaxed">
                  You have full read/write privileges over live order dispatches, catalog inventory, and daily COD cash reconciliation.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToAdmin();
                  }}
                  className="w-full py-3.5 px-4 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Launch Central Operations Console</span>
                  <ArrowRight className="w-4 h-4 text-[#DDA15E] group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    onClick={() => {
                      signOut();
                      setJustAuthenticated(false);
                    }}
                    className="text-[#78716C] hover:text-[#DC2626] font-medium transition-colors flex items-center gap-1.5 cursor-pointer py-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out of Admin Session</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="text-[#78716C] hover:text-[#1B4332] font-semibold transition-colors cursor-pointer py-1"
                  >
                    Return to Marketplace
                  </button>
                </div>
              </div>
            </div>
          ) : user && !isAdmin ? (
            /* STATE 2: Logged in, but NOT an admin */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl p-4 text-xs text-[#991B1B] space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                  <span>Administrative Access Denied</span>
                </div>
                <p className="leading-relaxed">
                  You are currently signed in with <strong>{user.email}</strong>, which does not belong to the authorized administrative allowlist.
                </p>
                <div className="pt-2 text-[11px] text-[#7F1D1D] border-t border-[#FCA5A5]/60">
                  <span className="font-semibold block mb-0.5">Permitted Administrator Accounts:</span>
                  <span className="font-mono">{ADMIN_EMAILS.join(', ')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => signOut()}
                  className="w-full py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out &amp; Use Administrator Credentials</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2 bg-white border border-[#E8E5DF] text-[#78716C] hover:text-[#1C1917] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* STATE 3: Prompt for Login */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Error Banner */}
              {authError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs rounded-xl flex items-start gap-2 animate-in shake">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  <span className="leading-tight">{authError}</span>
                </div>
              )}

              {/* Mode Toggle Switcher */}
              <div className="grid grid-cols-2 p-1 bg-[#E8E5DF]/60 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAuthMode('google')}
                  className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMode === 'google'
                      ? 'bg-white text-[#1B4332] shadow-2xs font-bold'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-[#1B4332] text-white text-[8px] flex items-center justify-center font-bold">
                    G
                  </div>
                  <span>Google Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('email')}
                  className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMode === 'email'
                      ? 'bg-white text-[#1B4332] shadow-2xs font-bold'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Staff Credentials</span>
                </button>
              </div>

              {authMode === 'google' ? (
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-[#78716C] text-center leading-relaxed">
                    Sign in with your authorized Google workspace email address to bypass manual passwords.
                  </p>

                  <button
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 bg-white hover:bg-[#FAF7F2] border border-[#D5CFBE] hover:border-[#1B4332] rounded-xl text-xs font-bold text-[#1C1917] shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 group"
                  >
                    {/* Official Google G SVG */}
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>{isSubmitting ? 'Authenticating...' : 'Sign in with Google Admin'}</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEmailLogin} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#57534E] mb-1">
                      Administrator Email
                    </label>
                    <input
                      ref={emailInputRef}
                      type="email"
                      required
                      placeholder="aashishbhumarkar888@gmail.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#D5CFBE] rounded-xl text-xs text-[#1C1917] focus:outline-none focus:border-[#1B4332] shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#57534E] mb-1">
                      Console Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={passInput}
                        onChange={(e) => setPassInput(e.target.value)}
                        className="w-full p-2.5 pr-9 bg-white border border-[#D5CFBE] rounded-xl text-xs text-[#1C1917] focus:outline-none focus:border-[#1B4332] shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span>{isSubmitting ? 'Verifying Credentials...' : 'Authenticate to Console'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#DDA15E]" />
                  </button>
                </form>
              )}

              {/* Allowlist Footer Note */}
              <div className="pt-3 border-t border-[#E8E5DF] text-center">
                <span className="text-[11px] text-[#78716C]">
                  Configured administrator emails: <strong className="text-[#1B4332]">aashishbhumarkar888@gmail.com</strong>
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
