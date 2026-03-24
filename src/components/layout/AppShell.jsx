import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Smart Dashboard' },
  { to: '/issues', label: '📋 All Issues' },
  { to: '/priority', label: 'AI Priority Queue' },
  { to: '/map-ops', label: 'Heatmap & Geo Ops' },
  { to: '/workforce', label: 'Workforce Control' },
  { to: '/resolution', label: 'Proof Resolution' },
  { to: '/analytics', label: 'Performance Analytics' },
];

const titles = {
  '/dashboard': 'Municipal Command Dashboard',
  '/issues': 'All Civic Issues',
  '/priority': 'AI Priority Management',
  '/map-ops': 'Geo Intelligence & Hotspots',
  '/workforce': 'Workforce Assignment & Tracking',
  '/resolution': 'Proof-based Resolution Validation',
  '/analytics': 'Performance & Prediction Insights',
};

function AppShell() {
  const location = useLocation();
  const title = titles[location.pathname] || 'CityFix Authority Console';

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>CityFix Authority</h1>
          <p>Municipal Operating System</p>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <h2>{title}</h2>
          <span className="kpi-note">Role: Admin • Zone: Sangamner Municipal Region</span>
        </header>
        <section className="page">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default AppShell;
