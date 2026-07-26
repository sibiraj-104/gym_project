import { useState } from 'react';

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'support';
  status: 'active' | 'banned';
  joinedAt: string;
}

const INITIAL_USERS: MockUser[] = [
  {
    id: 'usr-101',
    name: 'Sibiraj',
    email: 'sibiraj@gymfuel.com',
    role: 'user',
    status: 'active',
    joinedAt: '2026-06-15',
  },
  {
    id: 'usr-102',
    name: 'Alex Johnson',
    email: 'alex.j@example.com',
    role: 'user',
    status: 'active',
    joinedAt: '2026-06-18',
  },
  {
    id: 'usr-103',
    name: 'Demo Spammer',
    email: 'spammer@botnet.xyz',
    role: 'user',
    status: 'banned',
    joinedAt: '2026-07-01',
  },
  {
    id: 'usr-104',
    name: 'Sarah Miller',
    email: 'sarah.m@fitness.org',
    role: 'admin',
    status: 'active',
    joinedAt: '2026-05-10',
  },
  {
    id: 'usr-105',
    name: 'David Chen',
    email: 'david.c@techcorp.io',
    role: 'user',
    status: 'active',
    joinedAt: '2026-07-20',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'users' | 'foods' | 'workouts' | 'logs'
  >('dashboard');
  const [role, setRole] = useState<string>('admin');
  const [users, setUsers] = useState<MockUser[]>(INITIAL_USERS);
  const [auditLog, setAuditLog] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] System initialized in Staging Mode.`,
    `[${new Date().toLocaleTimeString()}] AWS EC2 node eu-north-1 connected cleanly.`,
  ]);

  const handleAction = (actionName: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setAuditLog((prev) => [
      `[${timestamp}] [Role: ${role.toUpperCase()}] ${actionName}`,
      ...prev,
    ]);
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'active' ? 'banned' : 'active';
          handleAction(
            `${nextStatus === 'banned' ? 'Banned' : 'Unbanned'} User: ${u.email} (${u.id})`,
          );
          return { ...u, status: nextStatus };
        }
        return u;
      }),
    );
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="brand-icon">⚡</div>
          <div>
            <div className="brand-name">GymFuel</div>
            <div className="brand-badge">ADMIN v1.0</div>
          </div>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Overview Dashboard
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 User Management ({users.length})
          </button>
          <button
            className={`nav-item ${activeTab === 'foods' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('foods');
              handleAction('Navigated to Food Database Manager');
            }}
          >
            🥗 Food Database
          </button>
          <button
            className={`nav-item ${activeTab === 'workouts' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('workouts');
              handleAction('Navigated to Workout Templates Manager');
            }}
          >
            🏋️ Routine Templates
          </button>
          <button
            className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            🖥️ Audit Stream
          </button>
        </nav>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-dim)',
              marginBottom: '0.5rem',
            }}
          >
            SERVER HOST: 56.228.25.217
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--lime)',
              fontWeight: 600,
            }}
          >
            ● AWS EC2 (eu-north-1)
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        {/* Top Header */}
        <header className="admin-header">
          <div className="header-title">
            <h1>GymFuel Management Console</h1>
            <p className="header-subtitle">
              Monitor server telemetry, audit logs, and manage member accounts.
            </p>
          </div>

          <div className="role-pill-container">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Role Context:
            </span>
            <select
              className="role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Super Admin</option>
              <option value="support">Support Agent</option>
              <option value="developer">Developer</option>
            </select>
          </div>
        </header>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-title">Total Members</div>
            <div className="metric-val">{users.length + 1477}</div>
            <span className="metric-trend trend-up">↑ 12% this week</span>
          </div>

          <div className="metric-card">
            <div className="metric-title">AI Scans Today</div>
            <div className="metric-val">3,892</div>
            <span className="metric-trend trend-up">↑ 24% vs yesterday</span>
          </div>

          <div className="metric-card">
            <div className="metric-title">Active WebSocket Sessions</div>
            <div className="metric-val">342</div>
            <span className="metric-trend trend-up">● Healthy</span>
          </div>

          <div className="metric-card">
            <div className="metric-title">AWS Server Load</div>
            <div className="metric-val" style={{ color: 'var(--cyan)' }}>
              14%
            </div>
            <span className="metric-trend trend-up">Uptime: 8.6 days</span>
          </div>
        </div>

        {/* Quick Admin Actions */}
        <section className="section-card">
          <div className="section-title">⚡ Quick Management Controls</div>
          <div className="btn-group">
            <button
              className="btn btn-primary"
              onClick={() => handleAction('Triggered Full System Backup')}
            >
              📥 Export User Database
            </button>
            <button
              className="btn btn-secondary"
              onClick={() =>
                handleAction('Flushed Redis Cache (0 keys evicted)')
              }
            >
              🧹 Flush Redis Cache
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleAction('Approved 14 New Food Items')}
            >
              🥗 Approve Pending Foods
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleAction('Cleared Stale Guest Sessions')}
            >
              ⚠️ Purge Stale Sessions
            </button>
          </div>
        </section>

        {/* User Management Table */}
        <section className="section-card">
          <div className="section-title">👥 Member User Accounts</div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Member Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        color: 'var(--cyan)',
                      }}
                    >
                      {u.id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background:
                            u.role === 'admin'
                              ? 'rgba(168, 85, 247, 0.2)'
                              : 'rgba(255,255,255,0.06)',
                          color: u.role === 'admin' ? 'var(--purple)' : '#fff',
                        }}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${u.status === 'active' ? 'status-active' : 'status-banned'}`}
                      >
                        {u.status === 'active' ? '● Active' : '✕ Banned'}
                      </span>
                    </td>
                    <td
                      style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}
                    >
                      {u.joinedAt}
                    </td>
                    <td>
                      <button
                        className={`btn ${u.status === 'active' ? 'btn-danger' : 'btn-secondary'}`}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                        }}
                        onClick={() => toggleUserStatus(u.id)}
                      >
                        {u.status === 'active' ? 'Ban User' : 'Unban User'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Audit Log Terminal Stream */}
        <section className="section-card">
          <div className="section-title">
            🖥️ Real-time Admin Audit Log Stream
          </div>
          <div className="log-box">
            {auditLog.map((log, idx) => (
              <div key={idx} className="log-entry">
                {log}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
