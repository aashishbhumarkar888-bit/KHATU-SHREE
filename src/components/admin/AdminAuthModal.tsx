import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Layers,
  ChevronRight,
  Activity,
  ExternalLink,
  RefreshCw,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isUserAdmin, ADMIN_EMAILS } from '../../config/adminConfig';
import { useToastNotification } from '../../context/ToastNotificationContext';
import { checkFirebaseHealth, FirebaseHealthReport, isFirebaseInitialized } from '../../lib/firebase';

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
  const { user, signInWithGoogle, signInWithEmail, signInAsDemoUser, signOut } = useAuth();
  const { showCustomToast } = useToastNotification();

  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [justAuthenticated, setJustAuthenticated] = useState(false);

  // CapsLock state tracking
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  // Firebase health diagnostic state
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<FirebaseHealthReport | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = isUserAdmin(user?.email);

  // Track CapsLock state globally while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyModifier = (e: KeyboardEvent) => {
      if (typeof e.getModifierState === 'function') {
        setIsCapsLockOn(e.getModifierState('CapsLock'));
      }
    };

    window.addEventListener('keydown', handleKeyModifier);
    window.addEventListener('keyup', handleKeyModifier);
    return () => {
      window.removeEventListener('keydown', handleKeyModifier);
      window.removeEventListener('keyup', handleKeyModifier);
    };
  }, [isOpen]);

  // Focus input when modal opens in email mode
  useEffect(() => {
    if (isOpen) {
      setAuthError(null);
      setJustAuthenticated(false);
      if (authMode === 'email') {
        setTimeout(() => emailInputRef.current?.focus(), 200);
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

  const runDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    try {
      const report = await checkFirebaseHealth();
      setDiagnosticReport(report);
      setShowDiagnostics(true);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

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
        }, 900);
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
        }, 900);
      } else {
        setAuthError(`Email "${emailInput.trim()}" is not on the administrator allowlist.`);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Invalid administrator credentials. Please check password or use 1-Click Admin Login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstantBypass = async () => {
    setIsSubmitting(true);
    try {
      await signInAsDemoUser('admin');
      setJustAuthenticated(true);
      showCustomToast({
        orderId: 'ADMIN-AUTH',
        newStatus: 'delivered',
        title: 'Admin Access Granted',
        message: 'Welcome Aashish! Redirecting to Central Console...',
        duration: 3500,
      });
      setTimeout(() => {
        onClose();
        onNavigateToAdmin();
      }, 700);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop with motion fade */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#07130C]/80 backdrop-blur-md"
          />

          {/* Modal Dialog Card with spring physics */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-lg bg-[#FAF7F2] border border-[#2D6A4F]/40 text-[#1C1917] rounded-3xl shadow-[0_25px_70px_rgba(7,19,12,0.65)] overflow-hidden z-10 my-auto"
          >
            {/* Top Illuminated Keycap Banner */}
            <div className="relative bg-[#0F281E] border-b border-[#2D6A4F] px-6 py-5 text-white overflow-hidden">
              {/* Ambient Gold Radial Glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#D97706]/20 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-[#1B4332]/40 blur-xl pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#DDA15E] to-transparent animate-pulse" />

              <div className="flex items-center justify-between relative z-10 gap-3">
                <div className="flex items-center gap-3">
                  <motion.div 
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="w-11 h-11 rounded-2xl bg-[#1B4332] border border-[#D97706]/60 flex items-center justify-center text-[#DDA15E] shadow-inner shrink-0"
                  >
                    {isAdmin || justAuthenticated ? (
                      <ShieldCheck className="w-6 h-6 text-[#34D399]" />
                    ) : (
                      <Lock className="w-5 h-5 text-[#D97706]" />
                    )}
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
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

                {/* Keyboard Shortcut Visualizer Badge with CapsLock Live Tracker */}
                <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 bg-[#07130C]/80 border border-[#2D6A4F] px-2.5 py-1 rounded-xl shadow-xs">
                    <kbd className="px-1.5 py-0.5 bg-[#1B4332] text-[#DDA15E] rounded text-[10px] font-mono font-bold border-b border-black/40">
                      Ctrl
                    </kbd>
                    <span className="text-[10px] text-white/50">+</span>
                    <kbd className="px-1.5 py-0.5 bg-[#1B4332] text-[#DDA15E] rounded text-[10px] font-mono font-bold border-b border-black/40">
                      Shift
                    </kbd>
                    <span className="text-[10px] text-white/50">+</span>
                    <kbd className="px-1.5 py-0.5 bg-[#D97706] text-white rounded text-[10px] font-mono font-bold border-b border-[#92400E]">
                      A
                    </kbd>
                  </div>

                  {/* CapsLock Indicator Badge */}
                  {isCapsLockOn && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#D97706]/20 text-[#FDE68A] border border-[#D97706]/50 rounded-md text-[9px] font-mono font-bold"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-ping" />
                      <span>CAPS LOCK ON</span>
                    </motion.div>
                  )}
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
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-5 text-[#065F46] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-[#34D399]/10 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-11 h-11 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-md">
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
                      You have full privileged access over live order dispatches, catalog inventory, customer ledgers, and COD cash reconciliation.
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onClose();
                        onNavigateToAdmin();
                      }}
                      className="w-full py-3.5 px-4 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
                    >
                      <span>Launch Central Operations Console</span>
                      <ArrowRight className="w-4 h-4 text-[#DDA15E] group-hover:translate-x-1 transition-transform" />
                    </motion.button>

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
                </motion.div>
              ) : user && !isAdmin ? (
                /* STATE 2: Logged in, but NOT an admin */
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl p-4 text-xs text-[#991B1B] space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                      <span>Administrative Access Denied</span>
                    </div>
                    <p className="leading-relaxed">
                      You are signed in with <strong>{user.email}</strong>, which is not registered on the administrative allowlist.
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
                </motion.div>
              ) : (
                /* STATE 3: Prompt for Login */
                <div className="space-y-4">
                  {/* Error Banner with shake animation */}
                  <AnimatePresence>
                    {authError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0, 
                          scale: 1,
                          x: [0, -6, 6, -4, 4, 0]
                        }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.3 }}
                        className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs rounded-xl flex items-start gap-2.5"
                      >
                        <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                        <div className="flex-1 text-[11px] leading-relaxed">
                          <span>{authError}</span>
                          {authError.includes('Firebase') && (
                            <button
                              type="button"
                              onClick={runDiagnostic}
                              className="mt-1.5 block font-bold text-[#B91C1C] underline hover:text-[#7F1D1D] cursor-pointer"
                            >
                              Run Firebase Connection Diagnostic →
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Mode Toggle Switcher with smooth sliding layout indicator */}
                  <div className="relative grid grid-cols-2 p-1 bg-[#E8E5DF]/70 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setAuthMode('google')}
                      className={`relative z-10 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        authMode === 'google'
                          ? 'text-[#1B4332] font-bold'
                          : 'text-[#78716C] hover:text-[#1C1917]'
                      }`}
                    >
                      {authMode === 'google' && (
                        <motion.div
                          layoutId="activeAdminTab"
                          className="absolute inset-0 bg-white rounded-lg shadow-2xs z-[-1]"
                          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        />
                      )}
                      <div className="w-3.5 h-3.5 rounded-full bg-[#1B4332] text-white text-[8px] flex items-center justify-center font-bold">
                        G
                      </div>
                      <span>Google Admin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('email')}
                      className={`relative z-10 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        authMode === 'email'
                          ? 'text-[#1B4332] font-bold'
                          : 'text-[#78716C] hover:text-[#1C1917]'
                      }`}
                    >
                      {authMode === 'email' && (
                        <motion.div
                          layoutId="activeAdminTab"
                          className="absolute inset-0 bg-white rounded-lg shadow-2xs z-[-1]"
                          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        />
                      )}
                      <Key className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Staff Credentials</span>
                    </button>
                  </div>

                  {authMode === 'google' ? (
                    <motion.div 
                      key="google-mode"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3 pt-1"
                    >
                      <p className="text-xs text-[#78716C] text-center leading-relaxed">
                        Sign in with your authorized Google workspace email to bypass manual passwords.
                      </p>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleGoogleLogin}
                        disabled={isSubmitting}
                        className="w-full py-3.5 px-4 bg-white hover:bg-[#FAF7F2] border border-[#D5CFBE] hover:border-[#1B4332] rounded-xl text-xs font-bold text-[#1C1917] shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 group"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        <span>{isSubmitting ? 'Authenticating...' : 'Sign in with Google Admin'}</span>
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.form 
                      key="email-mode"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleEmailLogin} 
                      className="space-y-3 pt-1"
                    >
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
                          className="w-full p-2.5 bg-white border border-[#D5CFBE] rounded-xl text-xs text-[#1C1917] focus:outline-none focus:border-[#1B4332] shadow-2xs transition-colors"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-[#57534E]">
                            Console Password
                          </label>
                          {isCapsLockOn && (
                            <span className="text-[10px] text-[#D97706] font-bold inline-flex items-center gap-1 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
                              CAPS LOCK ON
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••••••"
                            value={passInput}
                            onChange={(e) => setPassInput(e.target.value)}
                            className="w-full p-2.5 pr-9 bg-white border border-[#D5CFBE] rounded-xl text-xs text-[#1C1917] focus:outline-none focus:border-[#1B4332] shadow-2xs transition-colors"
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

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        <span>{isSubmitting ? 'Verifying Credentials...' : 'Authenticate to Console'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#DDA15E]" />
                      </motion.button>
                    </motion.form>
                  )}

                  {/* Direct 1-Click Instant Admin Access */}
                  <div className="pt-2">
                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleInstantBypass}
                      className="w-full py-3 px-3.5 bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FFFBEB] hover:from-[#FEF3C7] hover:to-[#FDE68A] border border-[#FDE68A] hover:border-[#D97706] text-[#92400E] rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      <Sparkles className="w-4 h-4 text-[#D97706] shrink-0 animate-pulse" />
                      <span>1-Click Verified Admin Access (aashishbhumarkar888@gmail.com)</span>
                    </motion.button>
                  </div>

                  {/* Firebase Live Diagnostics Drawer */}
                  <div className="pt-2">
                    <div className="bg-[#F3EFE6] border border-[#E3DCBF] rounded-xl p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-[#1B4332]" />
                          <span className="font-bold text-[#1C1917] text-[11px]">Firebase Cloud Connection</span>
                        </div>
                        <button
                          type="button"
                          onClick={runDiagnostic}
                          disabled={isRunningDiagnostic}
                          className="text-[10px] font-bold text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRunningDiagnostic ? 'animate-spin' : ''}`} />
                          <span>{isRunningDiagnostic ? 'Checking...' : 'Check Status'}</span>
                        </button>
                      </div>

                      {diagnosticReport ? (
                        <div className="space-y-1.5 pt-1 text-[11px] border-t border-[#E3DCBF]">
                          <div className="flex items-center justify-between text-[#57534E]">
                            <span>Project:</span>
                            <span className="font-mono font-bold text-[#1B4332]">{diagnosticReport.projectId}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#57534E]">Authentication:</span>
                            <span className={`font-semibold ${diagnosticReport.authConfigured ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                              {diagnosticReport.authConfigured ? 'Operational' : 'Needs Activation in Console'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#57534E]">Cloud Firestore:</span>
                            <span className={`font-semibold ${diagnosticReport.firestoreConfigured ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                              {diagnosticReport.firestoreConfigured ? 'Operational' : 'API Disabled / Not Created'}
                            </span>
                          </div>

                          {diagnosticReport.instructions.length > 0 && (
                            <div className="mt-2 p-2 bg-white rounded-lg border border-[#D5CFBE] text-[10px] space-y-1 text-[#78716C]">
                              <span className="font-bold text-[#1C1917] block">To enable Firebase in your Google project:</span>
                              <ol className="list-decimal pl-3 space-y-0.5">
                                {diagnosticReport.instructions.map((inst, idx) => (
                                  <li key={idx}>{inst}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#78716C] leading-snug">
                          Project: <span className="font-mono font-semibold text-[#1C1917]">khatu-38e39</span>. If Firebase Auth is pending console activation, 1-Click login uses resilient local admin authorization.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Allowlist Footer Note */}
                  <div className="pt-2 border-t border-[#E8E5DF] text-center">
                    <span className="text-[11px] text-[#78716C]">
                      Configured administrator: <strong className="text-[#1B4332]">aashishbhumarkar888@gmail.com</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
