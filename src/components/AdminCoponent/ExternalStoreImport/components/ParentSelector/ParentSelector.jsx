// src/components/AdminCoponent/ExternalStoreImport/components/ParentSelector/ParentSelector.jsx
import React from 'react';
import Button from '../../../../GeneralComponents/Button/Button';
import ImageUpload from '../../../../GeneralComponents/ImageUpload/ImageUpload';
import { FiFolder, FiX } from 'react-icons/fi';

export default function ParentSelector({
  parentItems,
  selectedParentId,
  setSelectedParentId,
  selectedParentGlobalImage,
  setSelectedParentGlobalImage,
  titleLabel,
}) {
  const selectedParent = parentItems.find((p) => p.id === selectedParentId);

  return (
    <div className="card parents-selection">
      <h4>
        <FiFolder /> اختر {titleLabel} التي تريد إضافة الباقات إليها
      </h4>
      {parentItems.length === 0 ? (
        <p className="no-parents">
          لا توجد {titleLabel === 'اللعبة' ? 'ألعاب' : 'تطبيقات'} مضافة بعد. قم بإضافتها من لوحة الإدارة أولاً.
        </p>
      ) : (
        <div className="parents-grid">
          {parentItems.map((parent) => (
            <div
              key={parent.id}
              className={`parent-card ${selectedParentId === parent.id ? 'selected' : ''}`}
              onClick={() => setSelectedParentId(parent.id)}
            >
              <div className="parent-image">
                {parent.imageUrl ? (
                  <img src={parent.imageUrl} alt={parent.name} loading="lazy" />
                ) : (
                  <div className="parent-placeholder">{titleLabel === 'اللعبة' ? '🎮' : '📱'}</div>
                )}
              </div>
              <div className="parent-info">
                <h5>{parent.name}</h5>
                <p className="parent-description">{parent.description?.slice(0, 60)}</p>
                <span className="parent-product-count">📦 {parent.packageCount} باقة</span>
              </div>
              {selectedParentId === parent.id && <div className="parent-selected-badge">✓</div>}
            </div>
          ))}
        </div>
      )}
      {selectedParent && (
        <div className="selected-parent-details">
          <div className="selected-parent-header">
            <strong>القسم المختار:</strong> {selectedParent.name}
            <Button variant="outline" size="sm" onClick={() => { setSelectedParentId(null); setSelectedParentGlobalImage(''); }}>
              تغيير
            </Button>
          </div>
          <div className="parent-global-image">
            <label>صورة موحدة لجميع الباقات المستوردة لهذا القسم (اختياري):</label>
            <ImageUpload
              onUploadComplete={setSelectedParentGlobalImage}
              maxSizeMB={0.5}
              storagePath={`store_import/parent/${selectedParent.id}`}
              label="رفع صورة موحدة"
            />
            {selectedParentGlobalImage && (
              <div className="image-preview">
                <img src={selectedParentGlobalImage} alt="صورة موحدة" />
                <button onClick={() => setSelectedParentGlobalImage('')} className="remove-btn"><FiX /></button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}