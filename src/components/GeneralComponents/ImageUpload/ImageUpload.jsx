

import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import './ImageUpload.css';

export default function ImageUpload({
  label = 'رفع صورة',
  maxSizeMB = 0.5,
  maxWidthOrHeight = 1024,
  onUploadComplete,  // ترجع base64
  disabled = false,
}) {
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(''); // معاينة

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setFileName('');
    setPreview('');

    if (!file.type.startsWith('image/')) {
      setError('الملف المختار ليس صورة');
      return;
    }

    try {
      setCompressing(true);
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

      // تحويل إلى Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        onUploadComplete?.(base64String);
        setCompressing(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء معالجة الصورة');
      setCompressing(false);
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
          disabled={disabled || compressing}
        />
        {compressing && <span className="status">جاري ضغط الصورة...</span>}
        {preview && !compressing && (
          <div className="preview">
            <img src={preview} alt="معاينة" />
          </div>
        )}
        {fileName && !compressing && !error && (
          <span className="file-name">{fileName}</span>
        )}
        {error && <span className="error">{error}</span>}
      </div>
      <small>أقصى حجم بعد الضغط: {maxSizeMB} ميجابايت</small>
    </div>
  );
}