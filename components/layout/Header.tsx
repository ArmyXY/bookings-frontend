export default function Header() {
  return (
    <header
      style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "20px 24px",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "28px" }}>Panel de administracion</h1>
      <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}>
        Plataforma de gestion de reservas y cobros
      </p>
    </header>
  );
}
