import React, { useState } from 'react';
import { X, Printer, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Order } from '../../types';
import { downloadInvoiceReport } from '../../utils/invoiceReport';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const [downloaded, setDownloaded] = useState(false);

  const invoiceNumber = `INV-2026-${order.id.slice(-8).toUpperCase()}`;
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    downloadInvoiceReport(order);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <div className="bg-white border border-[#E8E5DF] text-[#1C1917] w-full max-w-3xl rounded-2xl shadow-2xl relative overflow-hidden my-auto print:border-none print:shadow-none print:max-w-full">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="p-4 bg-[#FBF9F5] border-b border-[#E8E5DF] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-serif text-base font-bold text-[#1B4332]">
              Tax Invoice & Delivery Receipt
            </span>
            <span className="text-[11px] text-[#78716C] bg-white border border-[#E8E5DF] px-2 py-0.5 rounded font-mono">
              {invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-white border border-[#E8E5DF] hover:border-[#1B4332] text-[#1B4332] rounded-lg text-xs font-semibold hover:bg-[#1B4332]/5 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Save invoice as a simple formatted text report (.txt)"
            >
              <Download className="w-3.5 h-3.5 text-[#B45309]" />
              <span>{downloaded ? 'Report Saved ✓' : 'Download Invoice (.txt)'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#1B4332] text-white rounded-lg text-xs font-semibold hover:bg-[#2D6A4F] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded-md transition-colors cursor-pointer"
              title="Close Invoice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 space-y-6 text-[#1C1917] text-xs">
          
          {/* Header & Seller Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-[#E8E5DF] pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1B4332] text-[#D97706] font-bold text-xs flex items-center justify-center">
                  ॐ
                </div>
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#1B4332] tracking-tight">
                  KHATU SHYAM PRODUCTS
                </h1>
              </div>
              <p className="text-[#57534E] text-[11px] font-medium leading-relaxed">
                Central Gaushala & Distribution Hub, Sehore–Bhopal Highway<br />
                Bhopal, Madhya Pradesh - 462016, India<br />
                Contact: support@khatushyam.in | +91 755 2420000
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#78716C] pt-1">
                <span><strong>FSSAI Lic No:</strong> 21424010000892</span>
                <span><strong>GSTIN:</strong> 23AABCK9412M1Z8</span>
                <span><strong>State Code:</strong> 23 (MP)</span>
              </div>
            </div>

            <div className="text-right sm:text-right space-y-1 sm:self-start">
              <span className="font-mono text-xs uppercase tracking-wider text-[#B45309] font-bold block">
                TAX INVOICE
              </span>
              <p className="font-bold text-sm text-[#1B4332]">{invoiceNumber}</p>
              <p className="text-[#78716C]">Order ID: <span className="font-mono">{order.id}</span></p>
              <p className="text-[#78716C]">Date: {orderDate}</p>
              <p className="text-[#78716C]">Slot: {order.deliverySlot}</p>
            </div>
          </div>

          {/* Bill To & Ship To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#FBF9F5] p-4 rounded-xl border border-[#E8E5DF]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#78716C] tracking-wider block mb-1">
                Customer Details / Billed To:
              </span>
              <p className="font-bold text-sm text-[#1B4332]">{order.customerName}</p>
              <p className="text-[#57534E] mt-0.5">{order.customerPhone}</p>
              <p className="text-[#78716C]">{order.customerEmail}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#78716C] tracking-wider block mb-1">
                Shipping & Delivery Address (Bhopal):
              </span>
              <p className="text-[#1C1917] font-medium leading-relaxed">
                {order.shippingAddress.houseFlat}, {order.shippingAddress.streetColony}<br />
                {order.shippingAddress.bhopalArea}<br />
                Bhopal, Madhya Pradesh - {order.shippingAddress.pincode}
              </p>
              {order.deliveryInstructions && (
                <p className="text-[11px] text-[#B45309] mt-1 font-medium italic">
                  Note: "{order.deliveryInstructions}"
                </p>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#1B4332] text-[10px] uppercase tracking-wider text-[#1B4332] font-bold">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 px-2">Item Description</th>
                  <th className="py-2 px-2">Variant</th>
                  <th className="py-2 px-2 text-center">Qty</th>
                  <th className="py-2 px-2 text-right">Price (₹)</th>
                  <th className="py-2 pl-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E5DF] text-xs">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#FBF9F5]/60">
                    <td className="py-2.5 pr-2 font-mono text-[#78716C]">{idx + 1}</td>
                    <td className="py-2.5 px-2 font-medium text-[#1C1917]">
                      {item.productName}
                      <span className="block text-[10px] text-[#78716C]">
                        100% Pure Vedic Farm Produce · Bhopal Dispatch
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-[#57534E] text-[11px]">
                      {item.variantName}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold">{item.quantity}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums">₹{item.price.toFixed(2)}</td>
                    <td className="py-2.5 pl-2 text-right font-bold tabular-nums">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Calculation */}
          <div className="border-t border-[#E8E5DF] pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-[11px] text-[#78716C] max-w-sm space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Payment Confirmed via {order.paymentMethod}</span>
              </div>
              <p>
                *Fresh unadulterated milk, curd, and natural grains are exempt from GST (0%). 
                Ghee, oils & dry fruits are taxed at composite 5% GST already included above.
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#78716C]">
                <span>Items Subtotal:</span>
                <span className="tabular-nums font-medium">₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Special Member Discount:</span>
                  <span className="tabular-nums">-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#78716C]">
                <span>Bhopal Cold-Chain Delivery:</span>
                <span className="tabular-nums font-medium">
                  {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#1B4332] pt-2 border-t border-[#1B4332]">
                <span>Grand Total:</span>
                <span className="tabular-nums">₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Signatory Footer */}
          <div className="pt-6 border-t border-[#E8E5DF] flex flex-col sm:flex-row justify-between items-center text-[10px] text-[#78716C] gap-3">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <ShieldCheck className="w-4 h-4 text-[#1B4332]" />
              <span>
                Computer generated invoice. No physical signature required. Authorized by Khatu Shri, Bhopal.
              </span>
            </div>
            <div className="text-right font-serif text-xs font-bold text-[#1B4332]">
              जय श्री श्याम | Jai Shree Shyam
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
