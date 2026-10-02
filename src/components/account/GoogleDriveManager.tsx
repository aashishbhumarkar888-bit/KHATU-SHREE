import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, 
  HardDrive, 
  UploadCloud, 
  CheckCircle2, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  FileText, 
  ShieldCheck, 
  FolderCheck,
  Folder,
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToastNotification } from '../../context/ToastNotificationContext';
import { 
  uploadInvoiceToDrive, 
  listKhatuInvoicesFromDrive, 
  deleteDriveFile, 
  getDriveStorageInfo, 
  formatInvoiceFileName,
  DriveFile, 
  DriveStorageInfo 
} from '../../services/googleDrive';
import { Order } from '../../types';

interface GoogleDriveManagerProps {
  orders: Order[];
}

export const GoogleDriveManager: React.FC<GoogleDriveManagerProps> = ({ orders }) => {
  const { driveAccessToken, isDriveConnected, connectGoogleDrive, disconnectGoogleDrive, user } = useAuth();
  const { showCustomToast } = useToastNotification();

  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [storageInfo, setStorageInfo] = useState<DriveStorageInfo | null>(null);
  const [backingUpOrderId, setBackingUpOrderId] = useState<string | null>(null);
  const [backingUpAll, setBackingUpAll] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load drive files & quota when connected
  const refreshDriveData = useCallback(async () => {
    if (!driveAccessToken) return;
    setLoading(true);
    try {
      const [files, info] = await Promise.allSettled([
        listKhatuInvoicesFromDrive(driveAccessToken),
        getDriveStorageInfo(driveAccessToken),
      ]);

      if (files.status === 'fulfilled') {
        setDriveFiles(files.value);
      }
      if (info.status === 'fulfilled') {
        setStorageInfo(info.value);
      }
    } catch (err) {
      console.warn('Error loading Google Drive data:', err);
    } finally {
      setLoading(false);
    }
  }, [driveAccessToken]);

  useEffect(() => {
    if (isDriveConnected) {
      refreshDriveData();
    } else {
      setDriveFiles([]);
      setStorageInfo(null);
    }
  }, [isDriveConnected, refreshDriveData]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const token = await connectGoogleDrive();
      if (token) {
        showCustomToast({
          orderId: 'DRIVE-CONNECT',
          newStatus: 'delivered',
          title: 'Google Drive Connected',
          message: 'Your personal Google Drive is securely linked for invoice backups.',
          duration: 4000,
        });
      }
    } catch (err: any) {
      if (err?.code === 'popup_closed_by_user' || err?.message?.includes('closed') || err?.message?.includes('cancelled')) {
        showCustomToast({
          orderId: 'DRIVE-AUTH',
          newStatus: 'processing',
          title: 'Google Drive Cancelled',
          message: 'Google Drive authorization window was closed.',
          duration: 4000,
        });
      } else {
        showCustomToast({
          orderId: 'DRIVE-AUTH',
          newStatus: 'placed',
          title: 'Connection Notice',
          message: err?.message || 'Could not connect Google Drive. Please try again.',
          duration: 4000,
        });
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleBackupSingleOrder = async (order: Order) => {
    if (!driveAccessToken) {
      await handleConnect();
      return;
    }

    setBackingUpOrderId(order.id);
    try {
      const uploaded = await uploadInvoiceToDrive(order, driveAccessToken);
      const driveViewUrl = uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`;
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
      await refreshDriveData();
    } catch (err: any) {
      console.error('Backup failed:', err);
      showCustomToast({
        orderId: order.id,
        newStatus: 'processing',
        title: 'Backup Failed',
        message: err?.message || 'Failed to save invoice to Google Drive.',
        duration: 4000,
      });
    } finally {
      setBackingUpOrderId(null);
    }
  };

  const handleBackupAll = async () => {
    if (!driveAccessToken) {
      await handleConnect();
      return;
    }
    if (orders.length === 0) {
      showCustomToast({
        orderId: 'DRIVE-BACKUP',
        newStatus: 'placed',
        title: 'No Orders',
        message: 'No purchase orders available to back up.',
        duration: 3000,
      });
      return;
    }

    setBackingUpAll(true);
    let successCount = 0;
    try {
      for (const order of orders) {
        try {
          await uploadInvoiceToDrive(order, driveAccessToken);
          successCount++;
        } catch (e) {
          console.error(`Failed order ${order.id}`, e);
        }
      }
      showCustomToast({
        orderId: 'DRIVE-BACKUP-ALL',
        newStatus: 'delivered',
        title: 'Drive Backup Complete',
        message: `Successfully backed up ${successCount} of ${orders.length} order invoices to Google Drive.`,
        duration: 5000,
      });
      await refreshDriveData();
    } finally {
      setBackingUpAll(false);
    }
  };

  // Mandatory user confirmation for destructive delete operation
  const confirmDeleteFile = async () => {
    if (!fileToDelete || !driveAccessToken) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(fileToDelete.id, driveAccessToken);
      showCustomToast({
        orderId: 'DRIVE-DELETE',
        newStatus: 'processing',
        title: 'Invoice Deleted',
        message: `Removed ${fileToDelete.name} from Google Drive.`,
        duration: 3000,
      });
      setDriveFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setFileToDelete(null);
    } catch (err: any) {
      showCustomToast({
        orderId: 'DRIVE-ERROR',
        newStatus: 'placed',
        title: 'Delete Failed',
        message: err?.message || 'Could not delete file from Google Drive.',
        duration: 4000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return '0 KB';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#1B4332] text-white p-5 rounded-2xl relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                <HardDrive className="w-5 h-5 text-[#DDA15E]" />
              </span>
              <span className="text-xs uppercase font-bold tracking-widest text-[#DDA15E]">
                Official Google Workspace Integration
              </span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#FAF7F2]">
              Google Drive Invoice & Receipt Vault
            </h3>
            <p className="text-xs text-[#FAF7F2]/80 max-w-xl">
              Back up your purchase receipts and official GST tax invoices directly to your personal Google Drive in the <strong className="text-white">Khatu Shri Invoices</strong> folder. Access them anytime, anywhere.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isDriveConnected ? (
              <button
                onClick={disconnectGoogleDrive}
                className="px-3 py-2 text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer border border-white/20"
              >
                Disconnect Drive
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-4 py-2.5 bg-white text-[#1B4332] hover:bg-[#FAF7F2] font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {/* Official Google G SVG */}
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                {connecting ? 'Connecting...' : 'Connect Google Drive'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Connection State Details */}
      {isDriveConnected ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white border border-[#E8E5DF] rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center gap-2 text-[#2D6A4F]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">Drive Account</span>
            </div>
            <p className="text-sm font-semibold text-[#1C1917] truncate">
              {storageInfo?.user?.displayName || user?.displayName || 'Google Account'}
            </p>
            <p className="text-xs text-[#78716C] truncate">
              {storageInfo?.user?.emailAddress || user?.email || 'Connected'}
            </p>
          </div>

          <div className="p-4 bg-white border border-[#E8E5DF] rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center gap-2 text-[#2D6A4F]">
              <Folder className="w-4 h-4 text-[#DDA15E]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">Destination Folder</span>
            </div>
            <p className="text-sm font-semibold text-[#1C1917]">Khatu Shri Invoices</p>
            <p className="text-xs text-[#78716C] flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-600" /> Private to your Google Drive
            </p>
          </div>

          <div className="p-4 bg-white border border-[#E8E5DF] rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center gap-2 text-[#2D6A4F]">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">Invoices in Vault</span>
            </div>
            <p className="text-sm font-semibold text-[#1C1917]">
              {driveFiles.length} Invoices Backed Up
            </p>
            <p className="text-xs text-[#78716C]">
              {orders.length} Total orders available
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-[#FAF7F2] border border-[#E8E5DF] rounded-2xl space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#DDA15E]/20 text-[#B45309] rounded-xl shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#1C1917]">
                Why connect Google Drive?
              </h4>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Khatu Shri provides full integration with Google Drive to automatically preserve your tax invoices and farm delivery receipts. With permission from you, our app saves formatted text invoices in your drive so you have permanent digital records for tax filing, audits, or expense tracking.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-white rounded-xl border border-[#E8E5DF] text-xs">
              <span className="font-bold text-[#1B4332] block mb-0.5">🔒 Private & Secure</span>
              <span className="text-[#78716C]">Uses drive.file scope to only access files created by Khatu Shri.</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E8E5DF] text-xs">
              <span className="font-bold text-[#1B4332] block mb-0.5">📑 FSSAI & GST Ready</span>
              <span className="text-[#78716C]">Includes batch timestamps, Sehore gaushala dispatch data, and tax breakdowns.</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E8E5DF] text-xs">
              <span className="font-bold text-[#1B4332] block mb-0.5">⚡ 1-Click Sync</span>
              <span className="text-[#78716C]">Backup individual orders or sync all past purchases with one click.</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackupAll}
            disabled={backingUpAll}
            className="px-4 py-2.5 bg-[#1B4332] text-white hover:bg-[#2D6A4F] text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4 text-[#DDA15E]" />
            {backingUpAll ? 'Backing up all orders...' : 'Backup All Invoices to Drive'}
          </button>

          {isDriveConnected && (
            <button
              onClick={refreshDriveData}
              disabled={loading}
              className="p-2.5 bg-white border border-[#E8E5DF] text-[#78716C] hover:text-[#1B4332] hover:bg-[#FAF7F2] rounded-xl transition-colors cursor-pointer"
              title="Refresh Drive Files"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        <span className="text-xs text-[#78716C]">
          Folder: <strong className="text-[#1C1917]">Google Drive / Khatu Shri Invoices</strong>
        </span>
      </div>

      {/* Orders Backup Table */}
      <div className="bg-white border border-[#E8E5DF] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-[#FAF7F2]/60 border-b border-[#E8E5DF] flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-[#1C1917]">Purchase Invoices</h4>
            <p className="text-xs text-[#78716C]">Directly sync or view each order in Google Drive</p>
          </div>
          <span className="text-xs font-medium text-[#78716C]">
            {orders.length} Orders
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-[#78716C] text-xs">
            No orders found yet. Place an order to back up invoices.
          </div>
        ) : (
          <div className="divide-y divide-[#E8E5DF]">
            {orders.map((order) => {
              const expectedName = formatInvoiceFileName(order.id);
              const legacyName = `Khatu_Store_Invoice_${order.id}.txt`;
              const driveFile = driveFiles.find((f) => f.name === expectedName || f.name === legacyName);
              const isBackingUp = backingUpOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF7F2]/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#FAF7F2] border border-[#E8E5DF] rounded-xl text-[#1B4332] shrink-0">
                      <FileText className="w-5 h-5 text-[#2D6A4F]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1C1917]">
                          Order #{order.id}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#FAF7F2] text-[#78716C] border border-[#E8E5DF]">
                          ₹{order.total.toFixed(2)}
                        </span>
                        {driveFile && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Backed Up
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#78716C] mt-0.5">
                        {order.items.length} items ({order.items.map((i) => i.productName).join(', ').slice(0, 48)}...)
                      </p>
                      <p className="text-[10px] text-[#A8A29E]">
                        Placed: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {driveFile ? (
                      <>
                        {driveFile.webViewLink && (
                          <a
                            href={driveFile.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-emerald-50 text-[#1B4332] hover:text-emerald-700 border border-[#E8E5DF] hover:border-emerald-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View on Drive
                          </a>
                        )}
                        <button
                          onClick={() => setFileToDelete(driveFile)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete from Google Drive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleBackupSingleOrder(order)}
                        disabled={isBackingUp}
                        className="px-3 py-1.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-medium rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-[#DDA15E]" />
                        {isBackingUp ? 'Backing up...' : 'Backup to Google Drive'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mandatory User Confirmation Modal for Destructive Delete Operations */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E5DF] space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1C1917]">
                  Delete from Google Drive?
                </h3>
                <p className="text-xs text-[#78716C]">
                  This operation will permanently remove the file from your personal Google Drive.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8E5DF] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#78716C]">File Name:</span>
                <span className="font-semibold text-[#1C1917]">{fileToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Location:</span>
                <span className="font-semibold text-[#1C1917]">Khatu Shri Invoices</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-[#E8E5DF] text-xs font-semibold text-[#78716C] hover:bg-[#FAF7F2] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteFile}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
