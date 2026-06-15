// src/components/GeneralComponents/ConfirmModal/ConfirmModal.jsx
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import './ConfirmModal.css';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'تأكيد', cancelText = 'إلغاء', variant = 'danger' }) {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="confirm-modal-content">
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <Button onClick={onConfirm} variant={variant}>{confirmText}</Button>
          <Button onClick={onClose} variant="secondary">{cancelText}</Button>
        </div>
      </div>
    </Modal>
  );
}