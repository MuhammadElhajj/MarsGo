import TransferForm from "../../../components/UserComponents/TransferForm/TransferForm";
import OrdersList from "../../../components/UserComponents/OrdersList/OrdersList";
import PaymentButton from "../../../components/GeneralComponents/PaymentButton/PaymentButton";
import "./TransferPage.css";

export default function TransferPage() {
  return (
    <div className="transfer-page" dir="rtl">
      <h2 className="transfer-page__heading">خدمة التحويل عبر شام كاش</h2>
      <TransferForm />
      <OrdersList />
      
      {/* إضافة زر الدفع أسفل القائمة */}
      <div className="payment-button-container">
        <PaymentButton text="💳 ادفع هنا" variant="primary" />
      </div>
    </div>
  );
}