export default function Loading() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "75vh",
      gap: "1.25rem",
      animation: "fadeIn 0.5s ease-in-out"
    }}>
      <div className="spinner" style={{
        width: 44,
        height: 44,
        borderWidth: "3px",
        borderColor: "rgba(236, 72, 153, 0.1)",
        borderTopColor: "var(--color-plasma, #ec4899)",
        boxShadow: "0 0 16px rgba(236, 72, 153, 0.2)"
      }} />
      <div style={{
        fontFamily: "var(--font-display, inherit)",
        fontSize: "0.75rem",
        fontWeight: 700,
        letterSpacing: "0.15em",
        color: "var(--color-text-dim, #6b7280)",
        textTransform: "uppercase"
      }}>
        Loading Control Console...
      </div>
    </div>
  );
}
