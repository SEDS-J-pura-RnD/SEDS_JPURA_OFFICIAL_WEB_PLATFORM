export default function Loading() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: "1.25rem",
      animation: "fadeIn 0.5s ease-in-out"
    }}>
      <div className="spinner" style={{
        width: 44,
        height: 44,
        borderWidth: "3px",
        borderColor: "rgba(99, 102, 241, 0.1)",
        borderTopColor: "var(--color-stellar, #38bdf8)",
        boxShadow: "0 0 16px rgba(56, 189, 248, 0.2)"
      }} />
      <div style={{
        fontFamily: "var(--font-display, inherit)",
        fontSize: "0.75rem",
        fontWeight: 700,
        letterSpacing: "0.15em",
        color: "var(--color-text-dim, #6b7280)",
        textTransform: "uppercase"
      }}>
        Establishing Uplink...
      </div>
    </div>
  );
}
