import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Button from "../../GeneralComponents/Button/Button";
import Input from "../../GeneralComponents/Input/Input";
import ImageUpload from "../../GeneralComponents/ImageUpload/ImageUpload";
import "./TransferForm.css";

export default function TransferForm() {
  const { userData } = useAuth();
  const [formData, setFormData] = useState({
    recipientName: "",
    shamCashPhone: "",
    amount: "",
  });
  // تغيير الأسماء: idImageBase64, receiptImageBase64 (بدلاً من idImageUrl)
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
      await addDoc(collection(db, "orders"), {
        userId: userData?.uid || "",
        customerName: userData?.name || "",
        type: "transfer",
        recipientName: formData.recipientName,
        shamCashPhone: formData.shamCashPhone,
        amount: parseFloat(formData.amount),
        idImage: idImageBase64,          // تخزين base64
        receiptImage: receiptImageBase64, // تخزين base64
        status: "pending_verification",
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setFormData({ recipientName: "", shamCashPhone: "", amount: "" });
      setIdImageBase64("");
      setReceiptImageBase64("");
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء إرسال الطلب. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="transfer-form" dir="rtl">
      <h3 className="transfer-form__title">تقديم طلب تحويل عبر شام كاش</h3>
      {success && (
        <div className="transfer-form__success">
          تم تقديم الطلب بنجاح! حالة الطلب: قيد التدقيق.
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

        {/* مكون رفع صورة الهوية - بدون uploadPath، نستخدم onUploadComplete الذي يعيد base64 */}
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

