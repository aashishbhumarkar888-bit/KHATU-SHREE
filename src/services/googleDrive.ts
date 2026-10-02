import { Order } from '../types';
import { generateInvoiceTextReport } from '../utils/invoiceReport';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
}

export interface DriveStorageInfo {
  user: {
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  };
  storageQuota?: {
    limit?: string;
    usage?: string;
    usageInDrive?: string;
  };
}

export const KHATU_FOLDER_NAME = 'Khatu Shri Invoices';
export const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

// In-memory token storage (NEVER written to localStorage or sessionStorage)
interface TokenRecord {
  token: string;
  expiresAt: number;
}

let inMemoryToken: TokenRecord | null = null;
let gisScriptLoadingPromise: Promise<void> | null = null;

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Loads the official Google Identity Services (GIS) client script.
 */
export function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  if (gisScriptLoadingPromise) {
    return gisScriptLoadingPromise;
  }

  gisScriptLoadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', (err) => reject(new Error('Failed to load Google Identity Services.')));
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK.'));
    document.head.appendChild(script);
  });

  return gisScriptLoadingPromise;
}

/**
 * Requests an OAuth access token with scope "https://www.googleapis.com/auth/drive.file"
 * using the OAuth Client ID from an environment variable (never hardcoded).
 * Stores granted token in memory only. Automatically re-requests silently if token is expired.
 */
export async function requestDriveAccessToken(forcePrompt: boolean = false): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google OAuth Client ID is not configured in environment (VITE_GOOGLE_OAUTH_CLIENT_ID).');
  }

  const now = Date.now();
  // If in-memory token is still valid for at least 60 seconds, reuse it
  if (!forcePrompt && inMemoryToken && inMemoryToken.expiresAt > now + 60000) {
    return inMemoryToken.token;
  }

  await loadGisScript();

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services SDK is not available.');
  }

  return new Promise<string>((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_FILE_SCOPE,
        callback: (resp: any) => {
          if (resp.error) {
            if (resp.error === 'popup_closed_by_user' || resp.error === 'access_denied') {
              const err = new Error('Google Drive authorization popup was closed.');
              (err as any).code = 'popup_closed_by_user';
              reject(err);
            } else {
              reject(new Error(resp.error_description || resp.error || 'Google Drive authorization failed.'));
            }
            return;
          }

          if (resp.access_token) {
            const expiresIn = Number(resp.expires_in) || 3600;
            inMemoryToken = {
              token: resp.access_token,
              expiresAt: Date.now() + expiresIn * 1000,
            };
            resolve(resp.access_token);
          } else {
            reject(new Error('No access token returned from Google Identity Services.'));
          }
        },
        error_callback: (err: any) => {
          const errObj = new Error(err?.message || 'Google Drive authorization popup was closed.');
          (errObj as any).code = 'popup_closed_by_user';
          reject(errObj);
        }
      });

      // If we had a prior token in memory and are re-requesting due to expiry, attempt silent flow first
      const promptParam = forcePrompt ? 'select_account' : (inMemoryToken ? '' : 'select_account');
      tokenClient.requestAccessToken({ prompt: promptParam });
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Clears in-memory token on disconnect or sign out.
 */
export function clearMemoryDriveToken(): void {
  inMemoryToken = null;
}

/**
 * Returns currently cached valid in-memory token, or null.
 */
export function getCachedDriveToken(): string | null {
  if (inMemoryToken && inMemoryToken.expiresAt > Date.now() + 10000) {
    return inMemoryToken.token;
  }
  return null;
}

/**
 * Formats standard invoice file name: "KS-2025-XXXXX_invoice.txt"
 */
export function formatInvoiceFileName(orderId: string): string {
  // Extract alphanumeric code from orderId (e.g. KSP-BPL-123456 -> 123456 or 12345)
  const clean = orderId.replace(/[^a-zA-Z0-9]/g, '');
  const suffix = clean.slice(-5).toUpperCase() || '00001';
  return `KS-2025-${suffix}_invoice.txt`;
}

/**
 * Checks for a folder named "Khatu Shri Invoices" via drive.files.list with the app's own scope.
 * Creates it with drive.files.create if missing.
 */
export async function getOrCreateKhatuFolder(accessToken: string): Promise<string> {
  const query = `mimeType = 'application/vnd.google-apps.folder' and (name = '${KHATU_FOLDER_NAME}' or name = 'Khatu Store Invoices') and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`;

  const searchRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    throw new Error(`Failed to query Google Drive folder: ${searchRes.status} ${errorText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder with drive.files.create
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: KHATU_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Official invoices and receipts backed up from Khatu Shri Marketplace',
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create Google Drive folder: ${createRes.status} ${errorText}`);
  }

  const newFolder = await createRes.json();
  return newFolder.id;
}

/**
 * Uploads an invoice as a text/plain file named "KS-2025-XXXXX_invoice.txt" via multipart upload to drive/v3.
 */
export async function uploadInvoiceToDrive(order: Order, accessToken: string): Promise<DriveFile> {
  const folderId = await getOrCreateKhatuFolder(accessToken);
  const fileName = formatInvoiceFileName(order.id);
  const fileContent = generateInvoiceTextReport(order);

  // Check if file already exists in this folder
  const checkQuery = `'${folderId}' in parents and name = '${fileName}' and trashed = false`;
  const checkUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(checkQuery)}&fields=files(id,name,webViewLink,size,createdTime)&spaces=drive`;

  const checkRes = await fetch(checkUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (checkRes.ok) {
    const checkData = await checkRes.json();
    if (checkData.files && checkData.files.length > 0) {
      const existingFile = checkData.files[0];
      // Update existing file content via media patch
      const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`;
      const updateRes = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/plain; charset=UTF-8',
        },
        body: fileContent,
      });

      if (updateRes.ok) {
        return {
          id: existingFile.id,
          name: fileName,
          mimeType: 'text/plain',
          webViewLink: existingFile.webViewLink || `https://drive.google.com/file/d/${existingFile.id}/view`,
          size: String(new Blob([fileContent]).size),
          createdTime: existingFile.createdTime || new Date().toISOString(),
        };
      }
    }
  }

  // Multipart upload to drive/v3/files
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    mimeType: 'text/plain',
    parents: [folderId],
    description: `Tax Invoice & Receipt for Order #${order.id} backed up from Khatu Shri`,
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Failed to save invoice to Google Drive: ${uploadRes.status} ${errorText}`);
  }

  const uploadedData = await uploadRes.json();
  return {
    ...uploadedData,
    webViewLink: uploadedData.webViewLink || `https://drive.google.com/file/d/${uploadedData.id}/view`,
  };
}

/**
 * Fetches all Khatu Shri backed up invoices from user's Drive.
 */
export async function listKhatuInvoicesFromDrive(accessToken: string): Promise<DriveFile[]> {
  const query = `(name contains 'KS-2025-' or name contains 'Khatu_Store_Invoice_') and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,mimeType,webViewLink,webContentLink,size,createdTime,modifiedTime)&orderBy=createdTime desc&pageSize=50`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list invoices from Google Drive: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    ...f,
    webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
  }));
}

/**
 * Permanently deletes an invoice file from Google Drive.
 */
export async function deleteDriveFile(fileId: string, accessToken: string): Promise<boolean> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 204) {
    const errorText = await res.text();
    throw new Error(`Failed to delete file from Google Drive: ${res.status} ${errorText}`);
  }

  return true;
}

/**
 * Gets user's Google Drive account and storage details.
 */
export async function getDriveStorageInfo(accessToken: string): Promise<DriveStorageInfo> {
  const url = 'https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress,photoLink),storageQuota(limit,usage,usageInDrive)';
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch Drive details: ${res.status} ${errorText}`);
  }

  return await res.json();
}
