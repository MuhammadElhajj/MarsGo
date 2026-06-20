// src/components/AdminCoponent/ExternalStoreImport/components/CategoryMappingManager/CategoryMappingManager.jsx
import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../../../firebase';
import { FiSettings, FiSave } from 'react-icons/fi';
import Button from '../../../../GeneralComponents/Button/Button';
import Input from '../../../../GeneralComponents/Input/Input';
import { showToast } from '../../../../GeneralComponents/ToastNotification/ToastNotification';
import './CategoryMappingManager.css';

export function CategoryMappingManager({ externalCategories, onMappingChange, initialMappings, initialHierarchicalConfig }) {
  const [mappings, setMappings] = useState(initialMappings || {});
  const [hierarchicalConfig, setHierarchicalConfig] = useState(
    initialHierarchicalConfig || { games: { separator: ' - ' }, apps: { separator: ' - ' } }
  );
  const [loading, setLoading] = useState(false);
  const internalOptions = [
    { value: 'games', label: 'ألعاب' }, { value: 'apps', label: 'تطبيقات' },
    { value: 'services', label: 'خدمات' }, { value: 'topup', label: 'شحن رصيد' }, { value: 'crypto', label: 'عملات رقمية' }
  ];
  const saveSettings = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'config', 'categoryMappings'), mappings);
      await setDoc(doc(db, 'config', 'hierarchicalConfig'), hierarchicalConfig);
      showToast('تم حفظ إعدادات التصنيف', 'success');
      if (onMappingChange) onMappingChange({ mappings, hierarchicalConfig });
    } catch (err) { showToast('فشل الحفظ', 'error'); }
    setLoading(false);
  };
  return (
    <div className="mapping-manager card">
      <h4><FiSettings /> تعيين التصنيفات الخارجية</h4>
      <div className="mapping-grid">
        {externalCategories.map(cat => (
          <div key={cat} className="mapping-row">
            <span className="external-cat">{cat}</span>
            <select value={mappings[cat] || 'services'} onChange={(e) => setMappings({ ...mappings, [cat]: e.target.value })}>
              {internalOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        ))}
      </div>
      <h4>إعدادات الفاصل</h4>
      <div className="hierarchical-config">
        <Input label="ألعاب - الفاصل" value={hierarchicalConfig.games?.separator || ' - '} onChange={(e) => setHierarchicalConfig({ ...hierarchicalConfig, games: { separator: e.target.value } })} />
        <Input label="تطبيقات - الفاصل" value={hierarchicalConfig.apps?.separator || ' - '} onChange={(e) => setHierarchicalConfig({ ...hierarchicalConfig, apps: { separator: e.target.value } })} />
      </div>
      <Button onClick={saveSettings} disabled={loading} variant="secondary" size="sm"><FiSave /> حفظ</Button>
    </div>
  );
}