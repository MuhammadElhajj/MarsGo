// src/store/slices/visaSlice.js
export const createVisaSlice = (set, get) => ({
  visaNumbers: [],
  setVisaNumbers: (visaNumbers) => set({ visaNumbers }),

  generateVisaNumber: async (userId) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    const numericPart = Math.abs(hash).toString().slice(0, 8).padStart(8, '0');
    const fullVisa = numericPart + numericPart;
    const { visaNumbers } = get();
    if (visaNumbers.includes(fullVisa)) {
      const incremented = (parseInt(numericPart) + 1).toString().padStart(8, '0');
      const newVisa = incremented + incremented;
      if (visaNumbers.includes(newVisa)) {
        const fallback = Date.now().toString().slice(-8).padStart(8, '0');
        return fallback + fallback;
      }
      set({ visaNumbers: [...visaNumbers, newVisa] });
      return newVisa;
    }
    set({ visaNumbers: [...visaNumbers, fullVisa] });
    return fullVisa;
  },

  generateVisaSecret: () => {
    const length = Math.floor(Math.random() * 3) + 4;
    let secret = '';
    for (let i = 0; i < length; i++) {
      secret += Math.floor(Math.random() * 10);
    }
    return secret;
  },
});