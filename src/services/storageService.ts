import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, isFirebaseInitialized } from '../lib/firebase';

export interface StorageUploadResult {
  url: string;
  source: 'firebase-storage' | 'local-store';
  path: string;
  size: number;
}

/**
 * Uploads a file (product image, banner, document) to Cloud Storage for Firebase.
 * If Firebase Storage is offline or the project is newly created without a deployed bucket,
 * it seamlessly converts the image to an optimized DataURL so user actions never fail.
 */
export async function uploadFileToStorage(
  file: File | Blob,
  folder: string = 'product-images',
  customFileName?: string
): Promise<StorageUploadResult> {
  const extension = file.type.split('/')[1] || 'jpg';
  const cleanFileName = customFileName || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
  const storagePath = `${folder}/${cleanFileName}`;

  // Check if Firebase Cloud Storage is live and accessible
  if (isFirebaseInitialized && storage) {
    try {
      const fileRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(fileRef, file, {
        contentType: file.type || 'image/jpeg',
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);

      return {
        url: downloadUrl,
        source: 'firebase-storage',
        path: storagePath,
        size: file.size,
      };
    } catch (firebaseErr: any) {
      console.warn('[Firebase Storage Upload Error, falling back to local store]:', firebaseErr);
    }
  }

  // Graceful High-Reliability Fallback: Convert to DataURL and persist in localStorage cache
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      try {
        if (typeof window !== 'undefined') {
          const cacheKey = `ksp_cached_img_${Date.now()}`;
          // Store small thumbnails/assets in local storage for persistence across reloads
          if (dataUrl.length < 500000) {
            localStorage.setItem(cacheKey, dataUrl);
          }
        }
      } catch (e) {
        // quota exceeded, still return dataUrl
      }
      resolve({
        url: dataUrl,
        source: 'local-store',
        path: storagePath,
        size: file.size,
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Deletes a file from Firebase Storage if hosted there.
 */
export async function deleteFileFromStorage(storagePathOrUrl: string): Promise<boolean> {
  if (!isFirebaseInitialized || !storage) {
    return false;
  }

  try {
    const fileRef = ref(storage, storagePathOrUrl);
    await deleteObject(fileRef);
    return true;
  } catch (err) {
    console.warn('[Storage Delete Warning]:', err);
    return false;
  }
}

/**
 * Tests Firebase Storage health and connectivity.
 */
export async function testStorageHealth(): Promise<{
  isConnected: boolean;
  bucketName: string;
  message: string;
  error?: string;
}> {
  if (!isFirebaseInitialized || !storage) {
    return {
      isConnected: false,
      bucketName: 'Not Connected',
      message: 'Firebase Storage client is not initialized. Using resilient local store.',
    };
  }

  const bucket = storage.app.options.storageBucket || 'unknown-bucket';

  try {
    // Attempt a light ping by creating a reference to a test file
    const testRef = ref(storage, `__healthcheck/ping-${Date.now()}.txt`);
    const blob = new Blob(['OK'], { type: 'text/plain' });
    await uploadBytes(testRef, blob);
    const testUrl = await getDownloadURL(testRef);

    // Clean up test file immediately
    try {
      await deleteObject(testRef);
    } catch (_) {}

    return {
      isConnected: true,
      bucketName: bucket,
      message: `Connected & writable to Cloud Storage bucket (${bucket}).`,
    };
  } catch (err: any) {
    let errorMsg = err?.message || 'Storage probe error';
    if (err?.code === 'storage/unauthorized' || err?.message?.includes('unauthorized')) {
      errorMsg = 'Storage rules deny write access. Ensure rules allow read/write.';
    } else if (err?.code === 'storage/bucket-not-found' || err?.message?.includes('not found')) {
      errorMsg = `Storage bucket "${bucket}" was deleted or not yet created in Firebase Console.`;
    }

    return {
      isConnected: false,
      bucketName: bucket,
      message: errorMsg,
      error: err?.code || err?.message,
    };
  }
}
