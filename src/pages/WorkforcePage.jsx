import { useMemo, useState } from 'react';
import { useLiveIssues } from '../hooks/useLiveIssues';
import { assignIssueToWorker } from '../services/issueActions';
import IssueDetailModal from '../components/IssueDetailModal';

const workers = [
  {
    id: 'WRK-01',
    name: 'Road Repair Team A',
    recipientName: 'Ramesh Patil',
    activeTasks: 3,
    zone: 'North Ward',
    efficiency: 82,
    email: 'prnvconsole@gmail.com',
  },
  {
    id: 'WRK-02',
    name: 'Solid Waste Unit B',
    recipientName: 'Ramesh Patil',
    activeTasks: 4,
    zone: 'Market Zone',
    efficiency: 76,
    email: 'prnvconsole@gmail.com',
  },
  {
    id: 'WRK-03',
    name: 'Electrical Team C',
    recipientName: 'Ramesh Patil',
    activeTasks: 2,
    zone: 'Central Ward',
    efficiency: 88,
    email: 'prnvconsole@gmail.com',
  },
];

function WorkforcePage() {
  const { issues, loading, error } = useLiveIssues();
  const [selectedWorker, setSelectedWorker] = useState(workers[0].id);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const selectedWorkerInfo = useMemo(
    () => workers.find((worker) => worker.id === selectedWorker),
    [selectedWorker]
  );

  const pendingTasks = useMemo(() => {
    return issues
      .filter((issue) => issue.status !== 'resolved' && !issue.assignedWorker && !issue.assignedToWorkerId)
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 8)
      .map((issue) => ({
        id: issue.id,
        title: issue.category ? `${String(issue.category).replace('_', ' ')} issue` : 'Civic issue',
        issue: issue.description || `${issue.category} issue`,
        priority: issue.priorityScore,
        rawIssue: issue,
      }));
  }, [issues]);

  const inProgressTasks = useMemo(() => {
    return issues
      .filter((issue) => issue.status === 'in_progress' && (issue.assignedWorkerName || issue.assignedWorker))
      .sort((a, b) => (new Date(b.updatedAt || 0)).getTime() - (new Date(a.updatedAt || 0)).getTime())
      .slice(0, 8);
  }, [issues]);

  const workforceStats = useMemo(() => {
    const openCount = issues.filter((issue) => issue.status !== 'resolved').length;
    const assignedCount = issues.filter((issue) => issue.status === 'in_progress').length;
    const resolvedTodayCount = issues.filter((issue) => {
      if (!issue.resolvedAt) return false;
      const resolvedDate = new Date(issue.resolvedAt);
      const now = new Date();
      return (
        resolvedDate.getDate() === now.getDate() &&
        resolvedDate.getMonth() === now.getMonth() &&
        resolvedDate.getFullYear() === now.getFullYear()
      );
    }).length;

    return { openCount, assignedCount, resolvedTodayCount };
  }, [issues]);

  const handleManualAssign = async (task) => {
    if (!selectedWorkerInfo) return;
    try {
      await assignIssueToWorker(
        task.id,
        selectedWorkerInfo.id,
        selectedWorkerInfo.name,
        selectedWorkerInfo.email,
        task.issue,
        task.priority,
        {
          ...task.rawIssue,
          recipientName: selectedWorkerInfo.recipientName,
        }
      );
      alert(`Task ${task.id} assigned to ${selectedWorkerInfo.name} and email sent!`);
    } catch (err) {
      console.error('Assignment error:', err);
      alert('Failed to assign task: ' + err.message);
    }
  };

  if (loading) {
    return <div className="card">Loading workforce tasks...</div>;
  }

  if (error) {
    return <div className="card" style={{ color: '#dc2626' }}>{error}</div>;
  }

  return (
    <>
      <div className="metrics-grid">
        <div className="card">
          <h3>Open Tasks</h3>
          <div className="metric-value">{workforceStats.openCount}</div>
          <div className="kpi-note">All unresolved issues</div>
        </div>
        <div className="card">
          <h3>Assigned Tasks</h3>
          <div className="metric-value">{workforceStats.assignedCount}</div>
          <div className="kpi-note">Currently in progress</div>
        </div>
        <div className="card">
          <h3>Resolved Today</h3>
          <div className="metric-value">{workforceStats.resolvedTodayCount}</div>
          <div className="kpi-note">Completed in current day</div>
        </div>
        <div className="card">
          <h3>Assignment Recipient</h3>
          <div className="metric-value" style={{ fontSize: 20 }}>Ramesh Patil</div>
          <div className="kpi-note">prnvconsole@gmail.com</div>
        </div>
      </div>

      <div className="row-grid">
        <div className="card">
          <h3>Worker / Team Assignment Console</h3>
          <div className="kpi-note" style={{ marginBottom: 10 }}>
            Select a team and assign from pending issues. Tap View Details to inspect full issue information before assignment.
          </div>
          <div className="filters">
            <select className="select" value={selectedWorker} onChange={(event) => setSelectedWorker(event.target.value)}>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>{worker.name}</option>
              ))}
            </select>
          </div>
          {selectedWorkerInfo && (
            <div className="list" style={{ marginTop: 12 }}>
              <div className="list-item"><span>Recipient Name</span><strong>{selectedWorkerInfo.recipientName}</strong></div>
              <div className="list-item"><span>Email</span><strong>{selectedWorkerInfo.email}</strong></div>
              <div className="list-item"><span>Zone</span><strong>{selectedWorkerInfo.zone}</strong></div>
              <div className="list-item"><span>Active Tasks</span><strong>{selectedWorkerInfo.activeTasks}</strong></div>
              <div className="list-item"><span>Efficiency</span><strong>{selectedWorkerInfo.efficiency}%</strong></div>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Daily Worker Task List</h3>
          <div className="list">
            {pendingTasks.map((task) => (
              <div key={task.id} className="list-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={{flex: 1}}>
                  <div style={{ fontWeight: 700, marginBottom: 4, textTransform: 'capitalize' }}>{task.title}</div>
                  <button
                    className="input"
                    type="button"
                    onClick={() => setSelectedIssue(task.rawIssue)}
                    style={{ height: 28, padding: '0 10px', fontWeight: 700 }}
                  >
                    View Details
                  </button>
                  <div className="kpi-note">{task.issue}</div>
                  <div className="kpi-note" style={{ marginTop: 4 }}>
                    {task.rawIssue.locationName || task.rawIssue.area || 'Location unavailable'} | {task.rawIssue.category || 'general'}
                  </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span className="badge critical">{task.priority}</span>
                  <button 
                    className="button" 
                    type="button" 
                    onClick={() => handleManualAssign(task)}
                    style={{padding: '4px 8px', fontSize: '12px'}}
                  >
                    Assign to {selectedWorkerInfo?.name}
                  </button>
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="list-item">No pending unassigned tasks in live data.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Task Tracking Table</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Issue</th>
              <th>Assigned Worker</th>
              <th>Status</th>
              <th>Time Taken</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inProgressTasks.map((issue) => (
              <tr key={issue.id}>
                <td>
                  <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{issue.category || 'Civic issue'}</div>
                  <div className="kpi-note">{issue.locationName || issue.area || 'Location unavailable'}</div>
                </td>
                <td>{issue.assignedWorkerName || issue.assignedWorker || 'Unassigned'}</td>
                <td><span className="badge in_progress">in progress</span></td>
                <td>{issue.timeTakenHours ? `${issue.timeTakenHours} hrs` : 'Tracking'}</td>
                <td>
                  <button className="input" type="button" onClick={() => setSelectedIssue(issue)}>
                    Open Issue
                  </button>
                </td>
              </tr>
            ))}
            {inProgressTasks.length === 0 && (
              <tr>
                <td colSpan={5}>No active assigned tasks yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onUpdate={() => {
            // Data refreshes automatically through useLiveIssues realtime subscription.
          }}
        />
      )}
    </>
  );
}

export default WorkforcePage;
