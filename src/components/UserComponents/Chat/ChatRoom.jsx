// src/components/UserComponents/Chat/ChatRoom.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import { useShallow } from 'zustand/react/shallow';
import { 
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, 
  doc, updateDoc, where, getDoc, increment
} from 'firebase/firestore';
import { db } from '../../../firebase';
import toast from 'react-hot-toast';
import Message from './Message';
import { FiArrowLeft, FiSend, FiSmile, FiPaperclip } from 'react-icons/fi';
import './ChatRoom.css';

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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // جلب بيانات الغرفة ومسح العداد
  useEffect(() => {
    if (!roomId || !uid) return;

    const roomRef = doc(db, 'rooms', roomId);
    const unsubscribe = onSnapshot(roomRef, async (docSnap) => {
      if (docSnap.exists()) {
        const roomData = docSnap.data();
        setRoom({ id: docSnap.id, ...roomData });

        if (roomData.unreadCount && roomData.unreadCount[uid] !== undefined) {
          try {
            await updateDoc(roomRef, {
              [`unreadCount.${uid}`]: 0
            });
          } catch (err) {
            console.warn('فشل مسح العداد:', err);
          }
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

  // جلب رسائل الغرفة
  useEffect(() => {
    if (!roomId) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('roomId', '==', roomId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
      setTimeout(() => scrollToBottom(), 100);
    }, (error) => {
      console.error('خطأ في تحميل الرسائل:', error);
      toast.error('فشل تحميل الرسائل');
    });

    return () => unsubscribe();
  }, [roomId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // إرسال رسالة
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

  if (!room) return <div className="chat-room-loading">جاري تحميل المحادثة...</div>;

  let roomName = room.name;
  let roomSubtitle = '';
  
  if (room.type === 'global') {
    roomName = 'الدردشة العامة';
    roomSubtitle = 'متصل';
  } else if (room.type === 'private') {
    const otherMember = room.members?.find(m => m !== uid);
    roomName = room.name || 'محادثة خاصة';
    roomSubtitle = 'متصل';
  } else if (room.type === 'clan') {
    roomName = room.name || 'المجموعة';
    roomSubtitle = `${room.members?.length || 0} أعضاء`;
  }

  return (
    <div className="chat-room">
      {/* ===== الهيدر ===== */}
      <div className="chat-room__header">
        <button className="chat-room__back-btn" onClick={() => navigate('/chat')}>
          <FiArrowLeft size={22} />
        </button>
        <div className="chat-room__avatar">
          {room.imageUrl ? (
            <img src={room.imageUrl} alt={roomName} />
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
        {messages.map((msg) => (
          <Message
            key={msg.id}
            message={msg}
            isOwn={msg.uid === uid}
          />
        ))}
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