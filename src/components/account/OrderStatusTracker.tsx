import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Truck, 
  Package, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  RotateCw, 
  MapPin, 
  Phone, 
  AlertCircle,
  Thermometer,
  ShieldCheck,
  Calendar,
  XCircle,
  MessageSquare,
  Sparkles,
  Download,
  Award,
  UploadCloud,
  HardDrive,
  ExternalLink
} from 'lucide-react';
import { Order, TrackingEvent } from '../../types';
import { OrderStatusProgressBar } from './OrderStatusProgressBar';
import { downloadInvoiceReport } from '../../utils/invoiceReport';
import { useAuth } from '../../context/AuthContext';
import { useToastNotification } from '../../context/ToastNotificationContext';
import { uploadInvoiceToDrive } from '../../services/googleDrive';

interface OrderStatusTrackerProps {
  order: Order;
  onUpdateStatus?: (orderId: string, newStatus: 'placed' | 'processing' | 'out_for_delivery' | 'delivered') => void;
  onReorder?: (order: Order) => void;
  onViewInvoice?: (order: Order) => void;
  onCancelOrder?: (orderId: string) => void;
  onSaveInstructions?: (orderId: string, instructions: string) => void;
  onSelectProduct?: (productName: string) => void;
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  order,
  onUpdateStatus,
  onReorder,
  onViewInvoice,
  onCancelOrder,
  onSaveInstructions,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInstructionsEdit, setShowInstructionsEdit] = useState(false);
  const [instructionText, setInstructionText] = useState(order.deliveryInstructions || '');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [savedDriveLink, setSavedDriveLink] = useState<string | null>(null);

  const { driveAccessToken, connectGoogleDrive } = useAuth();
  const { showCustomToast } = useToastNotification();

  const handleDownloadReport = () => {
    downloadInvoiceReport(order);
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 3000);
  };

  const handleSaveToDrive = async () => {
    setIsSavingToDrive(true);
    try {
      let token = driveAccessToken;
      if (!token) {
        token = await connectGoogleDrive();
      }
      if (!token) return;

      const uploaded = await uploadInvoiceToDrive(order, token);
      const driveViewUrl = uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`;
      setSavedDriveLink(driveViewUrl);

      showCustomToast({
        orderId: order.id,
        newStatus: 'delivered',
        title: 'Invoice Backed Up to Drive',
        message: `Saved ${uploaded.name} to "Khatu Shri Invoices" folder.`,
        actionLink: {
          label: 'Open in Drive',
          url: driveViewUrl,
        },
        duration: 7000,
      });
    } catch (err: any) {
      if (err?.code === 'popup_closed_by_user' || err?.message?.includes('closed') || err?.message?.includes('cancelled')) {
        showCustomToast({
          orderId: order.id,
          newStatus: 'processing',
          title: 'Google Drive Cancelled',
          message: 'Google Drive authorization window was closed. Invoice was not backed up.',
          duration: 4000,
        });
      } else {
        showCustomToast({
          orderId: order.id,
          newStatus: 'processing',
          title: 'Drive Backup Notice',
          message: err?.message || 'Could not back up to Google Drive.',
          duration: 4000,
        });
      }
    } finally {
      setIsSavingToDrive(false);
    }
  };

  // Status index mapping:
  // 0: Placed, 1: Processing, 2: Out for Delivery, 3: Delivered
  const getStatusIndex = (st: Order['status']) => {
    switch (st) {
      case 'placed': return 0;
      case 'processing': return 1;
      case 'out_for_delivery': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStatusIndex(order.status);

  // Determine progress bar fill percentage
  const getProgressPercentage = () => {
    switch (order.status) {
      case 'placed': return '12%';
      case 'processing': return '38%';
      case 'out_for_delivery': return '72%';
      case 'delivered': return '100%';
      default: return '12%';
    }
  };

  // Amazon-style status headlines
  const getStatusHeadline = () => {
    switch (order.status) {
      case 'delivered':
        return {
          title: 'Delivered',
          subtitle: 'Package was handed directly to resident at Bhopal address.',
          color: 'text-emerald-700',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200'
        };
      case 'out_for_delivery':
        return {
          title: 'Arriving Today',
          subtitle: `Expected in ${order.deliverySlot} with our refrigerated local delivery associate.`,
          color: 'text-[#1B4332]',
          badgeBg: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
        };
      case 'processing':
        return {
          title: 'Preparing & Chilling',
          subtitle: 'Dairy batch quality test passed (0% adulteration). Chilling to 4°C at Sehore Gaushala.',
          color: 'text-amber-700',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200'
        };
      case 'placed':
      default:
        return {
          title: 'Order Confirmed',
          subtitle: 'Your order has been scheduled for upcoming fresh morning harvest.',
          color: 'text-[#57534E]',
          badgeBg: 'bg-[#FBF9F5] text-[#57534E] border-[#E8E5DF]'
        };
    }
  };

  const headline = getStatusHeadline();

  // Synthetic tracking timeline checkpoints based on order data
  const defaultEvents: TrackingEvent[] = [
    {
      timestamp: 'Today, 7:15 AM',
      status: 'delivered',
      title: 'Delivered to Doorstep',
      location: `${order.shippingAddress.bhopalArea}, Bhopal`,
      details: 'Handed directly to resident. Verified clean insulated packaging.'
    },
    {
      timestamp: 'Today, 6:05 AM',
      status: 'out_for_delivery',
      title: 'Out for Delivery in Bhopal',
      location: 'Khatu Shri Bhopal Hub (MP Nagar Zone 1)',
      details: 'Dispatched with refrigerated electric van. Associate Rajesh Verma (+91 98260 77123).'
    },
    {
      timestamp: 'Today, 4:45 AM',
      status: 'processing',
      title: 'Chilled Batch Sealed & Quality Checked',
      location: 'Native Gir Gaushala, Sehore MP',
      details: 'Fresh milking complete. Fat content 4.8%, SNF 8.9%. Packed in sanitized glass containers.'
    },
    {
      timestamp: new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'placed',
      title: 'Order Confirmed',
      location: 'Online Store, Bhopal MP',
      details: `Payment received via ${order.paymentMethod}. Scheduled for ${order.deliverySlot}.`
    }
  ];

  // Filter visible events based on current status
  const visibleEvents = defaultEvents.filter(ev => getStatusIndex(ev.status) <= currentIndex);

  const handleStatusChange = (newStatus: 'placed' | 'processing' | 'out_for_delivery' | 'delivered') => {
    setIsSimulating(true);
    if (onUpdateStatus) {
      onUpdateStatus(order.id, newStatus);
    }
    setTimeout(() => setIsSimulating(false), 300);
  };

  const handleSaveInstructionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveInstructions) {
      onSaveInstructions(order.id, instructionText);
    }
    setShowInstructionsEdit(false);
  };

  return (
    <div className="bg-white border border-[#E8E5DF] hover:border-[#1B4332]/40 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all text-[#1C1917]">
      
      {/* Amazon-style Order Header Bar */}
      <div className="p-4 bg-[#FBF9F5] border-b border-[#E8E5DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#78716C] tracking-wider block">
              Order Placed
            </span>
            <span className="font-medium text-[#1C1917]">
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#78716C] tracking-wider block">
              Total Amount
            </span>
            <span className="font-bold text-[#1B4332] tabular-nums">
              ₹{order.total.toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#78716C] tracking-wider block">
              Points Earned
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-[#B45309] bg-[#FFFBEB] px-1.5 py-0.5 rounded border border-[#FDE68A] text-[10px]">
              <Award className="w-3 h-3 text-[#D97706]" />
              +{Math.floor(order.total / 10)} Khatu Pts
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#78716C] tracking-wider block">
              Ship To (Bhopal)
            </span>
            <span className="font-medium text-[#1C1917] truncate max-w-[140px] block" title={order.customerName}>
              {order.customerName}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <span className="text-[10px] font-mono text-[#78716C]">
            #{order.id.slice(-8).toUpperCase()}
          </span>
          <button
            type="button"
            onClick={handleDownloadReport}
            className="px-2.5 py-1 text-[11px] font-semibold text-[#1B4332] bg-white hover:bg-[#1B4332] hover:text-white rounded border border-[#E8E5DF] hover:border-[#1B4332] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Download simple formatted text report (.txt)"
          >
            <Download className="w-3 h-3 text-[#B45309]" />
            <span>{isDownloaded ? 'Saved ✓' : 'Download Invoice'}</span>
          </button>
          {savedDriveLink ? (
            <a
              href={savedDriveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300 flex items-center gap-1 transition-all"
              title="Open backed up invoice in Google Drive"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Drive Saved ✓</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={handleSaveToDrive}
              disabled={isSavingToDrive}
              className="px-2.5 py-1 text-[11px] font-semibold text-[#1B4332] bg-white hover:bg-emerald-50 rounded border border-[#E8E5DF] hover:border-emerald-500 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="Back up invoice directly into your Google Drive"
            >
              <UploadCloud className="w-3 h-3 text-[#DDA15E]" />
              <span>{isSavingToDrive ? 'Backing up...' : 'Backup to Google Drive'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onViewInvoice && onViewInvoice(order)}
            className="px-2.5 py-1 text-[11px] font-semibold text-[#78716C] hover:text-[#1B4332] hover:bg-[#1B4332]/10 rounded border border-[#E8E5DF] hover:border-[#1B4332] flex items-center gap-1 transition-colors cursor-pointer"
            title="View or print official invoice"
          >
            <FileText className="w-3 h-3 text-[#B45309]" />
            <span>Invoice Details</span>
          </button>
        </div>
      </div>

      {/* Main Order Body */}
      <div className="p-4 sm:p-5 space-y-4">
        
        {/* Status Headline & Delivery Slot */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-serif text-lg sm:text-xl font-bold ${headline.color} leading-none`}>
                {headline.title}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${headline.badgeBg} uppercase tracking-wider`}>
                {order.status === 'out_for_delivery' ? 'Out for Delivery' : order.status}
              </span>
            </div>
            <p className="text-xs text-[#57534E] mt-1">
              {headline.subtitle}
            </p>
          </div>

          <div className="text-right sm:text-right shrink-0">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] px-2.5 py-1 rounded-md">
              <Clock className="w-3.5 h-3.5 text-[#D97706]" />
              <span>{order.deliverySlot}</span>
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VISUAL ORDER STATUS TRACKER WITH DYNAMIC PROGRESS BAR COMPONENT           */}
        {/* ========================================================================= */}
        <div className="space-y-2">
          <OrderStatusProgressBar 
            status={order.status} 
            deliverySlot={order.deliverySlot} 
          />

          {/* Amazon-style Quick Simulator Buttons for Testing */}
          <div className="py-2 px-3 bg-[#FBF9F5] border border-[#E8E5DF] rounded-lg flex flex-wrap items-center justify-between gap-2 text-[10px]">
            <span className="text-[#78716C] font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D97706]" />
              <span>Simulate Visual Colors & States:</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleStatusChange('processing')}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  order.status === 'processing' 
                    ? 'bg-amber-500 text-white shadow-xs' 
                    : 'bg-white border border-amber-300 text-amber-800 hover:bg-amber-50'
                }`}
                title="View Processing state (Warm Amber)"
              >
                1. Processing (Amber)
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('out_for_delivery')}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  order.status === 'out_for_delivery' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-white border border-blue-300 text-blue-800 hover:bg-blue-50'
                }`}
                title="View Out for Delivery state (Vibrant Blue)"
              >
                2. Out for Delivery (Blue)
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('delivered')}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  order.status === 'delivered' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                }`}
                title="View Delivered state (Emerald Green)"
              >
                3. Delivered (Green)
              </button>
            </div>
          </div>
        </div>

        {/* Cold-Chain Quality Badge (For Dairy Assurance) */}
        <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-lg flex items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="text-[11px] leading-tight">
              <strong>Cold-Chain Verified:</strong> Farm chilled milk sealed at <strong>3.8°C</strong>. 
              Zero preservatives, batch lab-tested 100% adulterant-free.
            </span>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 hidden sm:block" />
        </div>

        {/* Order Items Preview */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] uppercase font-bold text-[#78716C] tracking-wider block">
            Items in this Package ({order.items.length})
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {order.items.map((item, i) => (
              <div key={i} className="p-2.5 bg-white border border-[#E8E5DF] rounded-lg flex items-center gap-3">
                <img 
                  src={item.imageUrl} 
                  alt={item.productName} 
                  className="w-12 h-12 object-cover rounded bg-[#FBF9F5] border border-[#E8E5DF]" 
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif text-xs font-bold text-[#1C1917] truncate">
                    {item.productName}
                  </h4>
                  <p className="text-[11px] text-[#78716C]">
                    {item.variantName} · Qty: {item.quantity}
                  </p>
                  <p className="text-xs font-bold text-[#B45309] tabular-nums mt-0.5">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Amazon-Style Action Buttons */}
        <div className="pt-2 border-t border-[#E8E5DF] flex flex-wrap items-center justify-between gap-2 text-xs">
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1 transition-colors cursor-pointer py-1"
          >
            <span>{isExpanded ? 'Hide Tracking Details' : 'Track Package & Details'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadReport}
              className="px-3 py-1.5 bg-[#FBF9F5] hover:bg-[#1B4332] text-[#1B4332] hover:text-white border border-[#E8E5DF] hover:border-[#1B4332] text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Download simple formatted text report of this purchase"
            >
              <Download className="w-3.5 h-3.5 text-[#B45309]" />
              <span>{isDownloaded ? 'Invoice Report Saved ✓' : 'Download Invoice (.txt)'}</span>
            </button>

            {onReorder && (
              <button
                onClick={() => onReorder(order)}
                className="px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Add all items back to cart"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Buy It Again</span>
              </button>
            )}

            {order.status !== 'delivered' && onCancelOrder && (
              <button
                onClick={() => onCancelOrder(order.id)}
                className="px-2.5 py-1.5 border border-[#E8E5DF] text-[#78716C] hover:text-red-600 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Cancel this order"
              >
                Cancel Order
              </button>
            )}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* EXPANDED AMAZON-STYLE PACKAGE TRACKING DETAILS (ACCORDION)                */}
        {/* ========================================================================= */}
        {isExpanded && (
          <div className="pt-4 border-t border-[#E8E5DF] space-y-4 animate-in fade-in duration-200">
            
            {/* Delivery Associate Card (Amazon-style) */}
            <div className="p-3.5 bg-[#FBF9F5] border border-[#E8E5DF] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1B4332] text-[#D97706] font-bold text-sm flex items-center justify-center shrink-0">
                  RV
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1B4332]">Rajesh Verma</span>
                    <span className="text-[10px] bg-white border border-[#E8E5DF] px-1.5 py-0.2 rounded text-[#78716C]">
                      Bhopal Chilled Fleet #4
                    </span>
                  </div>
                  <p className="text-[#57534E] text-[11px] mt-0.5">
                    Electric Insulated Vehicle (MP-04-EA-4120)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="tel:+919826077123"
                  className="px-3 py-1.5 bg-white border border-[#E8E5DF] hover:border-[#1B4332] text-[#1B4332] font-semibold rounded-lg flex items-center gap-1.5 text-xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>Call Associate</span>
                </a>
                <a
                  href="https://wa.me/919826077123"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg flex items-center gap-1.5 text-xs transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Address & Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              <div className="p-3 bg-white border border-[#E8E5DF] rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#78716C] tracking-wider block">
                  Delivery Destination
                </span>
                <p className="font-bold text-[#1C1917]">{order.customerName}</p>
                <p className="text-[#57534E] leading-relaxed">
                  {order.shippingAddress.houseFlat}, {order.shippingAddress.streetColony}<br />
                  {order.shippingAddress.bhopalArea} - {order.shippingAddress.pincode}
                </p>
              </div>

              <div className="p-3 bg-white border border-[#E8E5DF] rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-[#78716C] tracking-wider block">
                    Delivery Instructions
                  </span>
                  <button
                    onClick={() => setShowInstructionsEdit(!showInstructionsEdit)}
                    className="text-[10px] font-bold text-[#1B4332] hover:underline cursor-pointer"
                  >
                    {showInstructionsEdit ? 'Cancel' : 'Update'}
                  </button>
                </div>

                {showInstructionsEdit ? (
                  <form onSubmit={handleSaveInstructionSubmit} className="space-y-2 pt-1">
                    <input
                      type="text"
                      value={instructionText}
                      onChange={(e) => setInstructionText(e.target.value)}
                      placeholder="e.g. Leave in milk basket outside door"
                      className="w-full px-2.5 py-1.5 bg-[#FBF9F5] border border-[#E8E5DF] rounded text-xs focus:outline-none focus:border-[#1B4332]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-[#1B4332] text-white text-[11px] font-bold rounded hover:bg-[#2D6A4F] cursor-pointer"
                    >
                      Save Instructions
                    </button>
                  </form>
                ) : (
                  <p className="text-[#57534E] italic mt-1">
                    {order.deliveryInstructions || 'Standard doorbell delivery during morning slot.'}
                  </p>
                )}
              </div>

            </div>

            {/* Detailed Tracking Events History */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-[#78716C] tracking-wider block">
                Detailed Activity Log (Tracking History)
              </span>

              <div className="space-y-2.5 border-l-2 border-[#1B4332] ml-2 pl-3.5 text-xs">
                {visibleEvents.map((ev, idx) => (
                  <div key={idx} className="relative space-y-0.5">
                    {/* Event Dot */}
                    <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#1B4332] ring-2 ring-white" />
                    
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-bold text-[#1C1917]">{ev.title}</span>
                      <span className="text-[10px] font-mono text-[#78716C] shrink-0">{ev.timestamp}</span>
                    </div>

                    <p className="text-[11px] text-[#B45309] font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{ev.location}</span>
                    </p>

                    <p className="text-[#57534E] text-[11px] leading-relaxed">
                      {ev.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
