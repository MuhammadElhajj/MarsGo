// src/components/UserComponents/Chat/ChatPage.jsx
import { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/store';
import { useShallow } from 'zustand/react/shallow';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useNavigate } from 'react-router-dom';
import { FiMessageCircle, FiUsers, FiUser, FiPlus, FiSearch } from 'react-icons/fi';
import './ChatPage.css';

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

  // دالة لإنشاء الغرفة العامة (global) إذا لم تكن موجودة
  const ensureGlobalRoom = async () => {
    try {
      const q = query(collection(db, 'rooms'), where('type', '==', 'global'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        // إنشاء الغرفة العامة
        await setDoc(doc(db, 'rooms', 'global_room'), {
          type: 'global',
          name: 'الدردشة العامة',
          members: [], // لا نضيف أعضاء، الجميع يمكنهم الانضمام
          lastMessage: 'مرحباً بك في الدردشة العامة',
          lastMessageTime: serverTimestamp(),
          createdAt: serverTimestamp(),
          imageUrl: null,
        });
        console.log('✅ تم إنشاء الغرفة العامة');
      }
    } catch (error) {
      console.error('خطأ في إنشاء الغرفة العامة:', error);
    }
  };

  // جلب بيانات المستخدمين الآخرين (للعرض في الغرف الخاصة)
  const fetchUsersData = async (userIds) => {
    try {
      const users = {};
      for (const id of userIds) {
        if (!usersMap[id]) {
          const docSnap = await getDoc(doc(db, 'users', id));
          if (docSnap.exists()) {
            users[id] = docSnap.data();
          }
        }
      }
      setUsersMap(prev => ({ ...prev, ...users }));
    } catch (error) {
      console.error('خطأ في جلب بيانات المستخدمين:', error);
    }
  };

  useEffect(() => {
    if (!uid) return;

    // التأكد من وجود الغرفة العامة
    ensureGlobalRoom();

    // جلب الغرف
    const roomsRef = collection(db, 'rooms');
    const q = query(
      roomsRef,
      where('members', 'array-contains', uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const roomsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // إضافة الغرفة العامة إذا لم تكن موجودة في القائمة
      const hasGlobal = roomsList.some(r => r.type === 'global');
      if (!hasGlobal) {
        // نحاول جلب الغرفة العامة بشكل منفصل (قد تكون موجودة لكن ليست في قائمة الـ members)
        try {
          const globalQ = query(collection(db, 'rooms'), where('type', '==', 'global'));
          const globalSnap = await getDocs(globalQ);
          if (!globalSnap.empty) {
            const globalRoom = { id: globalSnap.docs[0].id, ...globalSnap.docs[0].data() };
            // نضيفها إلى القائمة
            roomsList.unshift(globalRoom);
          }
        } catch (error) {
          console.error('خطأ في جلب الغرفة العامة:', error);
        }
      }

      // جمع الـ userIds من الغرف الخاصة لعرض أسمائهم
      const privateRooms = roomsList.filter(r => r.type === 'private');
      const userIds = privateRooms.flatMap(r => r.members || []).filter(id => id !== uid);
      if (userIds.length > 0) {
        await fetchUsersData(userIds);
      }

      setRooms(roomsList);
      setLoading(false);
    }, (error) => {
      console.error('خطأ في تحميل الغرف:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  const handleRoomClick = (roomId) => {
    navigate(`/chat/room/${roomId}`);
  };

  // فتح مودال لبدء محادثة جديدة (سيتم تنفيذه لاحقاً)
  const handleNewChat = () => {
    // TODO: فتح مودال لاختيار مستخدم لبدء محادثة خاصة
    alert('سيتم فتح مودال لبدء محادثة جديدة قريباً');
  };

  if (loading) return <div className="chat-page__loading">جاري تحميل المحادثات...</div>;

  return (
    <div className="chat-page">
      <div className="chat-page__header">
        <h2>المحادثات</h2>
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

            if (room.type === 'global') {
              displayName = 'الدردشة العامة';
            } else if (room.type === 'private') {
              // نبحث عن المستخدم الآخر لعرض اسمه
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
                    <img src={imageUrl} alt={displayName} />
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
                <div className="chat-page__room-time">
                  {room.lastMessageTime?.toDate?.()
                    ?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}