// src/pages/User/ClansPage/ClanPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import Avatar from '../../../components/GeneralComponents/Avatar/Avatar';
import { 
  FiUsers, FiUserPlus, FiUserMinus, FiSettings, FiMessageCircle, 
  FiShield, FiStar, FiAward, FiZap, FiUser, FiTrash2, FiEdit,
  FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './ClansListPage.css';

// ترتيب المناصب (للترتيب التنازلي)
const ROLE_ORDER = {
  owner: 0,
  general: 1,
  deputy: 2,
  moderator: 3,
  member: 4,
};

// أسماء المناصب المعروضة
const ROLE_LABELS = {
  owner: '👑 المالك',
  general: '⚔️ الجينرال',
  deputy: '🛡️ العميد',
  moderator: '🔰 المشرف',
  member: '👤 عضو',
};

// ألوان المناصب
const ROLE_COLORS = {
  owner: '#f59e0b',   // ذهبي
  general: '#94a3b8', // فضي
  deputy: '#cd7f32',  // برونزي
  moderator: '#3b82f6', // أزرق
  member: '#6b7280',  // رمادي
};

export default function ClanPage() {
  const { clanId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { fetchClan, leaveClan } = useAppStore();

  const [clan, setClan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [membersData, setMembersData] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // جلب بيانات الكلان
  useEffect(() => {
    const loadClan = async () => {
      const data = await fetchClan(clanId);
      setClan(data);
      setLoading(false);
    };
    loadClan();
  }, [clanId, fetchClan]);

  // جلب بيانات الأعضاء عند تحميل الكلان
  useEffect(() => {
    const fetchMembersDetails = async () => {
      if (!clan || !clan.members || clan.members.length === 0) {
        setMembersData([]);
        return;
      }

      setLoadingMembers(true);
      try {
        const memberPromises = clan.members.map(async (memberId) => {
          const userSnap = await getDoc(doc(db, 'users', memberId));
          const userData = userSnap.exists() ? userSnap.data() : {};
          // جلب الدور من الـ clan (إذا كان مخزناً كـ memberRoles)
          const role = clan.memberRoles?.[memberId] || 'member';
          return {
            uid: memberId,
            name: userData.name || userData.displayName || 'مستخدم',
            avatar: userData.avatar || userData.photoURL || null,
            role: role,
          };
        });

        const results = await Promise.all(memberPromises);
        // ترتيب الأعضاء حسب المنصب (الأعلى أولاً)
        results.sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);
        setMembersData(results);
      } catch (err) {
        console.error('خطأ في جلب بيانات الأعضاء:', err);
        // عرض الأعضاء بـ UID فقط في حالة الخطأ
        const fallback = clan.members.map(uid => ({
          uid,
          name: uid.slice(0, 8),
          avatar: null,
          role: clan.memberRoles?.[uid] || 'member',
        }));
        setMembersData(fallback);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembersDetails();
  }, [clan]);

  // التحقق من صلاحيات المستخدم الحالي
  const currentUserRole = clan?.memberRoles?.[userData?.uid] || 'member';
  const isOwner = currentUserRole === 'owner';
  const isGeneral = currentUserRole === 'general';
  const isDeputy = currentUserRole === 'deputy';
  const isModerator = currentUserRole === 'moderator';
  const isMember = clan?.members?.includes(userData?.uid) || false;
  const canManage = isOwner || isGeneral || isDeputy;

  // دالة تغيير دور العضو (للمالك فقط)
  const assignRole = async (targetUid, newRole) => {
    if (!isOwner) {
      toast.error('المالك فقط يمكنه تعيين المناصب');
      return;
    }
    if (targetUid === userData.uid) {
      toast.error('لا يمكنك تغيير دورك بنفسك');
      return;
    }

    // التحقق من عدد المناصب المتاحة
    const currentRoles = membersData.map(m => m.role);
    const generalCount = currentRoles.filter(r => r === 'general').length;
    const deputyCount = currentRoles.filter(r => r === 'deputy').length;
    const moderatorCount = currentRoles.filter(r => r === 'moderator').length;

    if (newRole === 'general' && generalCount >= 1) {
      toast.error('يوجد جينرال واحد فقط في الكلان');
      return;
    }
    if (newRole === 'deputy' && deputyCount >= 1) {
      toast.error('يوجد عميد واحد فقط في الكلان');
      return;
    }
    if (newRole === 'moderator' && moderatorCount >= 3) {
      toast.error('الحد الأقصى للمشرفين هو 3');
      return;
    }

    setActionLoading(targetUid);
    try {
      const clanRef = doc(db, 'clans', clanId);
      // تحديث دور العضو في الـ memberRoles
      await updateDoc(clanRef, {
        [`memberRoles.${targetUid}`]: newRole,
        updatedAt: new Date(),
      });

      // تحديث الحالة المحلية
      setMembersData(prev =>
        prev.map(m =>
          m.uid === targetUid ? { ...m, role: newRole } : m
        ).sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role])
      );
      setClan(prev => ({
        ...prev,
        memberRoles: { ...prev.memberRoles, [targetUid]: newRole },
      }));

      toast.success(`✅ تم تغيير منصب العضو بنجاح`);
    } catch (err) {
      console.error(err);
      toast.error('فشل تغيير المنصب');
    } finally {
      setActionLoading(null);
    }
  };

  // دالة طرد العضو (للمالك والجينرال والعميد)
  const kickMember = async (targetUid) => {
    if (!canManage || targetUid === userData.uid) return;
    if (!window.confirm('هل تريد طرد هذا العضو من الكلان؟')) return;

    setActionLoading(targetUid);
    try {
      const clanRef = doc(db, 'clans', clanId);
      await updateDoc(clanRef, {
        members: arrayRemove(targetUid),
        [`memberRoles.${targetUid}`]: null, // حذف الدور
        memberCount: (clan.memberCount || 1) - 1,
        updatedAt: new Date(),
      });

      // تحديث الحالة المحلية
      setMembersData(prev => prev.filter(m => m.uid !== targetUid));
      setClan(prev => ({
        ...prev,
        members: prev.members.filter(id => id !== targetUid),
        memberCount: (prev.memberCount || 1) - 1,
      }));
      toast.success('✅ تم طرد العضو بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('فشل طرد العضو');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async () => {
    if (isOwner) {
      toast.error('لا يمكن للمالك مغادرة الكلان. قم بنقل الملكية أولاً أو حذف الكلان.');
      return;
    }
    if (window.confirm('هل أنت متأكد من مغادرة الكلان؟')) {
      const success = await leaveClan(clanId);
      if (success) navigate('/clans');
    }
  };

  const handleChat = () => {
    navigate(`/chat/room/clan_${clanId}`);
  };

  // دالة لحساب عدد الأعضاء حسب الدور
  const getRoleCount = (role) => {
    return membersData.filter(m => m.role === role).length;
  };

  if (loading) {
    return (
      <div className="clans-page-loading">
        <div className="loading-spinner"></div>
        <p>جاري تحميل الكلان...</p>
      </div>
    );
  }

  if (!clan) {
    return (
      <div className="clans-page">
        <GoBackButton text="رجوع" />
        <div className="empty-state">
          <p>الكلان غير موجود</p>
        </div>
      </div>
    );
  }

  // هل المستخدم عضو؟
  const isCurrentMember = clan.members?.includes(userData?.uid) || false;

  return (
    <div className="clan-page" dir="rtl">
      {/* ===== الهيدر ===== */}
      <div className="clan-page__header">
        <GoBackButton text="رجوع" />
        <div className="clan-page__header-center">
          <h1 className="clan-page__title">
            {clan.name}
            {clan.tag && <span className="clan-page__tag">#{clan.tag}</span>}
          </h1>
          <div className="clan-page__game-badge">
            {clan.game && <span>🎮 {clan.game}</span>}
          </div>
        </div>
        {isOwner && (
          <Button onClick={() => navigate(`/clan/${clanId}/settings`)} variant="secondary" size="sm">
            <FiSettings /> إدارة
          </Button>
        )}
      </div>

      {/* ===== الغلاف ===== */}
      <div className="clan-page__cover">
        {clan.coverImageUrl ? (
          <img src={clan.coverImageUrl} alt={clan.name} />
        ) : (
          <div className="clan-page__cover-placeholder">
            <FiUsers size={60} />
          </div>
        )}
        {/* شعار الكلان فوق الغلاف */}
        <div className="clan-page__avatar-overlay">
          {clan.avatarImageUrl ? (
            <img src={clan.avatarImageUrl} alt={clan.name} className="clan-page__avatar" />
          ) : (
            <div className="clan-page__avatar-placeholder">
              {clan.name?.charAt(0) || 'C'}
            </div>
          )}
        </div>
      </div>

      {/* ===== معلومات الكلان ===== */}
      <div className="clan-page__info">
        <div className="clan-page__stats">
          <span className="clan-page__stat">
            <FiUsers /> {clan.memberCount || 0} عضو
          </span>
          <span className="clan-page__stat">
            <FiShield /> {clan.type === 'public' ? 'عام' : 'خاص'}
          </span>
          <span className="clan-page__stat">
            <FiUser /> الحد الأقصى: {clan.maxMembers || 50}
          </span>
        </div>
        <p className="clan-page__description">{clan.description || 'لا يوجد وصف'}</p>
        {clan.requirements && (
          <div className="clan-page__requirements">
            <strong>📋 متطلبات الانضمام:</strong> {clan.requirements}
          </div>
        )}
      </div>

      {/* ===== أزرار الإجراءات ===== */}
      <div className="clan-page__actions">
        {isCurrentMember ? (
          <>
            <Button onClick={handleChat} variant="primary" className="clan-page__action-btn">
              <FiMessageCircle /> دردشة الكلان
            </Button>
            {!isOwner && (
              <Button onClick={handleLeave} variant="danger" className="clan-page__action-btn">
                <FiUserMinus /> مغادرة
              </Button>
            )}
          </>
        ) : (
          <Button onClick={() => joinClan(clanId)} variant="primary" className="clan-page__action-btn">
            <FiUserPlus /> انضم إلى الكلان
          </Button>
        )}
      </div>

      {/* ===== إحصائيات المناصب ===== */}
      <div className="clan-page__roles-stats">
        <div className="role-stat">
          <span className="role-dot" style={{ background: ROLE_COLORS.owner }}></span>
          المالك: {getRoleCount('owner')}
        </div>
        <div className="role-stat">
          <span className="role-dot" style={{ background: ROLE_COLORS.general }}></span>
          الجينرال: {getRoleCount('general')}/1
        </div>
        <div className="role-stat">
          <span className="role-dot" style={{ background: ROLE_COLORS.deputy }}></span>
          العميد: {getRoleCount('deputy')}/1
        </div>
        <div className="role-stat">
          <span className="role-dot" style={{ background: ROLE_COLORS.moderator }}></span>
          المشرفين: {getRoleCount('moderator')}/3
        </div>
        <div className="role-stat">
          <span className="role-dot" style={{ background: ROLE_COLORS.member }}></span>
          الأعضاء: {getRoleCount('member')}
        </div>
      </div>

      {/* ===== قائمة الأعضاء ===== */}
      <div className="clan-page__members">
        <h3 className="clan-page__members-title">
          <FiUsers /> الأعضاء ({clan.memberCount || 0})
        </h3>
        {loadingMembers ? (
          <div className="members-loading">جاري تحميل الأعضاء...</div>
        ) : (
          <div className="members-list">
            {membersData.map((member) => {
              const isCurrentUser = member.uid === userData?.uid;
              const role = member.role || 'member';
              const roleLabel = ROLE_LABELS[role] || 'عضو';
              const roleColor = ROLE_COLORS[role] || '#6b7280';

              return (
                <div key={member.uid} className={`member-item member-item--${role}`}>
                  <div className="member-item__avatar">
                    <Avatar src={member.avatar} name={member.name} size="md" />
                    <span className="member-item__status-dot" style={{ background: roleColor }}></span>
                  </div>
                  <div className="member-item__info">
                    <div className="member-item__name">
                      {member.name}
                      {isCurrentUser && <span className="member-item__you-badge"> (أنت)</span>}
                    </div>
                    <div className="member-item__role" style={{ color: roleColor }}>
                      {roleLabel}
                    </div>
                  </div>
                  <div className="member-item__actions">
                    {/* أزرار الإدارة (للمالك فقط أو للجينرال/العميد على الأعضاء العاديين) */}
                    {isOwner && !isCurrentUser && (
                      <>
                        {/* تعيين مناصب */}
                        <select
                          value={role}
                          onChange={(e) => assignRole(member.uid, e.target.value)}
                          disabled={actionLoading === member.uid}
                          className="role-select"
                        >
                          <option value="member">👤 عضو</option>
                          <option value="moderator" disabled={getRoleCount('moderator') >= 3}>🔰 مشرف</option>
                          <option value="deputy" disabled={getRoleCount('deputy') >= 1}>🛡️ عميد</option>
                          <option value="general" disabled={getRoleCount('general') >= 1}>⚔️ جينرال</option>
                          <option value="owner" disabled>👑 مالك</option>
                        </select>
                        <Button
                          onClick={() => kickMember(member.uid)}
                          variant="danger"
                          size="sm"
                          disabled={actionLoading === member.uid}
                          className="kick-btn"
                        >
                          <FiUserMinus />
                        </Button>
                      </>
                    )}
                    {(isGeneral || isDeputy) && !isCurrentUser && role === 'member' && (
                      <Button
                        onClick={() => assignRole(member.uid, 'moderator')}
                        variant="primary"
                        size="sm"
                        disabled={getRoleCount('moderator') >= 3 || actionLoading === member.uid}
                      >
                        تعيين مشرف
                      </Button>
                    )}
                    {(isGeneral || isDeputy) && !isCurrentUser && role !== 'member' && role !== 'owner' && (
                      <Button
                        onClick={() => assignRole(member.uid, 'member')}
                        variant="danger"
                        size="sm"
                        disabled={actionLoading === member.uid}
                      >
                        عزل
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}