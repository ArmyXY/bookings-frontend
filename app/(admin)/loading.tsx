export default function AdminLoading() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '400px',
      gap: '16px'
    }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }}></div>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>Preparando panel...</p>
    </div>
  );
}
