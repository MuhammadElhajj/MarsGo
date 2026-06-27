// src/store/slices/clanSlice.js
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, increment, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

export const createClanSlice = (set, get) => ({
  // ... جميع دوال الكلانات كما هي في الملف الأصلي
  createClan: async (clanData) => { /* ... */ },
  fetchMyClans: async () => { /* ... */ },
  fetchPublicClans: async () => { /* ... */ },
  fetchClan: async (clanId) => { /* ... */ },
  joinClan: async (clanId) => { /* ... */ },
  leaveClan: async (clanId) => { /* ... */ },
  inviteToClan: async (clanId, invitedUserId) => { /* ... */ },
  acceptClanInvite: async (inviteId) => { /* ... */ },
  rejectClanInvite: async (inviteId) => { /* ... */ },
  fetchClanInvites: async () => { /* ... */ },
  assignClanRole: async (clanId, targetUid, newRole) => { /* ... */ },
});