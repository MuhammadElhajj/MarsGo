import { useState } from 'react';
import { useGames } from '../../context/GamesContext';
import Button from '../../components/GeneralComponents/Button/Button';
import Input from '../../components/GeneralComponents/Input/Input';
import ImageUpload from '../../components/GeneralComponents/ImageUpload/ImageUpload';
import './AdminGames.css';

export default function AdminGames() {
  const {
    games,
    loading,
    fetchGames,
    fetchPackages,
    addGame,
    updateGame,
    deleteGame,
    addPackage,
    updatePackage,
    deletePackage,
  } = useGames();

  const [selectedGame, setSelectedGame] = useState(null);
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formGame, setFormGame] = useState({
    name: '',
    imageBase64: '',
    note: '',
    isAvailable: true,
    unavailableReason: '',
    order: 0,
  });
  const [formPackage, setFormPackage] = useState({
    name: '',
    price: '',
    currency: 'USD',
    discount: 0,
    type: 'normal',
    order: 0,
    imageBase64: '',   // ✅ جديد
    note: '',          // ✅ جديد
  });

  const handleSelectGame = async (game) => {
    setSelectedGame(game);
    setPackagesLoading(true);
    const pkgs = await fetchPackages(game.id);
    setPackages(pkgs);
    setPackagesLoading(false);
  };

  const openGameModal = (game = null) => {
    if (game) {
      setEditingGame(game);
      setFormGame({
        name: game.name || '',
        imageBase64: game.imageBase64 || '',
        note: game.note || '',
        isAvailable: game.isAvailable !== false,
        unavailableReason: game.unavailableReason || '',
        order: game.order || 0,
      });
    } else {
      setEditingGame(null);
      setFormGame({
        name: '',
        imageBase64: '',
        note: '',
        isAvailable: true,
        unavailableReason: '',
        order: games.length,
      });
    }
    setShowGameModal(true);
  };

  const handleGameSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: formGame.name,
      imageBase64: formGame.imageBase64,
      note: formGame.note,
      isAvailable: formGame.isAvailable,
      unavailableReason: formGame.unavailableReason,
      order: Number(formGame.order),
      updatedAt: new Date(),
    };
    if (editingGame) {
      await updateGame(editingGame.id, data);
      if (selectedGame?.id === editingGame.id) {
        const updatedGame = { ...selectedGame, ...data };
        setSelectedGame(updatedGame);
        await handleSelectGame(updatedGame);
      }
    } else {
      data.createdAt = new Date();
      await addGame(data);
    }
    setShowGameModal(false);
    await fetchGames();
  };

  const handleDeleteGame = async (game) => {
    if (window.confirm(`حذف لعبة "${game.name}" وجميع باقاتها؟ لا يمكن التراجع.`)) {
      await deleteGame(game.id);
      if (selectedGame?.id === game.id) {
        setSelectedGame(null);
        setPackages([]);
      }
    }
  };

  const openPackageModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormPackage({
        name: pkg.name || '',
        price: pkg.price || '',
        currency: pkg.currency || 'USD',
        discount: pkg.discount || 0,
        type: pkg.type || 'normal',
        order: pkg.order || 0,
        imageBase64: pkg.imageBase64 || '',   // ✅
        note: pkg.note || '',                 // ✅
      });
    } else {
      setEditingPackage(null);
      setFormPackage({
        name: '',
        price: '',
        currency: 'USD',
        discount: 0,
        type: 'normal',
        order: packages.length,
        imageBase64: '',
        note: '',
      });
    }
    setShowPackageModal(true);
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGame) return;
    const data = {
      name: formPackage.name,
      price: Number(formPackage.price),
      currency: formPackage.currency,
      discount: Number(formPackage.discount),
      type: formPackage.type,
      order: Number(formPackage.order),
      imageBase64: formPackage.imageBase64,   // ✅
      note: formPackage.note,                 // ✅
    };
    if (editingPackage) {
      await updatePackage(selectedGame.id, editingPackage.id, data);
    } else {
      await addPackage(selectedGame.id, data);
    }
    setShowPackageModal(false);
    const pkgs = await fetchPackages(selectedGame.id);
    setPackages(pkgs);
  };

  const handleDeletePackage = async (pkg) => {
    if (window.confirm(`حذف باقة "${pkg.name}"؟`)) {
      await deletePackage(selectedGame.id, pkg.id);
      const pkgs = await fetchPackages(selectedGame.id);
      setPackages(pkgs);
    }
  };

  if (loading) return <div className="admin-loading">جاري تحميل الألعاب...</div>;

  return (
    <div className="admin-games" dir="rtl">
      <div className="admin-games__header">
        <h2>🎮 إدارة الألعاب والباقات</h2>
        <Button onClick={() => openGameModal()}>➕ إضافة لعبة جديدة</Button>
      </div>

      <div className="admin-games__content">
        {/* قائمة الألعاب */}
        <div className="admin-games__games-list">
          <h3>قائمة الألعاب</h3>
          {games.length === 0 ? (
            <p>لا توجد ألعاب مضافة بعد</p>
          ) : (
            <div className="games-table-wrapper">
              <table className="games-table">
                <thead>
                  <tr>
                    <th>الصورة</th>
                    <th>الاسم</th>
                    <th>الحالة</th>
                    <th>الترتيب</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map(game => (
                    <tr key={game.id} className={selectedGame?.id === game.id ? 'selected-row' : ''}>
                      <td>
                        {game.imageBase64 ? (
                          <img src={game.imageBase64} alt={game.name} className="game-thumb" />
                        ) : (
                          <span>🎮</span>
                        )}
                      </td>
                      <td>{game.name}</td>
                      <td>
                        <span className={`status-badge ${game.isAvailable ? 'available' : 'unavailable'}`}>
                          {game.isAvailable ? 'متاحة' : 'غير متاحة'}
                        </span>
                      </td>
                      <td>{game.order}</td>
                      <td>
                        <Button onClick={() => openGameModal(game)} variant="primary">تعديل</Button>
                        <Button onClick={() => handleDeleteGame(game)} variant="danger">حذف</Button>
                        <Button onClick={() => handleSelectGame(game)} variant="secondary">
                          {selectedGame?.id === game.id ? 'مختارة' : 'إدارة الباقات'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* باقات اللعبة المختارة */}
        {selectedGame && (
          <div className="admin-games__packages">
            <div className="packages-header">
              <h3>باقات لعبة: {selectedGame.name}</h3>
              <Button onClick={() => openPackageModal()}>➕ إضافة باقة</Button>
            </div>
            {packagesLoading ? (
              <p>جاري تحميل الباقات...</p>
            ) : packages.length === 0 ? (
              <p>لا توجد باقات لهذه اللعبة</p>
            ) : (
              <div className="packages-table-wrapper">
                <table className="packages-table">
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>السعر</th>
                      <th>العملة</th>
                      <th>الخصم %</th>
                      <th>النوع</th>
                      <th>الترتيب</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map(pkg => (
                      <tr key={pkg.id}>
                        <td>{pkg.name}</td>
                        <td>{pkg.price}</td>
                        <td>{pkg.currency}</td>
                        <td>{pkg.discount || 0}%</td>
                        <td>
                          {pkg.type === 'normal' && 'عادي'}
                          {pkg.type === 'royalPass' && 'رويال باس'}
                          {pkg.type === 'direct' && 'مباشر'}
                        </td>
                        <td>{pkg.order}</td>
                        <td>
                          <Button onClick={() => openPackageModal(pkg)} variant="primary">تعديل</Button>
                          <Button onClick={() => handleDeletePackage(pkg)} variant="danger">حذف</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* مودال إضافة/تعديل لعبة */}
      {showGameModal && (
        <div className="modal-overlay" onClick={() => setShowGameModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingGame ? 'تعديل لعبة' : 'إضافة لعبة جديدة'}</h3>
              <button className="close-btn" onClick={() => setShowGameModal(false)}>✕</button>
            </div>
            <form onSubmit={handleGameSubmit} className="modal-form">
              <Input label="اسم اللعبة *" value={formGame.name} onChange={e => setFormGame({...formGame, name: e.target.value})} required />
              <div className="form-field">
                <label>صورة اللعبة (اختياري)</label>
                <ImageUpload
                  onUploadComplete={(base64) => setFormGame({...formGame, imageBase64: base64})}
                  maxSizeMB={0.5}
                />
                {formGame.imageBase64 && <img src={formGame.imageBase64} alt="معاينة" className="preview-img" />}
              </div>
              <Input label="ملاحظة (تظهر تحت الاسم)" value={formGame.note} onChange={e => setFormGame({...formGame, note: e.target.value})} />
              <div className="form-field checkbox">
                <label>
                  <input type="checkbox" checked={formGame.isAvailable} onChange={e => setFormGame({...formGame, isAvailable: e.target.checked})} />
                  اللعبة متاحة
                </label>
              </div>
              {!formGame.isAvailable && (
                <Input label="سبب عدم التوفر" value={formGame.unavailableReason} onChange={e => setFormGame({...formGame, unavailableReason: e.target.value})} />
              )}
              <Input label="ترتيب الظهور (رقم)" type="number" value={formGame.order} onChange={e => setFormGame({...formGame, order: parseInt(e.target.value) || 0})} />
              <div className="modal-actions">
                <Button type="submit">حفظ</Button>
                <Button type="button" variant="danger" onClick={() => setShowGameModal(false)}>إلغاء</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال إضافة/تعديل باقة */}
      {showPackageModal && (
        <div className="modal-overlay" onClick={() => setShowPackageModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPackage ? 'تعديل باقة' : 'إضافة باقة جديدة'}</h3>
              <button className="close-btn" onClick={() => setShowPackageModal(false)}>✕</button>
            </div>
            <form onSubmit={handlePackageSubmit} className="modal-form">
              <Input label="اسم الباقة *" value={formPackage.name} onChange={e => setFormPackage({...formPackage, name: e.target.value})} required />
              <Input label="السعر *" type="number" step="0.01" value={formPackage.price} onChange={e => setFormPackage({...formPackage, price: e.target.value})} required />

              {/* ✅ حقل صورة الباقة */}
              <div className="form-field">
                <label>صورة الباقة (اختياري)</label>
                <ImageUpload
                  onUploadComplete={(base64) => setFormPackage({...formPackage, imageBase64: base64})}
                  maxSizeMB={0.5}
                />
                {formPackage.imageBase64 && <img src={formPackage.imageBase64} alt="معاينة" className="preview-img" />}
              </div>

              {/* ✅ حقل ملاحظة الباقة */}
              <Input label="ملاحظة (تظهر تحت اسم الباقة)" value={formPackage.note} onChange={e => setFormPackage({...formPackage, note: e.target.value})} />

              <div className="form-field">
                <label>العملة</label>
                <select value={formPackage.currency} onChange={e => setFormPackage({...formPackage, currency: e.target.value})}>
                  <option value="USD">دولار أمريكي ($)</option>
                  <option value="SYP">ليرة سورية (ل.س)</option>
                </select>
              </div>
              <Input label="نسبة الخصم (مثلاً 10 لـ 10%)" type="number" step="0.1" value={formPackage.discount} onChange={e => setFormPackage({...formPackage, discount: e.target.value})} />
              <div className="form-field">
                <label>نوع الباقة</label>
                <select value={formPackage.type} onChange={e => setFormPackage({...formPackage, type: e.target.value})}>
                  <option value="normal">عادي (شدة / ماسة)</option>
                  <option value="royalPass">رويال باس</option>
                  <option value="direct">مباشر (بدون شدات)</option>
                </select>
              </div>
              <Input label="ترتيب الظهور" type="number" value={formPackage.order} onChange={e => setFormPackage({...formPackage, order: parseInt(e.target.value) || 0})} />
              <div className="modal-actions">
                <Button type="submit">حفظ</Button>
                <Button type="button" variant="danger" onClick={() => setShowPackageModal(false)}>إلغاء</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}