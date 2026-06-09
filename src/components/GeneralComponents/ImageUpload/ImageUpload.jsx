import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { uploadImage } from '../../../utils/uploadImage'; // استدعاء دالة الرفع
import './ImageUpload.css';

export default function ImageUpload({
  label = 'رفع صورة',
  maxSizeMB = 0.5,
  maxWidthOrHeight = 1024,
  onUploadComplete,   // ترجع رابط (URL) من Firebase Storage
  disabled = false,
  storagePath = 'temp', // مسار داخل التخزين (مثل 'games/gameId')
}) {
  const [compressing, setCompressing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setFileName('');
    setPreview('');
    setUploading(false);
    setCompressing(false);

    if (!file.type.startsWith('image/')) {
      setError('الملف المختار ليس صورة');
      return;
    }

    try {
      setCompressing(true);

      // ضغط الصورة
      const options = {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
        fileType: file.type,
      };
      const compressedFile = await imageCompression(file, options);
      setFileName(compressedFile.name);

      // معاينة
      const previewUrl = URL.createObjectURL(compressedFile);
      setPreview(previewUrl);

      // رفع إلى Firebase Storage
      setUploading(true);
      setCompressing(false);

      // إنشاء مسار فريد (يمكن تمريره من الخارج أو توليده)
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const path = `${storagePath}/${uniqueSuffix}_${compressedFile.name}`;
      
      // تحويل الملف إلى Blob إذا لزم الأمر (uploadImage تقبل File أو Blob)
      const url = await uploadImage(compressedFile, path);
      
      onUploadComplete?.(url);
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء معالجة الصورة أو رفعها');
    } finally {
      setCompressing(false);
      setUploading(false);
    }
  };

  return (
    <div className="image-upload">
      <label className="image-upload__label">{label}</label>
      <div className={`image-upload__input-wrapper ${disabled ? 'disabled' : ''}`}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled || compressing || uploading}
        />
        {compressing && <span className="image-upload__status">جاري ضغط الصورة...</span>}
        {uploading && <span className="image-upload__status">جاري رفع الصورة...</span>}
        {preview && !compressing && !uploading && (
          <div className="preview">
            <img src={preview} alt="معاينة" />
          </div>
        )}
        {fileName && !compressing && !uploading && !error && (
          <span className="image-upload__file-name">{fileName}</span>
        )}
        {error && <span className="image-upload__error">{error}</span>}
      </div>
      <small className="image-upload__hint">
        أقصى حجم بعد الضغط: {maxSizeMB} ميجابايت
      </small>
    </div>
  );
}