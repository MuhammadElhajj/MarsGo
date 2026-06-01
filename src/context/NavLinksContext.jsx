import { createContext, useContext, useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NavLinksContext = createContext();

export function useNavLinks() {
  return useContext(NavLinksContext);
}

export function NavLinksProvider({ children }) {
  const { user } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = async () => {
    if (!user) {
      setLinks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, 'navigationLinks'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLinks(data);
    } catch (err) {
      console.error('Failed to fetch navigation links:', err);
      toast.error('فشل تحميل روابط التنقل');
    } finally {
      setLoading(false);
    }
  };

  const addLink = async (linkData) => {
    try {
      const docRef = await addDoc(collection(db, 'navigationLinks'), {
        ...linkData,
        createdAt: new Date(),
      });
      toast.success('تم إضافة الرابط');
      await fetchLinks();
      return docRef.id;
    } catch (err) {
      toast.error('فشل إضافة الرابط');
      throw err;
    }
  };

  const updateLink = async (id, linkData) => {
    try {
      await updateDoc(doc(db, 'navigationLinks', id), linkData);
      toast.success('تم تحديث الرابط');
      await fetchLinks();
    } catch (err) {
      toast.error('فشل تحديث الرابط');
      throw err;
    }
  };

  const deleteLink = async (id) => {
    try {
      await deleteDoc(doc(db, 'navigationLinks', id));
      toast.success('تم حذف الرابط');
      await fetchLinks();
    } catch (err) {
      toast.error('فشل حذف الرابط');
      throw err;
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [user]);

  return (
    <NavLinksContext.Provider value={{ links, loading, addLink, updateLink, deleteLink, fetchLinks }}>
      {children}
    </NavLinksContext.Provider>
  );
}