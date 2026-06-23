import { useState } from 'react';

export default function App() {
  const [role, setRole] = useState<string>('support');
  const [auditLog, setAuditLog] = useState<string[]>([]);

  const handleAction = (actionName: string) => {
    setAuditLog((prev) => [
      `[${new Date().toLocaleTimeString()}] Role: ${role} - Performed: ${actionName}`,
      ...prev,
    ]);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>GymFuel Admin Panel</h1>
      <p>Manage users, database items, and check system logs.</p>

      <div style={{ margin: '1rem 0' }}>
        <label>
          Active Role Profile:
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">Super Admin</option>
            <option value="support">Support Agent</option>
            <option value="developer">Developer</option>
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
        <button onClick={() => handleAction('Export User Data')}>Export Users</button>
        <button onClick={() => handleAction('Banned Flagged User')}>Ban Spammer</button>
        <button onClick={() => handleAction('Cleared Cache')}>Clear Redis Cache</button>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Admin Audit Log Simulator</h3>
        <ul style={{ background: '#f5f5f5', padding: '1rem', listStyle: 'none', borderRadius: '4px' }}>
          {auditLog.length === 0 ? (
            <li style={{ color: '#666' }}>No actions logged yet.</li>
          ) : (
            auditLog.map((log, idx) => <li key={idx}>{log}</li>)
          )}
        </ul>
      </div>
    </div>
  );
}
