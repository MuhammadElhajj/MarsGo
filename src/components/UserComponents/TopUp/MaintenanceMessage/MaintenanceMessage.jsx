
// src/components/UserComponents/TopUp/MaintenanceMessage.jsx
import "./MaintenanceMessage.css";
export default function MaintenanceMessage({ message, supportWhatsApp }) {
  return (
    <div className="maintenance-message">
      <div className="maintenance-icon">🚧</div>
      <h3>خدمة شحن الرصيد في صيانة</h3>
      <p>{message}</p>
      <a
        href={`https://wa.me/${supportWhatsApp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-support-btn"
      >
        📱 تواصل عبر واتساب للدعم
      </a>
    </div>
  );
}