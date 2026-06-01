import TransferForm from "../../../components/UserComponents/TransferForm/TransferForm";
import OrdersList from "../../../components/UserComponents/OrdersList/OrdersList";
import PaymentButton from "../../../components/GeneralComponents/PaymentButton/PaymentButton";
import "./TransferPage.css";
import HowItWorks from "../../../components/UserComponents/HowItWorks/HowItWorks"; // ✅ استيراد المكون

export default function TransferPage() {
  return (
    <div className="transfer-page" dir="rtl">
      <h2 className="transfer-page__heading">خدمة التحويل عبر شام كاش</h2>
             <HowItWorks page="transfer" /> 
      <TransferForm />
      <OrdersList />
    
    </div>
  );
}