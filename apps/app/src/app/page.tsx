export default function HomePage() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '1rem',
      textAlign: 'center',
      backgroundColor: '#f7f7f7',
      color: '#333',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Deep Work Scheduler
      </h1>
      <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
        Plan your day for maximum productivity
      </p>
      <div style={{ 
        padding: '2rem', 
        maxWidth: '28rem', 
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Coming Soon!
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          Our productivity optimization tool is being deployed. Check back soon!
        </p>
      </div>
    </div>
  );
} 