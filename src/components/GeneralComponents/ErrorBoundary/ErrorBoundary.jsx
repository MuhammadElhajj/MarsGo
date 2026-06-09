import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>⚠️ حدث خطأ غير متوقع</h2>
          <p>نعتذر عن الإزعاج، الفريق الفني يعمل على حل المشكلة.</p>
          <button onClick={() => window.location.reload()}>تحديث الصفحة</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;