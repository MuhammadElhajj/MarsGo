// src/pages/Admin/AdminTopUpSettings/AdminTopUpSettings.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import ImageUpload from '../../../components/GeneralComponents/ImageUpload/ImageUpload';
import Modal from '../../../components/GeneralComponents/Modal/Modal';
import ConfirmModal from '../../../components/GeneralComponents/ConfirmModal/ConfirmModal';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import { FiX, FiPlus, FiTrash2, FiCheck, FiList, FiEdit } from 'react-icons/fi';
import './AdminTopUpSettings.css';

// نموذج إضافة/تعديل حساب (مودال منفصل)
function AccountFormModal({ isOpen, onClose, onSave, initialData = null, method }) {
  const [formData, setFormData] = useState({
    accountName: '',
    accountNumber: '',
    address: '',
    network: 'TRC20',
    displayName: '',
    logoImage: '',
    qrCode: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        accountName: '',
        accountNumber: '',
        address: '',
        network: 'TRC20',
        displayName: '',
        logoImage: '',
        qrCode: '',
      });
    }
  }, [initialData, isOpen]);

  const isUSDT = method === 'usdt';
  const isShamOrSirel = method === 'shamCash' || method === 'siretelCash';

  const handleSubmit = () => {
    if (isUSDT && !formData.address) return alert('يرجى إدخال عنوان المحفظة');
    if (isShamOrSirel && (!formData.accountName || !formData.accountNumber)) return alert('يرجى إدخال اسم المستفيد ورقم الحساب');
    onSave(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? ' تعديل الحساب' : ' إضافة حساب جديد'}>
      <div className="account-form-modal">
        {isUSDT && (
          <>
            <Input label="عنوان المحفظة" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" />
            <div className="form-field">
              <label>الشبكة</label>
              <select value={formData.network} onChange={e => setFormData({...formData, network: e.target.value})}>
                <option value="TRC20">TRC20 (Tron)</option>
                <option value="BEP20">BEP20 (BSC)</option>
                <option value="ERC20">ERC20 (Ethereum)</option>
              </select>
            </div>
          </>
        )}
        {isShamOrSirel && (
          <>
            <Input label="اسم المستفيد" value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} />
            <Input label="رقم الحساب/الهاتف" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} />
          </>
        )}
        <Input label="اسم العرض (اختياري)" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
        <div className="image-field">
          <label>شعار مخصص (اختياري)</label>
          <ImageUpload onUploadComplete={(url) => setFormData({...formData, logoImage: url})} maxSizeMB={0.5} storagePath={`topup/${method}/logos`} />
          {formData.logoImage && <img src={formData.logoImage} alt="شعار" className="preview-thumb" />}
        </div>
        <div className="image-field">
          <label>صورة QR (اختياري)</label>
          <ImageUpload onUploadComplete={(url) => setFormData({...formData, qrCode: url})} maxSizeMB={0.5} storagePath={`topup/${method}/qrs`} />
          {formData.qrCode && <img src={formData.qrCode} alt="QR" className="preview-thumb" />}
        </div>
        <div className="form-actions">
          <Button onClick={handleSubmit}> حفظ</Button>
          <Button variant="secondary" onClick={onClose}> إلغاء</Button>
        </div>
      </div>
    </Modal>
  );
}

// مودال عرض سجل الحسابات (يظهر عند الضغط على زر "سجل الحسابات")
function HistoryModal({ isOpen, onClose, method, accounts, onToggleActive, onDelete, onEdit }) {
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, accountId: null, title: '', message: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, accountId: null });

  const openConfirm = (accountId, title, message) => {
    setConfirmModal({ isOpen: true, accountId, title, message });
  };

  const handleConfirm = () => {
    if (confirmModal.accountId) {
      onToggleActive(confirmModal.accountId);
    }
    setConfirmModal({ isOpen: false, accountId: null });
  };

  const openDeleteConfirm = (accountId) => {
    setDeleteModal({ isOpen: true, accountId });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.accountId) {
      onDelete(deleteModal.accountId);
    }
    setDeleteModal({ isOpen: false, accountId: null });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={` سجل حسابات ${method === 'usdt' ? 'USDT' : method === 'shamCash' ? 'شام كاش' : 'سيريتل كاش'}`} maxWidth="700px">
        <div className="history-modal-content">
          {accounts.length === 0 ? (
            <p className="empty-history">لا توجد حسابات مسجلة لهذه الطريقة بعد.</p>
          ) : (
            <div className="history-list">
              {accounts.map(acc => (
                <div key={acc.id} className={`history-item ${acc.isActive ? 'active' : 'inactive'}`}>
                  <div className="history-item-info">
                    {acc.logoImage && (
                      <div className="history-logo">
                        <img src={acc.logoImage} alt="شعار" />
                      </div>
                    )}
                    <div className="history-details">
                      {method === 'usdt' && <><strong>العنوان:</strong> <code>{acc.address}</code><br /></>}
                      {method === 'usdt' && acc.network && <><strong>الشبكة:</strong> {acc.network}<br /></>}
                      {(method === 'shamCash' || method === 'siretelCash') && (
                        <>
                          <strong>المستفيد:</strong> {acc.accountName}<br />
                          <strong>رقم الحساب:</strong> {acc.accountNumber}<br />
                        </>
                      )}
                      {acc.displayName && <><strong>الاسم المعروض:</strong> {acc.displayName}<br /></>}
                      <strong>الحالة:</strong> {acc.isActive ? <span className="active-badge">نشط</span> : <span className="inactive-badge">غير نشط</span>}
                      {acc.qrCode && (
                        <div className="history-qr">
                          <img src={acc.qrCode} alt="QR" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="history-actions">
                    {!acc.isActive && (
                      <button onClick={() => openConfirm(acc.id, 'تفعيل الحساب', `هل تريد تفعيل هذا الحساب؟${accounts.some(a => a.isActive) ? ' سيتم تعطيل الحساب النشط الحالي تلقائياً.' : ''}`)} className="btn-activate">
                        <FiCheck /> تفعيل
                      </button>
                    )}
                    <button onClick={() => { onEdit(acc); onClose(); }} className="btn-edit">
                      <FiEdit /> تعديل
                    </button>
                    <button onClick={() => openDeleteConfirm(acc.id)} className="btn-delete">
                      <FiTrash2 /> حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="modal-footer">
            <Button variant="secondary" onClick={onClose}> إغلاق</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, accountId: null })}
        onConfirm={handleConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="نعم، تفعيل"
        cancelText="إلغاء"
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, accountId: null })}
        onConfirm={handleDeleteConfirm}
        title="حذف الحساب"
        message="هل أنت متأكد من حذف هذا الحساب نهائياً؟ لا يمكن التراجع."
        confirmText="نعم، حذف"
        cancelText="إلغاء"
        variant="danger"
      />
    </>
  );
}

export default function AdminTopUpSettings() {
  const navigate = useNavigate();
  const topUpSettings = useAppStore((state) => state.topUpSettings);
  const updateTopUpSettings = useAppStore((state) => state.updateTopUpSettings);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // State for modals
  const [historyModal, setHistoryModal] = useState({ isOpen: false, method: null });
  const [accountModal, setAccountModal] = useState({ isOpen: false, method: null, editingAccount: null });

  // تحويل البيانات القديمة إلى هيكل الحسابات المتعددة
  const migrateOldData = (oldData) => {
    if (!oldData) return null;
    const migrated = {};
    const methods = ['usdt', 'shamCash', 'siretelCash'];
    methods.forEach(m => {
      if (oldData[m] && !oldData[m].accounts) {
        const oldAccount = oldData[m];
        const accountId = Date.now() + '-' + m;
        migrated[m] = {
          enabled: oldAccount.enabled,
          accounts: [{
            id: accountId,
            isActive: true,
            createdAt: new Date().toISOString(),
            ...oldAccount,
          }],
        };
      } else if (oldData[m] && oldData[m].accounts) {
        migrated[m] = oldData[m];
      } else {
        migrated[m] = { enabled: true, accounts: [] };
      }
    });
    return { ...oldData, ...migrated };
  };

  useEffect(() => {
    if (topUpSettings) {
      const migrated = migrateOldData(topUpSettings);
      setForm({
        usdt: migrated.usdt,
        shamCash: migrated.shamCash,
        siretelCash: migrated.siretelCash,
        minDeposit: migrated.minDeposit ?? 3,
        supportWhatsApp: migrated.supportWhatsApp || '963939454690',
      });
      setLoading(false);
    } else if (!topUpSettings && !form) {
      setForm({
        usdt: { enabled: true, accounts: [] },
        shamCash: { enabled: true, accounts: [] },
        siretelCash: { enabled: true, accounts: [] },
        minDeposit: 3,
        supportWhatsApp: '963939454690',
      });
      setLoading(false);
    }
  }, [topUpSettings]);

  const handleToggleMethodEnabled = (method, enabled) => {
    setForm(prev => ({ ...prev, [method]: { ...prev[method], enabled } }));
  };

  const handleAddAccount = (method, accountData) => {
    const newAccount = {
      id: Date.now() + '-' + Math.random(),
      isActive: false,
      createdAt: new Date().toISOString(),
      ...accountData,
    };
    setForm(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        accounts: [...prev[method].accounts, newAccount],
      },
    }));
  };

  const handleUpdateAccount = (method, accountId, updatedData) => {
    setForm(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        accounts: prev[method].accounts.map(acc =>
          acc.id === accountId ? { ...acc, ...updatedData } : acc
        ),
      },
    }));
  };

  const handleToggleAccountActive = (method, accountId) => {
    setForm(prev => {
      const accounts = prev[method].accounts;
      const activeAccount = accounts.find(acc => acc.isActive === true);
      if (activeAccount && activeAccount.id !== accountId) {
        const updatedAccounts = accounts.map(acc => ({
          ...acc,
          isActive: acc.id === accountId ? true : false,
        }));
        return { ...prev, [method]: { ...prev[method], accounts: updatedAccounts } };
      } else {
        const updatedAccounts = accounts.map(acc => ({
          ...acc,
          isActive: acc.id === accountId ? !acc.isActive : acc.isActive,
        }));
        return { ...prev, [method]: { ...prev[method], accounts: updatedAccounts } };
      }
    });
  };

  const handleDeleteAccount = (method, accountId) => {
    setForm(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        accounts: prev[method].accounts.filter(acc => acc.id !== accountId),
      },
    }));
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    await updateTopUpSettings(form);
    setSaving(false);
  };

  if (loading) return <div className="admin-topup-loading"> جاري تحميل الإعدادات...</div>;
  if (!form) return <div className="admin-topup-loading"> لا يمكن تهيئة النموذج، يرجى تحديث الصفحة.</div>;

  const openHistory = (method) => setHistoryModal({ isOpen: true, method });
  const openAddAccount = (method) => setAccountModal({ isOpen: true, method, editingAccount: null });
  const openEditAccount = (method, account) => setAccountModal({ isOpen: true, method, editingAccount: account });

  return (
    <div className="admin-topup-settings" dir="rtl">
      {/* زر الرجوع */}
      <div className="top-bar">
        <GoBackButton text="رجوع إلى لوحة الإدارة" />
      </div>

      <div className="page-header">
        <h2> إعدادات شحن الرصيد</h2>
        <p className="page-desc">إدارة حسابات الاستقبال لكل طريقة دفع (حسابات متعددة، تفعيل واحد فقط).</p>
      </div>

      {['usdt', 'shamCash', 'siretelCash'].map(method => {
        const methodData = form[method];
        const methodTitle = method === 'usdt' ? 'USDT (تيثر)' : method === 'shamCash' ? 'شام كاش' : 'سيريتل كاش';
        const methodIcon = method === 'usdt' ? '🇺🇸' : method === 'shamCash' ? '' : '';
        const activeCount = methodData.accounts.filter(acc => acc.isActive).length;
        return (
          <div key={method} className="method-card">
            <div className="method-card__header">
              <div className="method-title">
                <span className="method-icon">{methodIcon}</span>
                <h3>{methodTitle}</h3>
                {activeCount > 0 && <span className="active-count-badge">✓ حساب نشط</span>}
              </div>
              <div className="method-actions">
                <button className="history-btn" onClick={() => openHistory(method)}>
                  <FiList /> سجل الحسابات ({methodData.accounts.length})
                </button>
                <label className="toggle-switch">
                  <input type="checkbox" checked={methodData.enabled} onChange={(e) => handleToggleMethodEnabled(method, e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            <div className="method-card__body">
              {/* عرض الحساب النشط (إن وجد) */}
              {methodData.accounts.filter(acc => acc.isActive).map(acc => (
                <div key={acc.id} className="active-account-preview">
                  <div className="preview-logo">
                    {acc.logoImage ? <img src={acc.logoImage} alt="شعار" /> : <span className="preview-icon">{methodIcon}</span>}
                  </div>
                  <div className="preview-info">
                    {method === 'usdt' && <><strong>العنوان:</strong> {acc.address}<br /></>}
                    {(method === 'shamCash' || method === 'siretelCash') && (
                      <><strong>{acc.accountName}</strong> - {acc.accountNumber}</>
                    )}
                    {acc.displayName && <div className="preview-display-name">{acc.displayName}</div>}
                  </div>
                  <button className="edit-preview-btn" onClick={() => openEditAccount(method, acc)}>
                    <FiEdit /> تعديل
                  </button>
                </div>
              ))}
              {methodData.accounts.filter(acc => acc.isActive).length === 0 && (
                <div className="no-active-account">
                  <p> لا يوجد حساب نشط حالياً. أضف حساباً جديداً أو فعّل أحد الحسابات من السجل.</p>
                  <button className="add-account-btn-inline" onClick={() => openAddAccount(method)}>
                    <FiPlus /> إضافة حساب جديد
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="general-settings">
        <h3> الإعدادات العامة</h3>
        <div className="general-row">
          <Input label="الحد الأدنى للإيداع (دولار أمريكي)" type="number" step="1" min="1" value={form.minDeposit} onChange={e => setForm(prev => ({ ...prev, minDeposit: parseInt(e.target.value) || 3 }))} />
          <Input label="رقم واتساب الدعم" value={form.supportWhatsApp} onChange={e => setForm(prev => ({ ...prev, supportWhatsApp: e.target.value.replace(/\D/g, '') }))} placeholder="963939454690" />
        </div>
      </div>

      <div className="form-actions">
        <Button onClick={handleSave} disabled={saving} variant="primary" className="save-button">
          {saving ? ' جاري الحفظ...' : ' حفظ جميع الإعدادات'}
        </Button>
      </div>

      {/* مودال سجل الحسابات */}
      <HistoryModal
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal({ isOpen: false, method: null })}
        method={historyModal.method}
        accounts={historyModal.method ? form[historyModal.method]?.accounts || [] : []}
        onToggleActive={(accountId) => handleToggleAccountActive(historyModal.method, accountId)}
        onDelete={(accountId) => handleDeleteAccount(historyModal.method, accountId)}
        onEdit={(account) => openEditAccount(historyModal.method, account)}
      />

      {/* مودال إضافة/تعديل حساب */}
      <AccountFormModal
        isOpen={accountModal.isOpen}
        onClose={() => setAccountModal({ isOpen: false, method: null, editingAccount: null })}
        onSave={(data) => {
          if (accountModal.editingAccount) {
            handleUpdateAccount(accountModal.method, accountModal.editingAccount.id, data);
          } else {
            handleAddAccount(accountModal.method, data);
          }
          setAccountModal({ isOpen: false, method: null, editingAccount: null });
        }}
        initialData={accountModal.editingAccount}
        method={accountModal.method}
      />
    </div>
  );
}