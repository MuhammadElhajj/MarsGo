// import './Avatar.css';

// export default function Avatar({ src, alt, name, email, size = 'md' }) {
//   const fallbackChar = email ? email.charAt(0).toUpperCase() : (name ? name.charAt(0).toUpperCase() : '?');

//   if (src) {
//     return (
//       <img
//         src={src}
//         alt={alt || name || 'المستخدم'}
//         className={`avatar avatar--image avatar--${size}`}
//         onError={(e) => {
//           e.target.style.display = 'none';
//           // إنشاء عنصر fallback ديناميكياً إذا لم يكن موجوداً
//           let fallback = e.target.nextElementSibling;
//           if (!fallback || !fallback.classList.contains('avatar--fallback')) {
//             fallback = document.createElement('div');
//             fallback.className = `avatar avatar--fallback avatar--${size}`;
//             fallback.textContent = fallbackChar;
//             e.target.parentNode?.insertBefore(fallback, e.target.nextSibling);
//           }
//           fallback.style.display = 'flex';
//         }}
//       />
//     );
//   }

//   return (
//     <div className={`avatar avatar--fallback avatar--${size}`}>
//       {fallbackChar}
//     </div>
//   );
// }
// src/components/GeneralComponents/Avatar/Avatar.jsx
import { useNavigate } from 'react-router-dom';
import './Avatar.css';

// دالة لتوليد لون ثابت من نص (مثل البريد الإلكتروني)
function getColorFromString(str) {
  if (!str) return '#4f46e5'; // اللون الافتراضي (أزرق)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // اختيار ألوان دافئة ومتناسقة (على غرار Google)
  const colors = [
    '#DB4437', // أحمر
    '#E67C73', // وردي
    '#F4B400', // أصفر
    '#F09300', // برتقالي
    '#0F9D58', // أخضر
    '#4285F4', // أزرق
    '#7B61FF', // بنفسجي
    '#FF6D01', // برتقالي غامق
    '#46BDC6', // فيروزي
    '#AB47BC', // أرجواني
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export default function Avatar({ 
  src, 
  alt, 
  name, 
  email, 
  size = 'md', 
  onClick, 
  className = '',
  ...props 
}) {
  const navigate = useNavigate();
  const fallbackChar = email ? email.charAt(0).toUpperCase() : (name ? name.charAt(0).toUpperCase() : '?');
  const fallbackColor = getColorFromString(email || name || '');

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      navigate('/profile');
    }
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'المستخدم'}
        className={`avatar avatar--image avatar--${size} ${className}`}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
        onError={(e) => {
          e.target.style.display = 'none';
          // إنشاء عنصر fallback ديناميكياً
          let fallback = e.target.nextElementSibling;
          if (!fallback || !fallback.classList.contains('avatar--fallback')) {
            fallback = document.createElement('div');
            fallback.className = `avatar avatar--fallback avatar--${size} ${className}`;
            fallback.textContent = fallbackChar;
            fallback.style.backgroundColor = fallbackColor;
            fallback.style.cursor = 'pointer';
            fallback.onclick = handleClick;
            e.target.parentNode?.insertBefore(fallback, e.target.nextSibling);
          }
          fallback.style.display = 'flex';
        }}
        {...props}
      />
    );
  }

  return (
    <div
      className={`avatar avatar--fallback avatar--${size} ${className}`}
      style={{ backgroundColor: fallbackColor, cursor: 'pointer' }}
      onClick={handleClick}
      {...props}
    >
      {fallbackChar}
    </div>
  );
}