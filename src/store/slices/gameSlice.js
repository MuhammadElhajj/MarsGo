// src/store/slices/gameSlice.js
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export const createGameSlice = (set, get) => ({
  games: [],
  apps: [],
  products: [],
  services: [],
  navLinks: [],
  discounts: { games: 0, apps: 0, specific: {} },
  merchantDiscountPercent: 0,
  loading: false,
  loadingProducts: false,

  setGames: (games) => set({ games }),
  setApps: (apps) => set({ apps }),
  setProducts: (products) => set({ products }),
  setServices: (services) => set({ services }),
  setNavLinks: (links) => set({ navLinks: links }),
  setDiscounts: (discounts) => set({ discounts }),
  setMerchantDiscountPercent: (percent) => set({ merchantDiscountPercent: percent }),
  setLoading: (loading) => set({ loading }),
  setLoadingProducts: (loading) => set({ loadingProducts: loading }),

  getProductDiscount: (type, productId) => {
    const state = get();
    let discount = 0;
    if (type === 'game') {
      discount = state.discounts.games;
      const specific = state.discounts.specific[`game_${productId}`];
      if (specific) discount = Math.max(discount, specific);
    } else if (type === 'app') {
      discount = state.discounts.apps;
      const specific = state.discounts.specific[`app_${productId}`];
      if (specific) discount = Math.max(discount, specific);
    }
    return discount;
  },

  getMerchantDiscountPercent: () => {
    const state = get();
    return state.userData?.customerType === 'merchant' ? state.merchantDiscountPercent : 0;
  },

  // ===== الألعاب =====
  addGame: async (gameData) => {
    try {
      const docRef = await addDoc(collection(db, 'games'), gameData);
      const newGame = { id: docRef.id, ...gameData };
      set((state) => ({ games: [...state.games, newGame] }));
      return true;
    } catch (error) {
      console.error('Error adding game:', error);
      return false;
    }
  },

  updateGame: async (id, gameData) => {
    try {
      const gameRef = doc(db, 'games', id);
      await updateDoc(gameRef, gameData);
      set((state) => ({
        games: state.games.map(g => g.id === id ? { ...g, ...gameData } : g)
      }));
      return true;
    } catch (error) {
      console.error('Error updating game:', error);
      return false;
    }
  },

  deleteGame: async (id) => {
    try {
      const gameRef = doc(db, 'games', id);
      await deleteDoc(gameRef);
      try {
        const contentRef = doc(db, 'gameContent', id);
        await deleteDoc(contentRef);
      } catch (contentErr) {}
      try {
        const packagesRef = collection(db, 'games', id, 'packages');
        const packagesSnap = await getDocs(packagesRef);
        const deletePromises = packagesSnap.docs.map(docSnap =>
          deleteDoc(doc(db, 'games', id, 'packages', docSnap.id))
        );
        await Promise.all(deletePromises);
      } catch (pkgErr) {}
      set((state) => ({ games: state.games.filter(g => g.id !== id) }));
      return true;
    } catch (error) {
      console.error('Error deleting game:', error);
      return false;
    }
  },

  // ===== التطبيقات =====
  addApp: async (appData) => {
    try {
      const docRef = await addDoc(collection(db, 'apps'), appData);
      const newApp = { id: docRef.id, ...appData };
      set((state) => ({ apps: [...state.apps, newApp] }));
      return true;
    } catch (error) {
      console.error('Error adding app:', error);
      return false;
    }
  },

  updateApp: async (id, appData) => {
    try {
      const appRef = doc(db, 'apps', id);
      await updateDoc(appRef, appData);
      set((state) => ({
        apps: state.apps.map(a => a.id === id ? { ...a, ...appData } : a)
      }));
      return true;
    } catch (error) {
      console.error('Error updating app:', error);
      return false;
    }
  },

  deleteApp: async (id) => {
    try {
      const appRef = doc(db, 'apps', id);
      await deleteDoc(appRef);
      try {
        const contentRef = doc(db, 'appContent', id);
        await deleteDoc(contentRef);
      } catch (contentErr) {}
      try {
        const packagesRef = collection(db, 'apps', id, 'packages');
        const packagesSnap = await getDocs(packagesRef);
        const deletePromises = packagesSnap.docs.map(docSnap =>
          deleteDoc(doc(db, 'apps', id, 'packages', docSnap.id))
        );
        await Promise.all(deletePromises);
      } catch (pkgErr) {}
      set((state) => ({ apps: state.apps.filter(a => a.id !== id) }));
      return true;
    } catch (error) {
      console.error('Error deleting app:', error);
      return false;
    }
  },

  // ===== الباقات =====
  fetchGamePackages: async (gameId) => {
    try {
      const q = query(collection(db, 'games', gameId, 'packages'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching game packages:', error);
      return [];
    }
  },

  addGamePackage: async (gameId, packageData) => {
    try {
      const docRef = await addDoc(collection(db, 'games', gameId, 'packages'), packageData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding game package:', error);
      throw error;
    }
  },

  updateGamePackage: async (gameId, packageId, packageData) => {
    try {
      const packageRef = doc(db, 'games', gameId, 'packages', packageId);
      await updateDoc(packageRef, packageData);
      return true;
    } catch (error) {
      console.error('Error updating game package:', error);
      throw error;
    }
  },

  deleteGamePackage: async (gameId, packageId) => {
    try {
      const packageRef = doc(db, 'games', gameId, 'packages', packageId);
      await deleteDoc(packageRef);
      return true;
    } catch (error) {
      console.error('Error deleting game package:', error);
      throw error;
    }
  },

  fetchAppPackages: async (appId) => {
    try {
      const q = query(collection(db, 'apps', appId, 'packages'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching app packages:', error);
      return [];
    }
  },

  addAppPackage: async (appId, packageData) => {
    try {
      const docRef = await addDoc(collection(db, 'apps', appId, 'packages'), packageData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding app package:', error);
      throw error;
    }
  },

  updateAppPackage: async (appId, packageId, packageData) => {
    try {
      const packageRef = doc(db, 'apps', appId, 'packages', packageId);
      await updateDoc(packageRef, packageData);
      return true;
    } catch (error) {
      console.error('Error updating app package:', error);
      throw error;
    }
  },

  deleteAppPackage: async (appId, packageId) => {
    try {
      const packageRef = doc(db, 'apps', appId, 'packages', packageId);
      await deleteDoc(packageRef);
      return true;
    } catch (error) {
      console.error('Error deleting app package:', error);
      throw error;
    }
  },

  // ===== المحتوى الإضافي =====
  fetchGameContent: async (gameId) => {
    try {
      const docRef = doc(db, 'gameContent', gameId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return docSnap.data();
      return null;
    } catch (error) {
      console.error('Error fetching game content:', error);
      return null;
    }
  },

  updateGameContent: async (gameId, contentData) => {
    try {
      await setDoc(doc(db, 'gameContent', gameId), contentData, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating game content:', error);
      return false;
    }
  },

  fetchAppContent: async (appId) => {
    try {
      const docRef = doc(db, 'appContent', appId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return docSnap.data();
      return null;
    } catch (error) {
      console.error('Error fetching app content:', error);
      return null;
    }
  },

  updateAppContent: async (appId, contentData) => {
    try {
      await setDoc(doc(db, 'appContent', appId), contentData, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating app content:', error);
      return false;
    }
  },

  // ===== المنتجات =====
  fetchProducts: async () => {
    set({ loadingProducts: true });
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ products: productsList });
    } catch (error) {
      console.error('❌ فشل جلب المنتجات:', error);
    } finally {
      set({ loadingProducts: false });
    }
  },

  // ===== الباقات العامة (من collection "packages") =====
  fetchPackages: async () => {
    set({ loading: true });
    try {
      const snapshot = await getDocs(collection(db, 'packages'));
      // لا نقوم بتخزين النتائج لأنها قد لا تُستخدم
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      set({ loading: false });
    }
  },
});