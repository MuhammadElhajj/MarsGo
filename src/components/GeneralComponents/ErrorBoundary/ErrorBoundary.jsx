import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("❌ Error Boundary caught:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "'Tajawal', sans-serif",
            direction: "rtl",
            background: "var(--color-bg-primary, #ffffff)",
            color: "var(--color-text-primary, #0f172a)",
          }}
        >
          {/* <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⚠️</div> */}
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            حدث خطأ غير متوقع
          </h2>
          <p style={{ color: "var(--color-text-secondary, #475569)", marginBottom: "1.5rem" }}>
            يرجى تحديث الصفحة أو العودة للرئيسية
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: "0.625rem 1.25rem",
                background: "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: "0.75rem",
                fontFamily: "'Tajawal', sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              تحديث الصفحة
            </button>
            <button
              onClick={this.handleHome}
              style={{
                padding: "0.625rem 1.25rem",
                background: "#f1f5f9",
                color: "#475569",
                border: "none",
                borderRadius: "0.75rem",
                fontFamily: "'Tajawal', sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              الرئيسية
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;