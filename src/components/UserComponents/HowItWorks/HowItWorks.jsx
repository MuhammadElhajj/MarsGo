// src/components/UserComponents/HowItWorks/HowItWorks.jsx
import { useState, useEffect } from 'react';
import { FiInfo } from 'react-icons/fi';
import { db } from '../../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './HowItWorks.css';

export default function HowItWorks({ page }) { // page: 'transfer', 'gaming', إلخ
  const [lines, setLines] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchInstructions = async () => {
      if (!page) {
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'pageInstructions'), where('page', '==', page), where('active', '==', true));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setLines(data.lines);
        } else {
          // نصوص افتراضية إذا لم توجد تعليمات مخصصة
          setLines([
            "قم بتسجيل الدخول إلى حسابك.",
            "املأ البيانات المطلوبة بدقة.",
            "ارفع المستندات ثم اضغط إرسال."
          ]);
        }
      } catch (err) {
        console.error(err);
        setLines(["حدث خطأ في تحميل التعليمات"]);
      } finally {
        setLoading(false);
      }
    };
    fetchInstructions();
  }, [page]);

  if (loading) return null; // أو مؤقت تحميل صغير
  if (!lines || lines.length === 0) return null;

  const fullText = lines.join(' ');

  return (
    <div className="how-it-works-simple">
      <div className="how-it-works-simple__header">
        <FiInfo className="how-it-works-simple__icon" size={22} />
        <h3 className="how-it-works-simple__title">كيف يعمل</h3>
      </div>
      <ul className="how-it-works-simple__list">
        {lines.map((line, idx) => (
          <li key={idx} className="how-it-works-simple__list-item">{line}</li>
        ))}
      </ul>
      <button className="how-it-works-simple__btn" onClick={() => setModalOpen(true)}>
        معرفة المزيد
      </button>

      {modalOpen && (
        <div className="how-it-works-simple__modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="how-it-works-simple__modal" onClick={(e) => e.stopPropagation()}>
            <button className="how-it-works-simple__modal-close" onClick={() => setModalOpen(false)}>✕</button>
            <FiInfo className="how-it-works-simple__modal-icon" size={40} />
            <h3 className="how-it-works-simple__modal-title">كيف يعمل الموقع</h3>
            <div className="how-it-works-simple__modal-text">
              <p>{fullText}</p>
              <p><strong>ملاحظة:</strong> بعد إرسال الطلب، سيتولى فريقنا مراجعته وتنفيذه، ويمكنك متابعة الحالة من صفحة "طلباتي".</p>
            </div>
            <button className="how-it-works-simple__modal-btn" onClick={() => setModalOpen(false)}>فهمت</button>
          </div>
        </div>
      )}
    </div>
  );
}