// import './Button.css';

// export default function Button({ children, onClick, variant = 'primary', className = '', type = 'button', ...props }) {
//   return (
//     <button
//       type={type}
//       className={`btn btn--${variant} ${className}`}
//       onClick={onClick}
//       {...props}
//     >
//       {children}
//     </button>
//   );
// }

import './Button.css';

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  type = 'button', 
  disabled = false,
  ...props 
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}