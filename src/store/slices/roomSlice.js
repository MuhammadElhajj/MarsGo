// src/store/slices/roomSlice.js
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp, query, where, orderBy, getDocs, updateDoc, onSnapshot as onSnapshotFirestore } from 'firebase/firestore';
import { db } from '../../firebase';

export const createRoomSlice = (set, get) => ({
  createPrivateRoom: async (otherUserId, otherUserName) => {
    const { user, userData } = get();
    if (!user) return { success: false, error: 'يجب تسجيل الدخول' };
    const roomId = [user.uid, otherUserId].sort().join('_');
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) {
      return { success: true, roomId };
    }
    await setDoc(roomRef, {
      type: 'private',
      members: [user.uid, otherUserId],
      name: `${userData?.name || 'مستخدم'} و ${otherUserName}`,
      imageUrl: userData?.avatar || null,
      lastMessage: '',
      lastMessageTime: null,
      createdAt: serverTimestamp(),
    });
    return { success: true, roomId };
  },

  createClanRoom: async (clanName, clanImage, members) => {
    const { user } = get();
    if (!user) return { success: false, error: 'يجب تسجيل الدخول' };
    const roomRef = collection(db, 'rooms');
    const newRoom = await addDoc(roomRef, {
      type: 'clan',
      members: [...members, user.uid],
      name: clanName,
      imageUrl: clanImage || null,
      lastMessage: '',
      lastMessageTime: null,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
    });
    return { success: true, roomId: newRoom.id };
  },

  fetchRooms: async () => {
    const { user } = get();
    if (!user) return [];
    try {
      const q = query(
        collection(db, 'rooms'),
        where('members', 'array-contains', user.uid),
        orderBy('lastMessageTime', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('خطأ في جلب الغرف:', error);
      return [];
    }
  },

  fetchRoomMessages: (roomId, callback) => {
    const q = query(
      collection(db, 'rooms', roomId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    return onSnapshotFirestore(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(messages);
    }, (error) => {
      console.error('خطأ في جلب الرسائل:', error);
    });
  },

  sendRoomMessage: async (roomId, text) => {
    const { user, userData } = get();
    if (!user) return { success: false, error: 'يجب تسجيل الدخول' };
    if (!text.trim()) return { success: false, error: 'الرسالة فارغة' };
    try {
      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        uid: user.uid,
        displayName: userData?.name || user?.displayName || 'مستخدم',
        photoURL: userData?.avatar || user?.photoURL || null,
        text: text.trim(),
        timestamp: serverTimestamp(),
      });
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        lastMessage: text.trim(),
        lastMessageTime: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error('فشل إرسال الرسالة:', error);
      return { success: false, error: error.message };
    }
  },
});