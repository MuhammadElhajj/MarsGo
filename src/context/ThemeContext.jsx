


// import { createContext, useContext, useState, useEffect } from 'react';

// const ThemeContext = createContext();

// export function useTheme() {
//   return useContext(ThemeContext);
// }

// export function ThemeProvider({ children }) {
//   const [isDark, setIsDark] = useState(() => {
//     const saved = localStorage.getItem('theme');
//     return saved === 'dark';
//   });

//   useEffect(() => {
//     localStorage.setItem('theme', isDark ? 'dark' : 'light');
//     if (isDark) {
//       document.documentElement.classList.add('dark');
//       document.documentElement.classList.remove('light');
//     } else {
//       document.documentElement.classList.add('light');
//       document.documentElement.classList.remove('dark');
//     }
//   }, [isDark]);

//   const toggleTheme = () => setIsDark(prev => !prev);

//   return (
//     <ThemeContext.Provider value={{ isDark, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// }

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  // تحديد الوضع الأساسي فاتح (light)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    // إذا كان التخزين المحلي يحتوي على 'dark' نجعله داكن، وإلا نجعله فاتح
    return saved === 'dark';
  });

  useEffect(() => {
    // حفظ الوضع في localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // تطبيق الكلاس على عنصر html
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // دالة تبديل المود
  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}