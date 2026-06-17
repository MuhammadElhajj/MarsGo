import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../../store/store';
import { useShallow } from 'zustand/react/shallow';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import toast from 'react-hot-toast';
import Message from './Message';
import './ChatPage.css';

export default function ChatPage() {
  const { user, userData } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      userData: state.userData,
    }))
  );

  // الأولوية لـ userData ثم user
  const uid = user?.uid || userData?.uid || null;
  const displayName = userData?.name || userData?.displayName || user?.displayName || 'مستخدم';
  const photoURL = userData?.avatar || userData?.photoURL || user?.photoURL || null;
  const popularity = userData?.popularity || 0;
  const power = userData?.power || 0;
  const rank = userData?.rank || 'عضو';

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
      setTimeout(() => scrollToBottom(), 100);
    }, (error) => {
      console.error('خطأ في الاستماع للرسائل:', error);
      toast.error('فشل تحميل الرسائل');
    });

    return () => unsubscribe();
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (sending) return;

    // التحقق من وجود uid
    if (!uid) {
      toast.error('يرجى تسجيل الدخول أولاً');
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        uid: uid,
        displayName: displayName,
        photoURL: photoURL,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        popularity: popularity,
        power: power,
        rank: rank,
      });
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('فشل إرسال الرسالة:', error);
      toast.error('حدث خطأ أثناء الإرسال');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-page__header">
        <h2>💬 الدردشة العامة</h2>
        <span className="chat-page__count">{messages.length} رسالة</span>
      </div>

      <div className="chat-page__messages">
        {messages.map((msg) => (
          <Message
            key={msg.id}
            message={msg}
            isOwn={msg.uid === uid}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-page__input-area" onSubmit={sendMessage}>
        <input
          ref={inputRef}
          type="text"
          placeholder="اكتب رسالتك..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          className="chat-page__input"
        />
        <button type="submit" disabled={sending || !newMessage.trim()}>
          {sending ? 'جاري الإرسال...' : 'إرسال'}
        </button>
      </form>
    </div>
  );
}