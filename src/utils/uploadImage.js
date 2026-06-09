import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * تحويل base64 إلى Blob
 */
function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

/**
 * رفع صورة إلى Firebase Storage
 * @param {File|Blob|string} file - الملف أو مسار base64
 * @param {string} path - المسار داخل التخزين
 * @returns {Promise<string>} رابط التحميل
 */
export async function uploadImage(file, path) {
  let blob;
  
  if (typeof file === 'string' && file.startsWith('data:image')) {
    // إذا كان base64
    blob = dataURItoBlob(file);
  } 
  else if (file instanceof File || file instanceof Blob) {
    // إذا كان File أو Blob
    blob = file;
  }
  else {
    console.error('نوع الملف غير معروف:', file);
    throw new Error('Invalid image format: must be base64 string, File, or Blob');
  }

  // تنظيف المسار من الأحرف غير المسموحة
  const safePath = path.replace(/[^a-zA-Z0-9\/._-]/g, '_');
  const storageRef = ref(storage, safePath);
  
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  return url;
}

/**
 * حذف صورة من Storage
 * @param {string} url - رابط الصورة
 */
export async function deleteImage(url) {
  if (!url) return;
  try {
    const imageRef = ref(storage, url);
    await deleteObject(imageRef);
  } catch (error) {
    console.warn('Failed to delete image:', error);
  }
}