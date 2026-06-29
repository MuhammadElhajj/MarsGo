// src/store/slices/clanSlice.js
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, increment,  orderBy,limit, deleteDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions'; // ✅ إضافة استيراد دوال Firebase Functions
import { db } from '../../firebase';
import toast from 'react-hot-toast';

export const createClanSlice = (set, get) => ({
  // ===== إنشاء كلان جديد =====
  createClan: async (clanData) => {
    const { user } = get();
    if (!user) {
      toast.error('يجب تسجيل الدخول');
      return { success: false, error: 'يجب تسجيل الدخول' };
    }

    const { name, description, type, imageUrl } = clanData;
    if (!name || name.trim().length < 3) {
      toast.error('اسم الكلان يجب أن يكون 3 أحرف على الأقل');
      return { success: false, error: 'اسم غير صالح' };
    }

    try {
      // ✅ التحقق الجديد: هل المستخدم عضو في أي كلان آخر؟
      const myClansQuery = query(collection(db, 'clans'), where('members', 'array-contains', user.uid));
      const myClansSnap = await getDocs(myClansQuery);
      if (!myClansSnap.empty) {
        const existingClanDoc = myClansSnap.docs[0];
        const existingClanData = existingClanDoc.data();
        toast.error(`لا يمكنك إنشاء كلان جديد لأنك عضو بالفعل في كلان "${existingClanData.name}". يرجى مغادرة الكلان الحالي أولاً.`);
        return { success: false, error: 'عضو في كلان آخر' };
      }

      // إنشاء الكلان الجديد
      const clanRef = await addDoc(collection(db, 'clans'), {
        name: name.trim(),
        description: description?.trim() || '',
        type: type || 'public',
        imageUrl: imageUrl || null,
        ownerId: user.uid,
        members: [user.uid],
        memberRoles: { [user.uid]: 'owner' },
        moderators: [user.uid],
        points: 0,
        memberCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // إنشاء غرفة دردشة للكلان
      const roomId = `clan_${clanRef.id}`;
      await setDoc(doc(db, 'rooms', roomId), {
        type: 'clan',
        clanId: clanRef.id,
        members: [user.uid],
        name: `دردشة ${name.trim()}`,
        imageUrl: imageUrl || null,
        lastMessage: '',
        lastMessageTime: null,
        createdAt: serverTimestamp(),
      });

      toast.success(`✅ تم إنشاء كلان "${name.trim()}" بنجاح!`);
      return { success: true, clanId: clanRef.id };
    } catch (error) {
      console.error('فشل إنشاء الكلان:', error);
      toast.error('حدث خطأ أثناء إنشاء الكلان');
      return { success: false, error: error.message };
    }
  },

  // ===== جلب الكلانات التي أنا عضو فيها =====
  fetchMyClans: async () => {
    const { user } = get();
    if (!user) return [];

    try {
      const q = query(
        collection(db, 'clans'),
        where('members', 'array-contains', user.uid),
        orderBy('memberCount', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('خطأ في جلب الكلانات:', error);
      return [];
    }
  },

  // ===== جلب جميع الكلانات العامة (للاستكشاف) =====
  fetchPublicClans: async () => {
    try {
      const q = query(
        collection(db, 'clans'),
        where('type', '==', 'public'),
        orderBy('memberCount', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('خطأ في جلب الكلانات العامة:', error);
      return [];
    }
  },

  // ===== جلب بيانات كلان معين =====
  fetchClan: async (clanId) => {
    try {
      const docSnap = await getDoc(doc(db, 'clans', clanId));
      if (!docSnap.exists()) {
        toast.error('الكلان غير موجود');
        return null;
      }
      return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
      console.error('خطأ في جلب الكلان:', error);
      return null;
    }
  },

  // ===== الانضمام إلى كلان عام =====
  joinClan: async (clanId) => {
    const { user } = get();
    if (!user) {
      toast.error('يجب تسجيل الدخول');
      return false;
    }

    try {
      const clanRef = doc(db, 'clans', clanId);
      const clanSnap = await getDoc(clanRef);
      if (!clanSnap.exists()) {
        toast.error('الكلان غير موجود');
        return false;
      }

      const clanData = clanSnap.data();

      if (clanData.members.includes(user.uid)) {
        toast.error('أنت بالفعل عضو في هذا الكلان');
        return false;
      }

      const myClansQuery = query(collection(db, 'clans'), where('members', 'array-contains', user.uid));
      const myClansSnap = await getDocs(myClansQuery);
      if (!myClansSnap.empty) {
        const existingClanDoc = myClansSnap.docs[0];
        const existingClanData = existingClanDoc.data();
        if (existingClanDoc.id !== clanId) {
          toast.error(`أنت بالفعل عضو في كلان "${existingClanData.name}". يرجى مغادرة الكلان الحالي أولاً.`);
          return false;
        }
      }

      if (clanData.type === 'private') {
        toast.error('هذا الكلان خاص، يرجى انتظار دعوة');
        return false;
      }

      await updateDoc(clanRef, {
        members: arrayUnion(user.uid),
        [`memberRoles.${user.uid}`]: 'member',
        memberCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      const roomId = `clan_${clanId}`;
      await updateDoc(doc(db, 'rooms', roomId), {
        members: arrayUnion(user.uid),
      });

      toast.success(`✅ تم الانضمام إلى "${clanData.name}" بنجاح!`);
      return true;
    } catch (error) {
      console.error('فشل الانضمام:', error);
      toast.error('حدث خطأ أثناء الانضمام');
      return false;
    }
  },

  // ===== مغادرة الكلان =====
  leaveClan: async (clanId) => {
    const { user } = get();
    if (!user) {
      toast.error('يجب تسجيل الدخول');
      return false;
    }

    try {
      const clanRef = doc(db, 'clans', clanId);
      const clanSnap = await getDoc(clanRef);
      if (!clanSnap.exists()) {
        toast.error('الكلان غير موجود');
        return false;
      }

      const clanData = clanSnap.data();
      if (!clanData.members.includes(user.uid)) {
        toast.error('أنت لست عضواً في هذا الكلان');
        return false;
      }

      if (clanData.ownerId === user.uid) {
        const otherMembers = clanData.members.filter(id => id !== user.uid);
        if (otherMembers.length === 0) {
          await deleteDoc(clanRef);
          toast.success('تم حذف الكلان لعدم وجود أعضاء');
          return true;
        } else {
          const newOwner = otherMembers[0];
          await updateDoc(clanRef, {
            ownerId: newOwner,
            members: arrayRemove(user.uid),
            memberCount: increment(-1),
            updatedAt: serverTimestamp(),
          });
          toast.success(`✅ تم نقل ملكية الكلان إلى عضو آخر`);
          return true;
        }
      }

      await updateDoc(clanRef, {
        members: arrayRemove(user.uid),
        memberCount: increment(-1),
        updatedAt: serverTimestamp(),
      });

      const roomId = `clan_${clanId}`;
      await updateDoc(doc(db, 'rooms', roomId), {
        members: arrayRemove(user.uid),
      });

      toast.success('✅ تم مغادرة الكلان بنجاح');
      return true;
    } catch (error) {
      console.error('فشل المغادرة:', error);
      toast.error('حدث خطأ أثناء المغادرة');
      return false;
    }
  },

  // ===== إرسال دعوة للانضمام إلى كلان =====
  inviteToClan: async (clanId, invitedUserId) => {
    const { user } = get();
    if (!user) {
      toast.error('يجب تسجيل الدخول');
      return false;
    }

    try {
      const clanSnap = await getDoc(doc(db, 'clans', clanId));
      if (!clanSnap.exists()) {
        toast.error('الكلان غير موجود');
        return false;
      }

      const clanData = clanSnap.data();
      if (!clanData.moderators.includes(user.uid) && clanData.ownerId !== user.uid) {
        toast.error('ليس لديك صلاحية لدعوة أعضاء');
        return false;
      }

      const existingQuery = query(
        collection(db, 'clanInvites'),
        where('clanId', '==', clanId),
        where('invitedUserId', '==', invitedUserId),
        where('status', '==', 'pending')
      );
      const existingSnap = await getDocs(existingQuery);
      if (!existingSnap.empty) {
        toast.error('تم إرسال دعوة مسبقاً');
        return false;
      }

      await addDoc(collection(db, 'clanInvites'), {
        clanId,
        invitedUserId,
        invitedBy: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      toast.success('✅ تم إرسال الدعوة بنجاح');
      return true;
    } catch (error) {
      console.error('فشل إرسال الدعوة:', error);
      toast.error('حدث خطأ أثناء إرسال الدعوة');
      return false;
    }
  },

  // ===== قبول دعوة الكلان =====
  acceptClanInvite: async (inviteId) => {
    const { user } = get();
    if (!user) {
      toast.error('يجب تسجيل الدخول');
      return false;
    }

    try {
      const inviteRef = doc(db, 'clanInvites', inviteId);
      const inviteSnap = await getDoc(inviteRef);
      if (!inviteSnap.exists()) {
        toast.error('الدعوة غير موجودة');
        return false;
      }

      const inviteData = inviteSnap.data();
      if (inviteData.invitedUserId !== user.uid) {
        toast.error('هذه الدعوة ليست موجهة لك');
        return false;
      }

      if (inviteData.status !== 'pending') {
        toast.error('تمت معالجة هذه الدعوة مسبقاً');
        return false;
      }

      const clanId = inviteData.clanId;
      const clanRef = doc(db, 'clans', clanId);
      const clanSnap = await getDoc(clanRef);
      if (!clanSnap.exists()) {
        toast.error('الكلان غير موجود');
        return false;
      }

      await updateDoc(clanRef, {
        members: arrayUnion(user.uid),
        memberCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      const roomId = `clan_${clanId}`;
      await updateDoc(doc(db, 'rooms', roomId), {
        members: arrayUnion(user.uid),
      });

      await updateDoc(inviteRef, { status: 'accepted' });

      toast.success(`✅ تم الانضمام إلى الكلان بنجاح!`);
      return true;
    } catch (error) {
      console.error('فشل قبول الدعوة:', error);
      toast.error('حدث خطأ أثناء قبول الدعوة');
      return false;
    }
  },

  // ===== رفض دعوة الكلان =====
  rejectClanInvite: async (inviteId) => {
    const { user } = get();
    if (!user) {
      toast.error('يجب تسجيل الدخول');
      return false;
    }

    try {
      const inviteRef = doc(db, 'clanInvites', inviteId);
      const inviteSnap = await getDoc(inviteRef);
      if (!inviteSnap.exists()) {
        toast.error('الدعوة غير موجودة');
        return false;
      }

      const inviteData = inviteSnap.data();
      if (inviteData.invitedUserId !== user.uid) {
        toast.error('هذه الدعوة ليست موجهة لك');
        return false;
      }

      await updateDoc(inviteRef, { status: 'rejected' });
      toast.success('تم رفض الدعوة');
      return true;
    } catch (error) {
      console.error('فشل رفض الدعوة:', error);
      toast.error('حدث خطأ أثناء رفض الدعوة');
      return false;
    }
  },

  // ===== جلب دعوات الكلان الواردة =====
  fetchClanInvites: async () => {
    const { user } = get();
    if (!user) return [];

    try {
      const q = query(
        collection(db, 'clanInvites'),
        where('invitedUserId', '==', user.uid),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const invites = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const clanSnap = await getDoc(doc(db, 'clans', data.clanId));
        invites.push({
          id: docSnap.id,
          ...data,
          clanName: clanSnap.exists() ? clanSnap.data().name : 'غير معروف',
        });
      }
      return invites;
    } catch (error) {
      console.error('خطأ في جلب دعوات الكلان:', error);
      return [];
    }
  },

  // ===== تعيين دور لعضو (عبر Cloud Function) =====
  assignClanRole: async (clanId, targetUid, newRole) => {
    const { user } = get();
    if (!user) {
      toast.error('يجب تسجيل الدخول');
      return { success: false, error: 'يجب تسجيل الدخول' };
    }

    try {
      const functions = getFunctions();
      const assignFn = httpsCallable(functions, 'assignClanRole');
      const result = await assignFn({ clanId, targetUid, newRole });

      if (result.data.success) {
        toast.success(result.data.message || 'تم تغيير المنصب بنجاح');
        return { success: true };
      } else {
        toast.error(result.data.message || 'فشل تغيير المنصب');
        return { success: false, error: result.data.message };
      }
    } catch (error) {
      console.error('فشل تعيين المنصب:', error);
      toast.error(error.message || 'حدث خطأ');
      return { success: false, error: error.message };
    }
  },

  // ===== حذف الكلان (عبر Cloud Function) =====
  deleteClan: async (clanId) => {
    const { user } = get();
    if (!user) {
      toast.error('يجب تسجيل الدخول');
      return { success: false, error: 'يجب تسجيل الدخول' };
    }

    if (!window.confirm('هل أنت متأكد من حذف الكلان؟ لا يمكن التراجع.')) {
      return { success: false, error: 'تم الإلغاء' };
    }

    try {
      const functions = getFunctions();
      const deleteFn = httpsCallable(functions, 'deleteClan');
      const result = await deleteFn({ clanId });

      if (result.data.success) {
        // إزالة الكلان من قائمة myClans (إذا كانت موجودة في الحالة)
        const currentState = get();
        if (currentState.myClans) {
          set({ myClans: currentState.myClans.filter(c => c.id !== clanId) });
        }
        toast.success(result.data.message || 'تم حذف الكلان بنجاح');
        return { success: true };
      } else {
        toast.error(result.data.message || 'فشل حذف الكلان');
        return { success: false, error: result.data.message };
      }
    } catch (error) {
      console.error('فشل حذف الكلان:', error);
      toast.error(error.message || 'حدث خطأ');
      return { success: false, error: error.message };
    }
  },
});