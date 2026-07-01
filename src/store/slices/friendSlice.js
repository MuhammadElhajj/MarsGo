// src/store/slices/friendSlice.js
import {
  doc, updateDoc, getDoc, addDoc, collection, serverTimestamp,
  query, where, getDocs, writeBatch, arrayUnion, arrayRemove, onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

export const createFriendSlice = (set, get) => ({
  // ===== الحالات =====
  friendRequests: [],
  friendsList: [],
  pendingRequestsCount: 0,

  // ===== استماع حي لطلبات الصداقة =====
  listenToFriendRequests: () => {
    const { user } = get();
    if (!user) return () => {};
    const q = query(
      collection(db, 'friendRequests'),
      where('to', '==', user.uid),
      where('status', '==', 'pending'),
      where('seen', '==', false)
    );
    return onSnapshot(q, (snap) => {
      const requests = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ friendRequests: requests, pendingRequestsCount: requests.length });
    }, (err) => console.error('خطأ استماع طلبات الصداقة:', err));
  },

  // ===== إرسال طلب صداقة =====
  sendFriendRequest: async (toUserId) => {
    const { user, userData } = get();
    if (!user) {
      toast.error('يجب تسجيل الدخول');
      return false;
    }
    if (user.uid === toUserId) {
      toast.error('لا يمكنك إرسال طلب لنفسك');
      return false;
    }
    const friends = userData?.friends || [];
    if (friends.includes(toUserId)) {
      toast.error('هذا المستخدم موجود بالفعل في قائمة أصدقائك');
      return false;
    }
    const pendingQuery = query(
      collection(db, 'friendRequests'),
      where('from', '==', user.uid),
      where('to', '==', toUserId),
      where('status', '==', 'pending')
    );
    const pendingSnap = await getDocs(pendingQuery);
    if (!pendingSnap.empty) {
      toast('طلب صداقة قيد الانتظار مسبقاً');
      return false;
    }
    const acceptedQuery = query(
      collection(db, 'friendRequests'),
      where('from', '==', user.uid),
      where('to', '==', toUserId),
      where('status', '==', 'accepted')
    );
    const acceptedSnap = await getDocs(acceptedQuery);
    if (!acceptedSnap.empty) {
      toast('أنتم أصدقاء بالفعل');
      return false;
    }
    await addDoc(collection(db, 'friendRequests'), {
      from: user.uid,
      to: toUserId,
      status: 'pending',
      seen: false,
      createdAt: serverTimestamp(),
    });
    toast.success('تم إرسال طلب الصداقة');
    return true;
  },

  // ===== قبول طلب صداقة =====
  acceptFriendRequest: async (requestId) => {
    const { user, userData } = get();
    if (!user) {
      toast.error('يجب تسجيل الدخول');
      return false;
    }
    try {
      const requestRef = doc(db, 'friendRequests', requestId);
      const requestSnap = await getDoc(requestRef);
      if (!requestSnap.exists()) {
        toast.error('الطلب غير موجود');
        return false;
      }
      const requestData = requestSnap.data();
      if (requestData.to !== user.uid) {
        toast.error('هذا الطلب ليس موجه لك');
        return false;
      }
      if (requestData.status !== 'pending') {
        toast.error('تمت معالجة هذا الطلب مسبقاً');
        return false;
      }
      const fromUserId = requestData.from;

      await updateDoc(requestRef, { status: 'accepted' });

      const otherUserSnap = await getDoc(doc(db, 'users', fromUserId));
      const otherUserData = otherUserSnap.data();

      const currentFriends = Array.isArray(userData?.friends) ? userData.friends : [];
      const otherFriends = Array.isArray(otherUserData?.friends) ? otherUserData.friends : [];

      const batch = writeBatch(db);
      batch.update(doc(db, 'users', user.uid), {
        friends: [...currentFriends, fromUserId]
      });
      batch.update(doc(db, 'users', fromUserId), {
        friends: [...otherFriends, user.uid]
      });
      await batch.commit();

      const newFriendsList = [...(get().friendsList || []), { id: fromUserId, ...otherUserData }];
      const newUserData = {
        ...userData,
        friends: [...currentFriends, fromUserId]
      };

      set({
        userData: newUserData,
        friendsList: newFriendsList,
        friendRequests: get().friendRequests.filter(r => r.id !== requestId),
        pendingRequestsCount: Math.max(0, get().pendingRequestsCount - 1),
      });

      toast.success('تم قبول الصداقة');
      return true;
    } catch (error) {
      console.error('فشل قبول الطلب:', error);
      toast.error('حدث خطأ أثناء قبول الطلب');
      return false;
    }
  },

  // ===== رفض طلب صداقة =====
  rejectFriendRequest: async (requestId) => {
    const { user } = get();
    if (!user) {
      toast.error('يجب تسجيل الدخول');
      return false;
    }
    try {
      const requestRef = doc(db, 'friendRequests', requestId);
      const requestSnap = await getDoc(requestRef);
      if (!requestSnap.exists()) {
        toast.error('الطلب غير موجود');
        return false;
      }
      const requestData = requestSnap.data();
      if (requestData.to !== user.uid) {
        toast.error('هذا الطلب ليس موجه لك');
        return false;
      }
      if (requestData.status !== 'pending') {
        toast.error('تمت معالجة هذا الطلب مسبقاً');
        return false;
      }
      await updateDoc(requestRef, { status: 'rejected' });
      set((state) => ({
        friendRequests: state.friendRequests.filter(r => r.id !== requestId),
        pendingRequestsCount: Math.max(0, state.pendingRequestsCount - 1),
      }));
      toast.success('تم رفض الطلب');
      return true;
    } catch (error) {
      console.error('فشل رفض الطلب:', error);
      toast.error('حدث خطأ أثناء رفض الطلب');
      return false;
    }
  },

  // ===== جلب طلبات الصداقة =====
  fetchFriendRequests: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const q = query(
        collection(db, 'friendRequests'),
        where('to', '==', user.uid),
        where('status', '==', 'pending'),
        where('seen', '==', false)
      );
      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ friendRequests: requests, pendingRequestsCount: requests.length });
    } catch (error) {
      console.error('خطأ جلب طلبات الصداقة:', error);
    }
  },

  // ===== جلب قائمة الأصدقاء (مع تجاهل أخطاء الصلاحية) =====
  fetchFriendsList: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const friendsIds = userSnap.data()?.friends || [];
      if (friendsIds.length === 0) {
        set({ friendsList: [] });
        return;
      }
      const friendsData = [];
      for (const fid of friendsIds) {
        try {
          const fSnap = await getDoc(doc(db, 'users', fid));
          if (fSnap.exists()) {
            friendsData.push({ id: fid, ...fSnap.data() });
          }
        } catch (err) {
          // تجاهل فشل جلب بيانات صديق معين (قد يكون بسبب الصلاحيات)
          // لا نطبع الخطأ في الكونسول لتجنب الفوضى
        }
      }
      set({ friendsList: friendsData });
    } catch (error) {
      // إذا كان الخطأ بسبب الصلاحيات، لا نطبعه
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        // فقط نعيد تعيين القائمة فارغة
        set({ friendsList: [] });
        return;
      }
      console.error('خطأ جلب قائمة الأصدقاء:', error);
    }
  },

  // ===== تعليم الطلبات كمقروءة =====
  markFriendRequestsAsSeen: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const q = query(
        collection(db, 'friendRequests'),
        where('to', '==', user.uid),
        where('status', '==', 'pending'),
        where('seen', '==', false)
      );
      const snap = await getDocs(q);
      if (snap.empty) return;
      const batch = writeBatch(db);
      snap.docs.forEach(docSnap => {
        batch.update(docSnap.ref, { seen: true });
      });
      await batch.commit();
      set({ pendingRequestsCount: 0 });
      const { friendRequests } = get();
      const updatedRequests = friendRequests.map(req => ({ ...req, seen: true }));
      set({ friendRequests: updatedRequests });
    } catch (error) {
      console.error('فشل تعليم الطلبات كمقروءة:', error);
    }
  },

  // ===== إزالة صديق =====
  removeFriend: async (friendId) => {
    const { user, userData, friendsList } = get();
    if (!user) return false;
    const currentFriends = userData?.friends || [];
    if (!currentFriends.includes(friendId)) {
      toast.error('هذا المستخدم ليس صديقاً لك');
      return false;
    }
    try {
      const newFriends = currentFriends.filter(id => id !== friendId);
      await updateDoc(doc(db, 'users', user.uid), { friends: newFriends });
      const otherUserSnap = await getDoc(doc(db, 'users', friendId));
      if (otherUserSnap.exists()) {
        const otherFriends = otherUserSnap.data()?.friends || [];
        const newOtherFriends = otherFriends.filter(id => id !== user.uid);
        await updateDoc(doc(db, 'users', friendId), { friends: newOtherFriends });
      }
      set({
        userData: { ...userData, friends: newFriends },
        friendsList: friendsList.filter(f => f.id !== friendId),
      });
      toast.success('تم إزالة الصديق');
      return true;
    } catch (error) {
      console.error('فشل إزالة الصديق:', error);
      toast.error('حدث خطأ أثناء إزالة الصديق');
      return false;
    }
  },

  // ===== جلب اقتراحات الأصدقاء (مع تجاهل أخطاء الصلاحية) =====
  fetchSuggestedFriends: async () => {
    const { user, userData } = get();
    if (!user) return [];
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const friends = userData?.friends || [];
      const blocked = userData?.blockedUsers || [];

      const sentRequestsSnap = await getDocs(query(
        collection(db, 'friendRequests'),
        where('from', '==', user.uid),
        where('status', '==', 'pending')
      ));
      const sentRequestIds = sentRequestsSnap.docs.map(doc => doc.data().to);

      const receivedRequestsSnap = await getDocs(query(
        collection(db, 'friendRequests'),
        where('to', '==', user.uid),
        where('status', '==', 'pending')
      ));
      const receivedRequestIds = receivedRequestsSnap.docs.map(doc => doc.data().from);

      const excludeIds = new Set([
        user.uid,
        ...friends,
        ...blocked,
        ...sentRequestIds,
        ...receivedRequestIds,
      ]);

      const suggested = allUsers
        .filter(u => !excludeIds.has(u.id))
        .slice(0, 10);

      return suggested;
    } catch (error) {
      // إذا كان الخطأ بسبب الصلاحيات، نرجع مصفوفة فارغة بدون طباعة
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        return [];
      }
      console.error('خطأ في جلب اقتراحات الأصدقاء:', error);
      return [];
    }
  },

  // ===== الحظر =====
  blockUser: async (userId) => {
    const { user, userData } = get();
    if (!user) return false;
    const blocked = userData?.blockedUsers || [];
    if (blocked.includes(userId)) return true;
    const newBlocked = [...blocked, userId];
    await updateDoc(doc(db, 'users', user.uid), { blockedUsers: newBlocked });
    set({ userData: { ...userData, blockedUsers: newBlocked } });
    toast.success('تم حظر المستخدم');
    return true;
  },

  unblockUser: async (userId) => {
    const { user, userData } = get();
    if (!user) return false;
    const blocked = userData?.blockedUsers || [];
    const newBlocked = blocked.filter(id => id !== userId);
    await updateDoc(doc(db, 'users', user.uid), { blockedUsers: newBlocked });
    set({ userData: { ...userData, blockedUsers: newBlocked } });
    toast.success('تم إلغاء الحظر');
    return true;
  },
});