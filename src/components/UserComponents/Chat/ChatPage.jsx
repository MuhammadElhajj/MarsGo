// src/components/UserComponents/Chat/ChatPage.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppStore } from '../../../store/store';
import { useShallow } from 'zustand/react/shallow';
import { 
  collection, query, where, orderBy, onSnapshot, getDocs, doc, setDoc, 
  serverTimestamp, updateDoc, increment, getDoc 
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { useNavigate } from 'react-router-dom';
import { FiMessageCircle, FiPlus, FiUsers } from 'react-icons/fi';
import './ChatPage.css';

// عدد العناصر المسموح بها في استعلام `in` هي 10 كحد أقصى
const MAX_IN_QUERY = 10;

export default function ChatPage() {
  const navigate = useNavigate();
  const { user, userData } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      userData: state.userData,
    }))
  );

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState({});
  const uid = user?.uid || userData?.uid || null;

  // استخدام ref لتتبع ما إذا تم إنشاء الغرفة العامة لتجنب التكرار
  const globalRoomCreatedRef = useRef(false);

  // دالة لإنشاء الغرفة العامة (تتم مرة واحدة فقط)
  const ensureGlobalRoom = useCallback(async () => {
    if (!uid || globalRoomCreatedRef.current) return;
    try {
      const q = query(collection(db, 'rooms'), where('type', '==', 'global'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        await setDoc(doc(db, 'rooms', 'global_room'), {
          type: 'global',
          name: 'عالمي',
          members: [],
          lastMessage: 'مرحباً بك في الدردشة العامة',
          lastMessageTime: serverTimestamp(),
          createdAt: serverTimestamp(),
          imageUrl: null,
          unreadCount: {},
        });
        console.log('✅ تم إنشاء الغرفة العامة');
      }
      globalRoomCreatedRef.current = true;
    } catch (error) {
      console.error('خطأ في إنشاء الغرفة العامة:', error);
    }
  }, [uid]);

  // دالة لجلب بيانات المستخدمين دفعة واحدة (مع تجزئة إذا تجاوز العدد 10)
  const fetchUsersData = useCallback(async (userIds) => {
    if (!userIds || userIds.length === 0) return;

    // تصفية المعرفات التي ليست موجودة بالفعل في usersMap
    const newIds = userIds.filter(id => !usersMap[id]);
    if (newIds.length === 0) return;

    try {
      const users = {};
      // تجزئة المعرفات إلى مجموعات بحجم 10
      for (let i = 0; i < newIds.length; i += MAX_IN_QUERY) {
        const chunk = newIds.slice(i, i + MAX_IN_QUERY);
        const q = query(collection(db, 'users'), where('__name__', 'in', chunk));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
          users[doc.id] = doc.data();
        });
      }
      // تحديث usersMap بطريقة دمج (بدلاً من الاستبدال الكامل)
      setUsersMap(prev => ({ ...prev, ...users }));
    } catch (error) {
      console.error('خطأ في جلب بيانات المستخدمين:', error);
    }
  }, [usersMap]);

  // استخراج معرفات المستخدمين الآخرين من الغرف الخاصة
  const otherUserIds = useMemo(() => {
    const ids = new Set();
    rooms.forEach(room => {
      if (room.type === 'private' && room.members) {
        room.members.forEach(memberId => {
          if (memberId !== uid) ids.add(memberId);
        });
      }
    });
    return Array.from(ids);
  }, [rooms, uid]);

  // جلب بيانات المستخدمين الآخرين عند تغير المعرفات
  useEffect(() => {
    if (otherUserIds.length > 0) {
      fetchUsersData(otherUserIds);
    }
  }, [otherUserIds, fetchUsersData]);

  // الاستماع للغرف (خاصة + العامة)
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    // إنشاء الغرفة العامة (مرة واحدة)
    ensureGlobalRoom();

    // استعلام الغرف الخاصة
    const roomsRef = collection(db, 'rooms');
    const privateQuery = query(
      roomsRef,
      where('members', 'array-contains', uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribePrivate = onSnapshot(privateQuery, async (snapshot) => {
      const privateRooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // جلب الغرفة العامة (مرة واحدة فقط، ثم تخزينها محلياً)
      let globalRoom = null;
      try {
        const globalQuery = query(collection(db, 'rooms'), where('type', '==', 'global'));
        const globalSnap = await getDocs(globalQuery);
        if (!globalSnap.empty) {
          globalRoom = { id: globalSnap.docs[0].id, ...globalSnap.docs[0].data() };
        }
      } catch (error) {
        console.error('خطأ في جلب الغرفة العامة:', error);
      }

      // دمج القوائم: الغرفة العامة أولاً ثم الخاصة
      let roomsList = [];
      if (globalRoom) {
        roomsList.push(globalRoom);
      }
      roomsList = [...roomsList, ...privateRooms];

      setRooms(roomsList);
      setLoading(false);
    }, (error) => {
      console.error('خطأ في تحميل الغرف:', error);
      setLoading(false);
    });

    return () => unsubscribePrivate();
  }, [uid, ensureGlobalRoom]);

  const handleRoomClick = (roomId) => {
    navigate(`/chat/room/${roomId}`);
  };

  const handleNewChat = () => {
    alert('سيتم فتح مودال لبدء محادثة جديدة قريباً');
  };

  if (loading) return <div className="chat-page__loading">جاري تحميل المحادثات...</div>;

  return (
    <div className="chat-page">
      <div className="chat-page__header">
        <div className="chat-page__header-left">
          <div className="chat-page__header-avatar">
            <FiMessageCircle size={24} />
          </div>
          <h2>المحادثات</h2>
        </div>
        <button className="chat-page__new-chat-btn" onClick={handleNewChat}>
          <FiPlus size={22} />
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="chat-page__empty">
          <FiMessageCircle size={48} />
          <p>لا توجد محادثات بعد</p>
          <p className="chat-page__empty-sub">ابحث عن أصدقاء وابدأ الدردشة</p>
        </div>
      ) : (
        <div className="chat-page__rooms-list">
          {rooms.map((room) => {
            let displayName = room.name || 'محادثة';
            let imageUrl = room.imageUrl || null;
            let unreadCount = room.unreadCount?.[uid] || 0;

            if (room.type === 'global') {
              displayName = 'الدردشة العامة';
              imageUrl = null;
            } else if (room.type === 'private') {
              const otherMemberId = room.members?.find(m => m !== uid);
              if (otherMemberId && usersMap[otherMemberId]) {
                const otherUser = usersMap[otherMemberId];
                displayName = otherUser.name || otherUser.displayName || 'مستخدم';
                imageUrl = otherUser.avatar || otherUser.photoURL || null;
              } else {
                displayName = room.name || 'محادثة خاصة';
              }
            } else if (room.type === 'clan') {
              displayName = room.name || 'المجموعة';
              imageUrl = room.imageUrl || null;
            }

            return (
              <div
                key={room.id}
                className="chat-page__room-item"
                onClick={() => handleRoomClick(room.id)}
              >
                <div className="chat-page__room-avatar">
                  {imageUrl ? (
                    <img src={imageUrl} alt={displayName} loading="lazy" />
                  ) : (
                    <span className="chat-page__room-avatar-placeholder">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="chat-page__room-info">
                  <div className="chat-page__room-name">{displayName}</div>
                  <div className="chat-page__room-last-msg">
                    {room.lastMessage || 'لا توجد رسائل بعد'}
                  </div>
                </div>
                <div className="chat-page__room-meta">
                  <div className="chat-page__room-time">
                    {room.lastMessageTime?.toDate?.()
                      ?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                  </div>
                  {unreadCount > 0 && (
                    <div className="chat-page__room-unread">{unreadCount}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}