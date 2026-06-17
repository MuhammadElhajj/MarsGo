// src/components/UserComponents/Chat/ChatRoom.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import { useShallow } from 'zustand/react/shallow';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import toast from 'react-hot-toast';
import Message from './Message';
import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
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

  // جلب بيانات الغرفة
  useEffect(() => {
    if (!roomId) return;
    const roomRef = collection(db, 'rooms');
    const q = query(roomRef, where('id', '==', roomId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setRoom({ id: doc.id, ...doc.data() });
      } else {
        // غرفة غير موجودة
        navigate('/chat');
      }
    });
    return () => unsubscribe();
  }, [roomId, navigate]);

  // جلب رسائل الغرفة
  useEffect(() => {
    if (!roomId) return;
    const q = query(
      collection(db, 'messages'),
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
    });

    return () => unsubscribe();
  }, [roomId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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
      // تحديث آخر رسالة في الغرفة
      const roomRef = collection(db, 'rooms');
      const q = query(roomRef, where('id', '==', roomId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docRef = snap.docs[0].ref;
        await updateDoc(docRef, {
          lastMessage: newMessage.trim(),
          lastMessageTime: serverTimestamp(),
        });
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

  // تحديد اسم الغرفة للعرض
  let roomName = room.name;
  if (room.type === 'global') roomName = 'الدردشة العامة';
  else if (room.type === 'private') {
    const otherMember = room.members?.find(m => m !== uid);
    // إذا كان لدينا أسماء مخزنة نستخدمها
    roomName = room.name || 'محادثة خاصة';
  }

  return (
    <div className="chat-room">
      <div className="chat-room__header">
        <GoBackButton text="رجوع" onClick={() => navigate('/chat')} />
        <div className="chat-room__title">{roomName}</div>
        <div className="chat-room__members-count">
          {room.type === 'global' ? 'عامة' : room.members?.length || 0}
        </div>
      </div>

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

      <form className="chat-room__input-area" onSubmit={sendMessage}>
        <input
          ref={inputRef}
          type="text"
          placeholder="اكتب رسالتك..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          className="chat-room__input"
        />
        <button type="submit" disabled={sending || !newMessage.trim()}>
          {sending ? 'جاري الإرسال...' : 'إرسال'}
        </button>
      </form>
    </div>
  );
}