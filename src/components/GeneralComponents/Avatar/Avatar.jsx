// import './Avatar.css';

// export default function Avatar({ src, alt, name, email, size = 'md' }) {
//   // استخراج الحرف الأول من البريد الإلكتروني (أو الاسم إن لم يوجد)
//   const fallbackChar = email ? email.charAt(0).toUpperCase() : (name ? name.charAt(0).toUpperCase() : '?');

//   if (src) {
//     return (
//       <img
//         src={src}
//         alt={alt || name || 'المستخدم'}
//         className={`avatar avatar--image avatar--${size}`}
//         onError={(e) => {
//           e.target.style.display = 'none'; // إخفاء الصورة وإظهار الحرف
//           e.target.nextSibling.style.display = 'flex';
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


import './Avatar.css';

export default function Avatar({ src, alt, name, email, size = 'md' }) {
  const fallbackChar = email ? email.charAt(0).toUpperCase() : (name ? name.charAt(0).toUpperCase() : '?');

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'المستخدم'}
        className={`avatar avatar--image avatar--${size}`}
        onError={(e) => {
          e.target.style.display = 'none';
          // إنشاء عنصر fallback ديناميكياً إذا لم يكن موجوداً
          let fallback = e.target.nextElementSibling;
          if (!fallback || !fallback.classList.contains('avatar--fallback')) {
            fallback = document.createElement('div');
            fallback.className = `avatar avatar--fallback avatar--${size}`;
            fallback.textContent = fallbackChar;
            e.target.parentNode?.insertBefore(fallback, e.target.nextSibling);
          }
          fallback.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <div className={`avatar avatar--fallback avatar--${size}`}>
      {fallbackChar}
    </div>
  );
}