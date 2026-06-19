// src/pages/Admin/AdminTicker.jsx
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/store';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Button from '../../components/GeneralComponents/Button/Button';
import Input from '../../components/GeneralComponents/Input/Input';
import toast from 'react-hot-toast';
import './AdminTicker.css';

export default function AdminTicker() {
  // ✅ استخدم useAppStore بدلاً من useTicker
  const tickerSettings = useAppStore((state) => state.tickerSettings);
  const setTickerSettings = useAppStore((state) => state.setTickerSettings);

  const [text, setText] = useState('');
  const [segments, setSegments] = useState([]);
  const [speed, setSpeed] = useState(30);
  const [direction, setDirection] = useState('right-to-left');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newWord, setNewWord] = useState({ text: '', color: '#ff0000', fontWeight: 'bold', fontFamily: 'inherit' });

  useEffect(() => {
    if (tickerSettings) {
      setText(tickerSettings.text || '');
      setSegments(tickerSettings.segments || []);
      setSpeed(tickerSettings.speed || 30);
      setDirection(tickerSettings.direction || 'right-to-left');
      setIsActive(tickerSettings.isActive !== false);
    }
  }, [tickerSettings]);

  const addSegment = () => {
    if (!newWord.text.trim()) return;
    setSegments([...segments, { ...newWord, text: newWord.text }]);
    setNewWord({ text: '', color: '#ff0000', fontWeight: 'bold', fontFamily: 'inherit' });
  };

  const removeSegment = (index) => {
    const newSegments = [...segments];
    newSegments.splice(index, 1);
    setSegments(newSegments);
  };

  const updateSegment = (index, field, value) => {
    const newSegments = [...segments];
    newSegments[index][field] = value;
    setSegments(newSegments);
  };

  // ✅ دالة حفظ محلية تحدث الـ store و Firestore
  const handleSave = async () => {
    setSaving(true);
    const data = {
      text: segments.map(s => s.text).join(''),
      segments,
      speed,
      direction,
      isActive,
      updatedAt: new Date().toISOString(),
    };

    try {
      // حفظ في Firestore
      const docRef = doc(db, 'tickerSettings', 'default');
      await setDoc(docRef, data, { merge: true });
      // تحديث الـ store المحلي
      setTickerSettings(data);
      toast.success('تم حفظ إعدادات شريط الأخبار بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (!tickerSettings) return <div>جاري التحميل...</div>;

  return (
    <div className="admin-ticker">
      <h2>📢 إدارة شريط الأخبار المتحرك</h2>
      <div className="admin-ticker__preview">
        <h3>معاينة الشريط:</h3>
        <div className="ticker-preview" dir="rtl">
          <div className="ticker-preview__content" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {segments.map((seg, idx) => (
              <span key={idx} style={{ color: seg.color, fontWeight: seg.fontWeight, fontFamily: seg.fontFamily }}>
                {seg.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-ticker__form">
        <div className="form-group">
          <label>سرعة الحركة (ثانية لكل دورة كاملة)</label>
          <Input type="number" value={speed} onChange={e => setSpeed(Number(e.target.value))} min="5" max="100" />
        </div>
        <div className="form-group">
          <label>الاتجاه</label>
          <select value={direction} onChange={e => setDirection(e.target.value)}>
            <option value="right-to-left">من اليمين إلى اليسار</option>
            <option value="left-to-right">من اليسار إلى اليمين</option>
          </select>
        </div>
        <div className="form-group checkbox">
          <label>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            تفعيل الشريط
          </label>
        </div>

        <hr />
        <h3>إدارة الكلمات المنسقة</h3>
        <div className="segment-editor">
          {segments.map((seg, idx) => (
            <div key={idx} className="segment-item">
              <input type="text" value={seg.text} onChange={e => updateSegment(idx, 'text', e.target.value)} />
              <input type="color" value={seg.color} onChange={e => updateSegment(idx, 'color', e.target.value)} />
              <select value={seg.fontWeight} onChange={e => updateSegment(idx, 'fontWeight', e.target.value)}>
                <option value="normal">عادي</option>
                <option value="bold">عريض</option>
              </select>
              <select value={seg.fontFamily} onChange={e => updateSegment(idx, 'fontFamily', e.target.value)}>
                <option value="inherit">افتراضي</option>
                <option value="Tajawal, sans-serif">تاجوال</option>
                <option value="Arial">Arial</option>
                <option value="monospace">مونو</option>
              </select>
              <Button variant="danger" onClick={() => removeSegment(idx)}>حذف</Button>
            </div>
          ))}
        </div>

        <div className="add-segment">
          <h4>إضافة كلمة جديدة</h4>
          <Input placeholder="النص" value={newWord.text} onChange={e => setNewWord({ ...newWord, text: e.target.value })} />
          <Input type="color" label="اللون" value={newWord.color} onChange={e => setNewWord({ ...newWord, color: e.target.value })} />
          <select value={newWord.fontWeight} onChange={e => setNewWord({ ...newWord, fontWeight: e.target.value })}>
            <option value="normal">عادي</option>
            <option value="bold">عريض</option>
          </select>
          <select value={newWord.fontFamily} onChange={e => setNewWord({ ...newWord, fontFamily: e.target.value })}>
            <option value="inherit">افتراضي</option>
            <option value="Tajawal, sans-serif">تاجوال</option>
            <option value="Arial">Arial</option>
          </select>
          <Button onClick={addSegment}>+ إضافة كلمة</Button>
        </div>

        <Button onClick={handleSave} disabled={saving}>💾 حفظ التغييرات</Button>
      </div>
    </div>
  );
}