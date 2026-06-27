// src/components/AdminCoponent/ExternalStoreImport/components/ImportSettings/ImportSettings.jsx
import React from 'react';
import Button from '../../../../GeneralComponents/Button/Button';
import Input from '../../../../GeneralComponents/Input/Input';
import ImageUpload from '../../../../GeneralComponents/ImageUpload/ImageUpload';
import { CategoryMappingManager } from '../CategoryMappingManager/CategoryMappingManager';
import { FiFilter, FiSave, FiX } from 'react-icons/fi';
import { showToast } from '../../../../GeneralComponents/ToastNotification/ToastNotification';

export default function ImportSettings({
  selectedTargetCategoryId,
  setSelectedTargetCategoryId,
  markupPercent,
  setMarkupPercent,
  showMappingManager,
  setShowMappingManager,
  externalCategories,
  categoryMappings,
  setCategoryMappings,
  hierarchicalConfig,
  setHierarchicalConfig,
  globalCategoryImage,
  setGlobalCategoryImage,
  saveCategoryImage,
}) {
  return (
    <div className="card settings-card">
      <div className="settings-row">
        <div className="target-selector">
          <label>التصنيف المستهدف:</label>
          <select value={selectedTargetCategoryId} onChange={(e) => setSelectedTargetCategoryId(e.target.value)}>
            <option value="games">ألعاب</option>
            <option value="apps">تطبيقات</option>
          </select>
        </div>
        <div className="markup-input">
          <Input
            label="نسبة الربح (%)"
            type="number"
            step="1"
            min="0"
            value={markupPercent}
            onChange={(e) => setMarkupPercent(Number(e.target.value))}
          />
          <p className="hint">السعر النهائي = السعر الأصلي × (1 + نسبة الربح/100)</p>
        </div>
        <Button onClick={() => setShowMappingManager(!showMappingManager)} variant="outline" size="sm">
          <FiFilter /> إدارة التصنيفات
        </Button>
      </div>
      {showMappingManager && (
        <CategoryMappingManager
          externalCategories={externalCategories}
          initialMappings={categoryMappings}
          initialHierarchicalConfig={hierarchicalConfig}
          onMappingChange={({ mappings, hierarchicalConfig: newConfig }) => {
            setCategoryMappings(mappings);
            setHierarchicalConfig(newConfig);
            showToast('تم تحديث الإعدادات', 'info');
          }}
        />
      )}
      <div className="global-image-section">
        <label>صورة عامة للقسم (تظهر في الباقات إذا لم ترفع صورة خاصة):</label>
        <div className="image-upload-row">
          <ImageUpload onUploadComplete={setGlobalCategoryImage} maxSizeMB={0.5} storagePath={`store_import/global/${selectedTargetCategoryId}`} label="رفع صورة" />
          {globalCategoryImage && (
            <div className="image-preview">
              <img src={globalCategoryImage} alt="قسم" />
              <button onClick={() => setGlobalCategoryImage('')} className="remove-btn"><FiX /></button>
            </div>
          )}
        </div>
        <Button onClick={saveCategoryImage} variant="secondary" size="sm"><FiSave /> حفظ صورة القسم</Button>
      </div>
    </div>
  );
}