import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Button from "../../GeneralComponents/Button/Button";
import Input from "../../GeneralComponents/Input/Input";
import ImageUpload from "../../GeneralComponents/ImageUpload/ImageUpload";
import PaymentButton from "../../GeneralComponents/PaymentButton/PaymentButton";
import { showToast } from "../../GeneralComponents/ToastNotification/ToastNotification";
import { useNotifications } from "../../../context/NotificationContext"; // ✅ استيراد نظام الإشعارات
import "./TransferForm.css";

export default function TransferForm() {
  const { userData } = useAuth();
  const { addNotification } = useNotifications(); // ✅ دالة إضافة إشعار
  const [formData, setFormData] = useState({
    recipientName: "",
    shamCashPhone: "",
    amount: "",
  });
  const [idImageBase64, setIdImageBase64] = useState("");
  const [receiptImageBase64, setReceiptImageBase64] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ✅ منع الإرسال المتعدد
    if (uploading) return;
    
    setError("");
    setSuccess(false);

    if (!formData.recipientName || !formData.shamCashPhone || !formData.amount) {
      return setError("جميع الحقول مطلوبة");
    }
    if (!idImageBase64 || !receiptImageBase64) {
      return setError("صورة الهوية وإيصال الدفع مطلوبان");
    }

    setUploading(true);
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        userId: userData?.uid || "",
        customerName: userData?.name || "",
        type: "transfer",
        recipientName: formData.recipientName,
        shamCashPhone: formData.shamCashPhone,
        amount: parseFloat(formData.amount),
        idImage: idImageBase64,
        receiptImage: receiptImageBase64,
        status: "pending_verification",
        createdAt: serverTimestamp(),
      });

      // ✅ إضافة إشعار للمستخدم
      await addNotification(
        userData?.uid,
        "💸 طلب تحويل جديد",
        `طلب تحويل إلى ${formData.recipientName} بمبلغ ${formData.amount} $ قيد المراجعة`,
        "order_created",
        docRef.id,
        "/my-orders"
      );

      // ✅ إشعار نجاح منبثق
      showToast("✅ تم تقديم طلب التحويل بنجاح! سنقوم بمراجعته قريباً.", "success", 4000);
      
      setSuccess(true);
      setFormData({ recipientName: "", shamCashPhone: "", amount: "" });
      setIdImageBase64("");
      setReceiptImageBase64("");
      // إخفاء رسالة النجاح بعد 3 ثوانٍ
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء إرسال الطلب. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
      showToast("❌ فشل إرسال الطلب: " + err.message, "error", 5000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="transfer-form" dir="rtl">
      <h3 className="transfer-form__title">تقديم طلب تحويل عبر شام كاش</h3>
      {success && (
        <div className="transfer-form__success">
          ✅ تم تقديم الطلب بنجاح! حالة الطلب: قيد التدقيق.
        </div>
      )}
      {error && <div className="transfer-form__error">{error}</div>}
      <form onSubmit={handleSubmit} className="transfer-form__form">
        <Input
          label="الاسم الثلاثي للمستلم"
          id="recipientName"
          name="recipientName"
          value={formData.recipientName}
          onChange={handleChange}
          required
        />
        <Input
          label="رقم هاتف المستلم في شام كاش"
          id="shamCashPhone"
          name="shamCashPhone"
          type="tel"
          value={formData.shamCashPhone}
          onChange={handleChange}
          required
        />
        <Input
          label="المبلغ (دولار/يورو)"
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          value={formData.amount}
          onChange={handleChange}
          required
        />

        <PaymentButton text="ادفع هنا" variant="primary" />

        <ImageUpload
          label="صورة هوية المستلم"
          onUploadComplete={(base64) => setIdImageBase64(base64)}
          maxSizeMB={0.5}
          disabled={uploading}
        />

        <ImageUpload
          label="إيصال الدفع (صورة التحويل)"
          onUploadComplete={(base64) => setReceiptImageBase64(base64)}
          maxSizeMB={0.5}
          disabled={uploading}
        />

        <Button type="submit" disabled={uploading || !idImageBase64 || !receiptImageBase64}>
          {uploading ? "جاري الإرسال..." : "إرسال الطلب"}
        </Button>
      </form>
    </div>
  );
}