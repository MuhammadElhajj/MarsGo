// import './Loading.css';

// export default function Loading() {
//   return (
//     <div className="loading-spinner" aria-label="جاري التحميل">
//       <div className="spinner"></div>
//     </div>
//   );
// }

import './Loading.css';

export default function Loading({ text = "جاري التحميل" }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <div className="loading-text">
        {text}
      </div>
      <div className="loading-dots">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
    </div>
  );
}