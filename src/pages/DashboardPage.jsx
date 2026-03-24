import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { buildDashboardMetrics } from '../services/municipalData';
import { useLiveIssues } from '../hooks/useLiveIssues';

const pieColors = ['#4f46e5', '#0ea5e9', '#f59e0b', '#ef4444', '#10b981'];

function DashboardPage() {
  const { issues, loading, error } = useLiveIssues();

  const metrics = useMemo(() => buildDashboardMetrics(issues), [issues]);

  if (loading) {
    return <div className="card">Loading live municipal data...</div>;
  }

  if (error) {
    return <div className="card" style={{ color: '#dc2626' }}>{error}</div>;
  }

  return (
    <>
      <div className="metrics-grid">
        <div className="card">
          <h3>Total Issues (Today)</h3>
          <div className="metric-value">{metrics.daily}</div>
          <div className="metric-trend">Real-time daily intake</div>
        </div>
        <div className="card">
          <h3>Total Issues (Week)</h3>
          <div className="metric-value">{metrics.weekly}</div>
          <div className="metric-trend">Rolling 7-day operational load</div>
        </div>
        <div className="card">
          <h3>Critical Alerts</h3>
          <div className="metric-value">{metrics.criticalCount}</div>
          <div className="metric-trend" style={{ color: '#dc2626' }}>Needs immediate intervention</div>
        </div>
        <div className="card">
          <h3>Resolution Rate</h3>
          <div className="metric-value">{metrics.resolutionRate}%</div>
          <div className="metric-trend">Avg closure time: {metrics.avgResolutionTime} hrs</div>
        </div>
      </div>

      <div className="row-grid">
        <div className="card" style={{ minHeight: 320 }}>
          <h3>Top Problem Categories</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={metrics.topCategories} dataKey="count" nameKey="name" innerRadius={60} outerRadius={96}>
                {metrics.topCategories.map((entry, index) => (
                  <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ minHeight: 320 }}>
          <h3>Worst Affected Areas</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={metrics.worstAreas} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

export default DashboardPage;
