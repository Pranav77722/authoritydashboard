import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from 'recharts';

const monthlyResolution = [
  { month: 'Nov', rate: 61, avgHours: 42 },
  { month: 'Dec', rate: 66, avgHours: 39 },
  { month: 'Jan', rate: 68, avgHours: 36 },
  { month: 'Feb', rate: 72, avgHours: 33 },
  { month: 'Mar', rate: 78, avgHours: 29 },
];

const predictedRisks = [
  { area: 'Shivaji Chowk', category: 'pothole', risk: 84 },
  { area: 'Market Yard', category: 'garbage', risk: 79 },
  { area: 'Civil Hospital Road', category: 'water_leak', risk: 73 },
];

function AnalyticsPage() {
  return (
    <>
      <div className="metrics-grid">
        <div className="card">
          <h3>Area-wise SLA Compliance</h3>
          <div className="metric-value">74%</div>
          <div className="metric-trend">+6% vs last month</div>
        </div>
        <div className="card">
          <h3>Worker Efficiency</h3>
          <div className="metric-value">81%</div>
          <div className="metric-trend">Based on on-time closure ratio</div>
        </div>
        <div className="card">
          <h3>Avg Resolution Time</h3>
          <div className="metric-value">29h</div>
          <div className="metric-trend">Trend improving monthly</div>
        </div>
        <div className="card">
          <h3>Monthly Report Health</h3>
          <div className="metric-value">A-</div>
          <div className="metric-trend">Service quality benchmark</div>
        </div>
      </div>

      <div className="row-grid">
        <div className="card">
          <h3>Resolution Rate Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyResolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="rate" stroke="#4f46e5" fill="#c7d2fe" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Average Resolution Time (Hours)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyResolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="avgHours" stroke="#0ea5e9" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>Predictive Alerts (Historical Pattern Model)</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Area</th>
              <th>Category</th>
              <th>Risk Score</th>
              <th>Suggested Preemptive Action</th>
            </tr>
          </thead>
          <tbody>
            {predictedRisks.map((risk) => (
              <tr key={`${risk.area}-${risk.category}`}>
                <td>{risk.area}</td>
                <td>{risk.category}</td>
                <td><strong>{risk.risk}</strong>/100</td>
                <td>Schedule preventive ward inspection within 48h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default AnalyticsPage;
