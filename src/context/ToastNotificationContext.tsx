import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Truck, 
  Package, 
  X, 
  ExternalLink, 
  Download, 
  Sparkles,
  Volume2,
  VolumeX,
  Bell
} from 'lucide-react';
import { Order } from '../types';
import { downloadInvoiceReport } from '../utils/invoiceReport';

export interface ToastItem {
  id: string;
  orderId: string;
  previousStatus?: Order['status'];
  newStatus: Order['status'];
  title: string;
  message: string;
  itemsSummary?: string;
  order?: Order;
  timestamp: string;
  duration?: number;
  actionLink?: {
    label: string;
    url: string;
  };
}

interface ToastContextType {
  toasts: ToastItem[];
  notifyOrderStatusChange: (order: Order, previousStatus: Order['status'], newStatus: Order['status']) => void;
  showCustomToast: (toast: Omit<ToastItem, 'id' | 'timestamp'>) => void;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onOpenOrderInAccount?: (orderId: string) => void;
  registerOpenAccountHandler: (handler: (orderId: string) => void) => void;
  simulateDemoOrderUpdate: (order: Order) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Web Audio API soft notification chime (zero external dependencies)
const playNotificationChime = (status: Order['status']) => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    if (status === 'delivered') {
      // Triumphant 3-note chime
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.12); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.24); // G5
    } else if (status === 'out_for_delivery') {
      // Urgent energetic 2-note chime
      osc1.frequency.setValueAtTime(440, now); // A4
      osc1.frequency.setValueAtTime(587.33, now + 0.15); // D5
    } else {
      // Warm gentle 2-note chime
      osc1.frequency.setValueAtTime(392, now); // G4
      osc1.frequency.setValueAtTime(523.25, now + 0.15); // C5
    }

    osc1.type = 'sine';
    osc1.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.6);
  } catch {
    // Gracefully ignore audio autoplay policies if audio not yet allowed
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const openAccountHandlerRef = useRef<((orderId: string) => void) | null>(null);

  const registerOpenAccountHandler = useCallback((handler: (orderId: string) => void) => {
    openAccountHandlerRef.current = handler;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showCustomToast = useCallback((toastData: Omit<ToastItem, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastItem = {
      ...toastData,
      id,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 4));

    if (soundEnabled) {
      playNotificationChime(toastData.newStatus);
    }
  }, [soundEnabled]);

  const notifyOrderStatusChange = useCallback((
    order: Order, 
    previousStatus: Order['status'], 
    newStatus: Order['status']
  ) => {
    const itemsPreview = order.items.map(i => i.productName).slice(0, 2).join(', ') + 
      (order.items.length > 2 ? ` + ${order.items.length - 2} more` : '');

    let title = '';
    let message = '';

    switch (newStatus) {
      case 'processing':
        title = 'Order Now Preparing & Chilling';
        message = `Your fresh dairy batch (${itemsPreview}) has passed 0% adulteration tests and is chilled to 4°C at Sehore Gaushala Hub.`;
        break;
      case 'out_for_delivery':
        title = 'Package is Out for Delivery! 🚚';
        message = `Dispatched in Bhopal refrigerated electric van. Expected arrival during slot: ${order.deliverySlot}.`;
        break;
      case 'delivered':
        title = 'Package Successfully Delivered! 🎉';
        message = `Handed directly to resident at ${order.shippingAddress.bhopalArea}. Cold-chain purity verified.`;
        break;
      case 'placed':
      default:
        title = 'Order Confirmed at Gaushala';
        message = `Your farm fresh order (${itemsPreview}) is registered for upcoming morning dispatch.`;
        break;
    }

    showCustomToast({
      orderId: order.id,
      previousStatus,
      newStatus,
      title,
      message,
      itemsSummary: itemsPreview,
      order,
      duration: 7000
    });
  }, [showCustomToast]);

  const simulateDemoOrderUpdate = useCallback((order: Order) => {
    let nextStatus: Order['status'] = 'processing';
    if (order.status === 'placed') nextStatus = 'processing';
    else if (order.status === 'processing') nextStatus = 'out_for_delivery';
    else if (order.status === 'out_for_delivery') nextStatus = 'delivered';
    else nextStatus = 'processing';

    notifyOrderStatusChange(order, order.status, nextStatus);
  }, [notifyOrderStatusChange]);

  const onOpenOrderInAccount = (orderId: string) => {
    if (openAccountHandlerRef.current) {
      openAccountHandlerRef.current(orderId);
    }
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        notifyOrderStatusChange,
        showCustomToast,
        dismissToast,
        clearAllToasts,
        soundEnabled,
        setSoundEnabled,
        onOpenOrderInAccount,
        registerOpenAccountHandler,
        simulateDemoOrderUpdate
      }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export const useToastNotification = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastNotification must be used within a ToastProvider');
  }
  return context;
};

// ============================================================================
// TOAST CONTAINER & FLOATING CARDS
// ============================================================================

const ToastContainer: React.FC = () => {
  const { toasts, dismissToast, onOpenOrderInAccount, soundEnabled, setSoundEnabled } = useToastNotification();

  if (toasts.length === 0) return null;

  return (
    <div 
      aria-live="assertive" 
      className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-70 flex flex-col gap-3 max-w-[94vw] sm:max-w-md w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onDismiss={() => dismissToast(toast.id)}
          onOpenAccount={() => onOpenOrderInAccount && onOpenOrderInAccount(toast.orderId)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
        />
      ))}
    </div>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
  onOpenAccount: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({
  toast,
  onDismiss,
  onOpenAccount,
  soundEnabled,
  onToggleSound
}) => {
  const [isPaused, setIsPaused] = React.useState(false);

  // Auto-dismiss countdown timer
  React.useEffect(() => {
    if (isPaused) return;
    const duration = toast.duration || 7000;
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss, isPaused]);

  // Color config based on status
  const getConfig = () => {
    switch (toast.newStatus) {
      case 'processing':
        return {
          icon: <Clock className="w-5 h-5 text-amber-600 animate-spin-slow" />,
          borderColor: 'border-amber-400',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
          badgeText: 'Processing · Chilling 4°C',
          headerBg: 'bg-gradient-to-r from-amber-50 to-orange-50',
          accentColor: 'text-amber-700',
          barGradient: 'from-amber-400 to-amber-600',
          shadow: 'shadow-[0_10px_35px_rgba(245,158,11,0.28)]',
        };
      case 'out_for_delivery':
        return {
          icon: <Truck className="w-5 h-5 text-blue-600 animate-bounce" />,
          borderColor: 'border-blue-400',
          badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
          badgeText: 'Out for Delivery · Live Transit',
          headerBg: 'bg-gradient-to-r from-blue-50 to-sky-50',
          accentColor: 'text-blue-700',
          barGradient: 'from-blue-500 to-indigo-600',
          shadow: 'shadow-[0_10px_35px_rgba(37,99,235,0.28)]',
        };
      case 'delivered':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          borderColor: 'border-emerald-400',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          badgeText: 'Delivered at Doorstep',
          headerBg: 'bg-gradient-to-r from-emerald-50 to-green-50',
          accentColor: 'text-emerald-700',
          barGradient: 'from-emerald-500 to-green-600',
          shadow: 'shadow-[0_10px_35px_rgba(16,185,129,0.28)]',
        };
      case 'placed':
      default:
        return {
          icon: <Package className="w-5 h-5 text-[#1B4332]" />,
          borderColor: 'border-[#1B4332]',
          badgeBg: 'bg-[#1B4332]/10 text-[#1B4332] border-[#1B4332]/30',
          badgeText: 'Order Placed & Registered',
          headerBg: 'bg-[#FBF9F5]',
          accentColor: 'text-[#1B4332]',
          barGradient: 'from-[#1B4332] to-[#2D6A4F]',
          shadow: 'shadow-[0_10px_35px_rgba(27,67,50,0.2)]',
        };
    }
  };

  const config = getConfig();

  const handleDownloadInvoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toast.order) {
      downloadInvoiceReport(toast.order);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto bg-white rounded-2xl border-2 ${config.borderColor} ${config.shadow} overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in text-[#1C1917]`}
    >
      {/* Top Banner with Alert Icon & Order Number */}
      <div className={`p-3 sm:p-3.5 ${config.headerBg} border-b border-black/5 flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white rounded-xl shadow-xs shrink-0">
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badgeBg} uppercase tracking-wider`}>
                {config.badgeText}
              </span>
              <span className="text-[10px] font-mono text-[#78716C]">
                #{toast.orderId.slice(-8).toUpperCase()}
              </span>
            </div>
            <span className="text-[10px] text-[#78716C] block mt-0.5 font-medium">
              Real-time Dairy Order Alert · {toast.timestamp}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleSound}
            className="p-1 text-[#78716C] hover:text-[#1C1917] transition-colors rounded cursor-pointer"
            title={soundEnabled ? 'Mute notification chimes' : 'Unmute notification chimes'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#1B4332]" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onDismiss}
            className="p-1 text-[#78716C] hover:text-[#1C1917] transition-colors rounded hover:bg-black/5 cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-3.5 sm:p-4 space-y-2.5">
        <div>
          <h4 className={`font-serif text-sm font-bold ${config.accentColor}`}>
            {toast.title}
          </h4>
          <p className="text-xs text-[#57534E] leading-relaxed mt-1">
            {toast.message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-black/5 flex flex-wrap items-center justify-between gap-2">
          {toast.actionLink ? (
            <a
              href={toast.actionLink.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onDismiss}
              className="px-3 py-1.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>{toast.actionLink.label}</span>
              <ExternalLink className="w-3 h-3 text-[#DDA15E]" />
            </a>
          ) : (
            <button
              onClick={() => {
                onOpenAccount();
                onDismiss();
              }}
              className="px-3 py-1.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Track in Account</span>
              <ExternalLink className="w-3 h-3 text-[#D97706]" />
            </button>
          )}

          {toast.order && (
            <button
              onClick={handleDownloadInvoice}
              className="px-2.5 py-1.5 border border-[#E8E5DF] hover:border-[#1B4332] text-[#1B4332] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 hover:bg-[#1B4332]/5 cursor-pointer"
              title="Download purchase details report as plain text"
            >
              <Download className="w-3 h-3 text-[#B45309]" />
              <span>Invoice (.txt)</span>
            </button>
          )}
        </div>
      </div>

      {/* Auto-dismiss Animated Progress Bar */}
      <div className="h-1 w-full bg-[#E8E5DF] overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${config.barGradient} transition-all`}
          style={{
            animation: `toast-progress ${toast.duration || 7000}ms linear forwards`,
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        />
      </div>
    </div>
  );
};
