// src/components/UserComponents/Chat/ChatRoom.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import { useShallow } from 'zustand/react/shallow';
import { 
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, 
  doc, updateDoc, where, getDoc, increment, limit, startAfter, getDocs
} from 'firebase/firestore';
import { db } from '../../../firebase';
import toast from 'react-hot-toast';
import Message from './Message';
import { FiArrowLeft, FiSend, FiSmile, FiPaperclip, FiLoader } from 'react-icons/fi';
import './ChatRoom.css';

const MESSAGES_LIMIT = 20; // عدد الرسائل لكل دفعة

export default function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, userData } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      userData: state.userData,
    }))
  );

  const uid = user?.uid || userData?.uid || null;
  const displayName = userData?.name || userData?.displayName || user?.displayName || 'مستخدم';
  const photoURL = userData?.avatar || userData?.photoURL || user?.photoURL || null;
  const popularity = userData?.popularity || 0;
  const power = userData?.power || 0;
  const rank = userData?.rank || 'عضو';

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [otherUserData, setOtherUserData] = useState(null); // ✅ بيانات الطرف الآخر
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastVisibleRef = useRef(null);
  const observerRef = useRef(null);
  const topObserverRef = useRef(null);

  // ===== جلب دفعة من الرسائل (أولية أو إضافية) =====
  const fetchMessages = useCallback(async (isLoadMore = false) => {
    if (!roomId) return;
    if (isLoadMore && (!hasMore || loadingMore)) return;
    if (!isLoadMore && !initialLoading) return;

    setLoadingMore(isLoadMore);
    try {
      let q;
      if (isLoadMore && lastVisibleRef.current) {
        // الدفعة التالية (أقدم من آخر دفعة)
        q = query(
          collection(db, 'messages'),
          where('roomId', '==', roomId),
          orderBy('timestamp', 'desc'),
          startAfter(lastVisibleRef.current),
          limit(MESSAGES_LIMIT)
        );
      } else {
        // الدفعة الأولى (الأحدث أولاً)
        q = query(
          collection(db, 'messages'),
          where('roomId', '==', roomId),
          orderBy('timestamp', 'desc'),
          limit(MESSAGES_LIMIT)
        );
      }

      const snapshot = await getDocs(q);
      const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (isLoadMore) {
        // إضافة الرسائل الأقدم إلى بداية القائمة (معكوسة لأنها جاءت desc)
        setMessages(prev => [...newMessages.reverse(), ...prev]);
      } else {
        // الدفعة الأولى: نعكس الترتيب ليصبح تصاعدياً (الأقدم أولاً)
        setMessages(newMessages.reverse());
      }

      // تحديث آخر وثيقة للدفعة التالية
      if (snapshot.docs.length > 0) {
        lastVisibleRef.current = snapshot.docs[snapshot.docs.length - 1];
      }
      setHasMore(snapshot.docs.length === MESSAGES_LIMIT);

      // تفعيل الاستماع المباشر بعد تحميل الدفعة الأولى
      if (!isLoadMore && !isListening) {
        setIsListening(true);
      }
    } catch (error) {
      console.error('خطأ في جلب الرسائل:', error);
      if (!isLoadMore) {
        // إذا فشل التحميل الأولي، حاول جلب بدون orderBy (حل بديل)
        try {
          const fallbackQ = query(
            collection(db, 'messages'),
            where('roomId', '==', roomId),
            limit(MESSAGES_LIMIT)
          );
          const fallbackSnap = await getDocs(fallbackQ);
          let fallbackMessages = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          fallbackMessages.sort((a, b) => (a.timestamp?.toDate?.() || 0) - (b.timestamp?.toDate?.() || 0));
          setMessages(fallbackMessages);
          setHasMore(false);
          setIsListening(true);
        } catch (fallbackErr) {
          console.error('فشل الحل البديل:', fallbackErr);
          toast.error('فشل تحميل الرسائل');
        }
      }
    } finally {
      setLoadingMore(false);
      setInitialLoading(false);
    }
  }, [roomId, hasMore, loadingMore, initialLoading, isListening]);

  // ===== تحميل الدفعة الأولية =====
  useEffect(() => {
    if (roomId) {
      fetchMessages();
    }
    return () => {
      // تنظيف المراقب
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [roomId, fetchMessages]);

  // ===== مراقب التمرير لتحميل المزيد =====
  const topObserverCallback = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore && hasMore && !initialLoading) {
        fetchMessages(true);
      }
    }, { threshold: 0.1, rootMargin: '50px' });
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMore, initialLoading, fetchMessages]);

  // ===== الاستماع المباشر للرسائل الجديدة فقط =====
  useEffect(() => {
    if (!roomId || !isListening) return;

    let latestTimestamp = null;
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      latestTimestamp = lastMsg.timestamp;
    }

    let q;
    if (latestTimestamp) {
      q = query(
        collection(db, 'messages'),
        where('roomId', '==', roomId),
        orderBy('timestamp', 'asc'),
        where('timestamp', '>', latestTimestamp)
      );
    } else {
      q = query(
        collection(db, 'messages'),
        where('roomId', '==', roomId),
        orderBy('timestamp', 'asc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newMsg = { id: change.doc.id, ...change.doc.data() };
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMsg.id);
            if (!exists) {
              const newList = [...prev, newMsg];
              newList.sort((a, b) => (a.timestamp?.toDate?.() || 0) - (b.timestamp?.toDate?.() || 0));
              return newList;
            }
            return prev;
          });
          setTimeout(() => scrollToBottom(), 100);
        }
      });
    }, (error) => {
      console.error('خطأ في الاستماع للرسائل:', error);
    });

    return () => unsubscribe();
  }, [roomId, isListening, messages.length]);

  // ===== التمرير للأسفل =====
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ===== التمرير للأسفل عند تحميل الدفعة الأولى =====
  useEffect(() => {
    if (!initialLoading && messages.length > 0) {
      setTimeout(() => scrollToBottom(), 200);
    }
  }, [initialLoading, messages.length, scrollToBottom]);

  // ===== إرسال رسالة =====
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !roomId) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        roomId: roomId,
        uid: uid,
        displayName: displayName,
        photoURL: photoURL,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        popularity: popularity,
        power: power,
        rank: rank,
      });

      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const roomData = roomSnap.data();
        const members = roomData.members || [];
        const updates = {
          lastMessage: newMessage.trim(),
          lastMessageTime: serverTimestamp(),
        };
        members.forEach(memberId => {
          if (memberId !== uid) {
            updates[`unreadCount.${memberId}`] = increment(1);
          }
        });
        await updateDoc(roomRef, updates);
      }

      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('فشل إرسال الرسالة:', error);
      toast.error('حدث خطأ أثناء الإرسال');
    } finally {
      setSending(false);
    }
  };

  // ===== جلب بيانات الغرفة ومسح العداد، بالإضافة لجلب بيانات الطرف الآخر =====
  useEffect(() => {
    if (!roomId || !uid) return;

    const roomRef = doc(db, 'rooms', roomId);
    const unsubscribe = onSnapshot(roomRef, async (docSnap) => {
      if (docSnap.exists()) {
        const roomData = docSnap.data();
        setRoom({ id: docSnap.id, ...roomData });

        // مسح العداد
        if (roomData.unreadCount && roomData.unreadCount[uid] !== undefined) {
          try {
            await updateDoc(roomRef, {
              [`unreadCount.${uid}`]: 0
            });
          } catch (err) {
            console.warn('فشل مسح العداد:', err);
          }
        }

        // ✅ جلب بيانات الطرف الآخر للمحادثات الخاصة
        if (roomData.type === 'private' && roomData.members) {
          const otherMemberId = roomData.members.find(m => m !== uid);
          if (otherMemberId) {
            // نحاول جلب البيانات من Firestore (يمكن استخدام usersMap من ChatPage لكن غير متوفر هنا)
            try {
              const userDoc = await getDoc(doc(db, 'users', otherMemberId));
              if (userDoc.exists()) {
                setOtherUserData({ id: otherMemberId, ...userDoc.data() });
              } else {
                setOtherUserData(null);
              }
            } catch (err) {
              console.error('خطأ في جلب بيانات الطرف الآخر:', err);
              setOtherUserData(null);
            }
          } else {
            setOtherUserData(null);
          }
        } else {
          setOtherUserData(null);
        }
      } else {
        toast.error('الغرفة غير موجودة');
        navigate('/chat');
      }
    }, (error) => {
      console.error('خطأ في تحميل الغرفة:', error);
      toast.error('حدث خطأ في تحميل المحادثة');
      navigate('/chat');
    });

    return () => unsubscribe();
  }, [roomId, navigate, uid]);

  // ===== عرض حالة التحميل =====
  if (!room) return <div className="chat-room-loading">جاري تحميل المحادثة...</div>;

  let roomName = room.name;
  let roomSubtitle = '';
  let roomImageUrl = room.imageUrl;

  if (room.type === 'global') {
    roomName = 'الدردشة العامة';
    roomSubtitle = 'متصل';
  } else if (room.type === 'private') {
    if (otherUserData) {
      roomName = otherUserData.name || otherUserData.displayName || 'مستخدم';
      roomImageUrl = otherUserData.avatar || otherUserData.photoURL || null;
    } else {
      // احتياطي: نستخدم room.name إذا لم نتمكن من جلب بيانات الطرف الآخر
      roomName = room.name || 'محادثة خاصة';
    }
    roomSubtitle = 'متصل';
  } else if (room.type === 'clan') {
    roomName = room.name || 'المجموعة';
    roomSubtitle = `${room.members?.length || 0} أعضاء`;
    roomImageUrl = room.imageUrl || null;
  }

  return (
    <div className="chat-room">
      {/* ===== الهيدر ===== */}
      <div className="chat-room__header">
        <button className="chat-room__back-btn" onClick={() => navigate('/chat')}>
          <FiArrowLeft size={22} />
        </button>
        <div className="chat-room__avatar">
          {roomImageUrl ? (
            <img src={roomImageUrl} alt={roomName} loading="lazy" />
          ) : (
            <span>{roomName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="chat-room__info">
          <div className="chat-room__title">{roomName}</div>
          <div className="chat-room__subtitle">
            <span className="chat-room__status-dot"></span>
            {roomSubtitle}
          </div>
        </div>
      </div>

      {/* ===== منطقة الرسائل ===== */}
      <div className="chat-room__messages">
        <div ref={topObserverCallback} style={{ height: '2px', minHeight: '2px' }} />
        
        {loadingMore && (
          <div className="loading-more" style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--color-text-secondary)' }}>
            <FiLoader className="loading-spinner" style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginLeft: '0.5rem' }} />
            جاري تحميل المزيد...
          </div>
        )}

        {initialLoading ? (
          <div className="loading-more" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
            <FiLoader className="loading-spinner" style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginLeft: '0.5rem' }} />
            جاري تحميل الرسائل...
          </div>
        ) : (
          messages.map((msg) => (
            <Message
              key={msg.id}
              message={msg}
              isOwn={msg.uid === uid}
            />
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* ===== منطقة الإدخال ===== */}
      <form className="chat-room__input-area" onSubmit={sendMessage}>
        <button type="button" className="chat-room__emoji-btn" title="إيموجي">
          <FiSmile size={22} />
        </button>
        <div className="chat-room__input-wrapper">
          <input
            ref={inputRef}
            type="text"
            placeholder="اكتب رسالة..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            className="chat-room__input"
          />
          <button 
            type="submit" 
            className="chat-room__send-btn" 
            disabled={sending || !newMessage.trim()}
            title="إرسال"
          >
            <FiSend size={20} />
          </button>
        </div>
        <button type="button" className="chat-room__attach-btn" title="مرفق">
          <FiPaperclip size={20} />
        </button>
      </form>
    </div>
  );
}