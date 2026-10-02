import React from 'react';
import { CheckCircle2, Clock, Truck, Package, ShieldCheck, Thermometer } from 'lucide-react';
import { Order } from '../../types';

interface OrderStatusProgressBarProps {
  status: Order['status'];
  deliverySlot?: string;
  className?: string;
  showDetails?: boolean;
}

export const OrderStatusProgressBar: React.FC<OrderStatusProgressBarProps> = ({
  status,
  deliverySlot,
  className = '',
  showDetails = true,
}) => {
  // Mapping status to step index:
  // 0 = placed, 1 = processing, 2 = out_for_delivery, 3 = delivered
  const getStepIndex = (st: Order['status']) => {
    switch (st) {
      case 'placed': return 0;
      case 'processing': return 1;
      case 'out_for_delivery': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(status);

  // Dynamic color configuration based on state
  const getDynamicTheme = () => {
    switch (status) {
      case 'processing':
        return {
          name: 'Processing',
          barGradient: 'from-amber-400 via-amber-500 to-amber-600',
          barWidth: '38%',
          barGlow: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
          badgeDot: 'bg-amber-500',
          accentText: 'text-amber-700',
          containerBg: 'bg-amber-50/30 border-amber-200/70',
          activeNodeBg: 'bg-amber-500 text-white ring-4 ring-amber-400/30 shadow-sm',
          statusSummary: 'Lab-tested farm batch is sealed & chilled to 4°C at Sehore Gaushala Hub.',
          estimatedTag: 'Preparing for Dispatch'
        };
      case 'out_for_delivery':
        return {
          name: 'Out for Delivery',
          barGradient: 'from-amber-500 via-blue-500 to-blue-600',
          barWidth: '72%',
          barGlow: 'shadow-[0_0_14px_rgba(37,99,235,0.45)]',
          badgeBg: 'bg-blue-50 text-blue-800 border-blue-300',
          badgeDot: 'bg-blue-600',
          accentText: 'text-blue-700',
          containerBg: 'bg-blue-50/30 border-blue-200/70',
          activeNodeBg: 'bg-blue-600 text-white ring-4 ring-blue-500/30 shadow-md',
          statusSummary: 'On the road in Bhopal electric chilled van. Arriving within your chosen slot.',
          estimatedTag: 'On the Road in Bhopal'
        };
      case 'delivered':
        return {
          name: 'Delivered',
          barGradient: 'from-emerald-500 via-emerald-600 to-green-600',
          barWidth: '100%',
          barGlow: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          badgeDot: 'bg-emerald-600',
          accentText: 'text-emerald-700',
          containerBg: 'bg-emerald-50/25 border-emerald-200/70',
          activeNodeBg: 'bg-emerald-600 text-white ring-4 ring-emerald-500/25 shadow-sm',
          statusSummary: 'Package handed directly to resident. Verified clean insulated packaging.',
          estimatedTag: 'Successfully Delivered'
        };
      case 'placed':
      default:
        return {
          name: 'Order Placed',
          barGradient: 'from-[#1B4332] to-[#2D6A4F]',
          barWidth: '12%',
          barGlow: 'shadow-none',
          badgeBg: 'bg-stone-100 text-stone-700 border-stone-300',
          badgeDot: 'bg-[#1B4332]',
          accentText: 'text-[#1B4332]',
          containerBg: 'bg-stone-50/50 border-stone-200',
          activeNodeBg: 'bg-[#1B4332] text-white ring-4 ring-[#1B4332]/20',
          statusSummary: 'Order confirmed and registered for next morning fresh dairy milk harvesting.',
          estimatedTag: 'Order Confirmed'
        };
    }
  };

  const theme = getDynamicTheme();

  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 ${theme.containerBg} ${className}`}>
      
      {/* Top Status Header with Dynamic State Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${theme.badgeBg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${theme.badgeDot} ${status !== 'delivered' ? 'animate-ping' : ''}`} />
            <span>{theme.name}</span>
          </span>

          <span className="text-xs font-semibold text-[#57534E]">
            {theme.estimatedTag}
          </span>
        </div>

        {deliverySlot && (
          <span className="text-[11px] font-bold text-[#78716C] bg-white/80 border border-[#E8E5DF] px-2 py-0.5 rounded-md">
            Slot: {deliverySlot}
          </span>
        )}
      </div>

      {/* Dynamic Segmented Progress Bar */}
      <div className="relative mx-3 sm:mx-6 my-4">
        
        {/* Inactive Track */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-[#E8E5DF] rounded-full overflow-hidden" />
        
        {/* Dynamic Colored Active Fill Bar */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 left-0 h-2 bg-gradient-to-r rounded-full transition-all duration-700 ease-out ${theme.barGradient} ${theme.barGlow}`}
          style={{ width: theme.barWidth }}
        />

        {/* Checkpoint Nodes */}
        <div className="relative flex justify-between items-center">
          
          {/* NODE 1: ORDER PLACED */}
          <div className="flex flex-col items-center">
            <div 
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                currentStep >= 0 
                  ? currentStep === 0
                    ? theme.activeNodeBg
                    : 'bg-[#1B4332] text-white shadow-xs'
                  : 'bg-white border-2 border-[#E8E5DF] text-[#78716C]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* NODE 2: PROCESSING (Amber state) */}
          <div className="flex flex-col items-center">
            <div 
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                currentStep > 1 
                  ? 'bg-amber-600 text-white' 
                  : currentStep === 1
                    ? 'bg-amber-500 text-white ring-4 ring-amber-400/35 shadow-md animate-pulse'
                    : 'bg-white border-2 border-[#E8E5DF] text-[#78716C]'
              }`}
            >
              {currentStep > 1 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
          </div>

          {/* NODE 3: OUT FOR DELIVERY (Blue state) */}
          <div className="flex flex-col items-center">
            <div 
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                currentStep > 2 
                  ? 'bg-blue-600 text-white' 
                  : currentStep === 2
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/35 shadow-md animate-pulse'
                    : 'bg-white border-2 border-[#E8E5DF] text-[#78716C]'
              }`}
            >
              {currentStep > 2 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Truck className="w-4 h-4" />
              )}
            </div>
          </div>

          {/* NODE 4: DELIVERED (Emerald state) */}
          <div className="flex flex-col items-center">
            <div 
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                currentStep === 3 
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/30 shadow-md' 
                  : 'bg-white border-2 border-[#E8E5DF] text-[#78716C]'
              }`}
            >
              <Package className="w-4 h-4" />
            </div>
          </div>

        </div>
      </div>

      {/* Node Text Labels with Dynamic Active Colors */}
      <div className="grid grid-cols-4 text-center text-[10px] sm:text-xs pt-1">
        
        <div className="space-y-0.5">
          <span className={`font-bold block ${currentStep >= 0 ? 'text-[#1B4332]' : 'text-[#78716C]'}`}>
            Ordered
          </span>
          <span className="text-[10px] text-[#78716C] hidden sm:block">Farm Order Logged</span>
        </div>

        <div className="space-y-0.5">
          <span className={`font-bold block ${currentStep === 1 ? 'text-amber-700' : currentStep > 1 ? 'text-amber-800' : 'text-[#78716C]'}`}>
            Processing
          </span>
          <span className="text-[10px] text-[#78716C] hidden sm:block">Chilled to 4°C</span>
        </div>

        <div className="space-y-0.5">
          <span className={`font-bold block ${currentStep === 2 ? 'text-blue-700' : currentStep > 2 ? 'text-blue-800' : 'text-[#78716C]'}`}>
            Out for Delivery
          </span>
          <span className="text-[10px] text-[#78716C] hidden sm:block">Bhopal Van Dispatched</span>
        </div>

        <div className="space-y-0.5">
          <span className={`font-bold block ${currentStep === 3 ? 'text-emerald-700' : 'text-[#78716C]'}`}>
            Delivered
          </span>
          <span className="text-[10px] text-[#78716C] hidden sm:block">Verified at Doorstep</span>
        </div>

      </div>

      {/* Dynamic Summary Note */}
      {showDetails && (
        <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between text-xs text-[#57534E]">
          <span className="text-[11px] leading-tight">
            {theme.statusSummary}
          </span>

          {status === 'processing' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded shrink-0">
              <Thermometer className="w-3 h-3 text-amber-700" />
              <span>4.0°C Safe</span>
            </span>
          )}

          {status === 'out_for_delivery' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded shrink-0">
              <Truck className="w-3 h-3 text-blue-700" />
              <span>Live Transit</span>
            </span>
          )}

          {status === 'delivered' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded shrink-0">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>Verified Complete</span>
            </span>
          )}
        </div>
      )}

    </div>
  );
};
