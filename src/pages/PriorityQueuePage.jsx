import { useMemo, useState } from 'react';
import { useLiveIssues } from '../hooks/useLiveIssues';
import IssueDetailModal from '../components/IssueDetailModal';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  moderate: '#f59e0b',
  minor: '#10b981',
};

const STATUS_COLORS = {
  reported: '#f59e0b',
  in_progress: '#3b82f6',
  resolved: '#10b981',
  rejected: '#ef4444',
};

function PriorityQueuePage() {
  const { issues, loading, error } = useLiveIssues();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIssue, setSelectedIssue] = useState(null);

  const rankedIssues = useMemo(() => {
    return issues
      .filter((issue) => statusFilter === 'all' || issue.status === statusFilter)
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [issues, statusFilter]);

  const truncate = (text, maxLen = 30) => {
    if (!text) return '';
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
  };

  if (loading) {
    return <div className="card">Loading live priority queue...</div>;
  }

  if (error) {
    return <div className="card" style={{ color: '#dc2626' }}>{error}</div>;
  }

  return (
    <>
      <div className="card">
        <h3>AI Priority Controls</h3>
        <div className="filters">
          <select className="select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All Status</option>
            <option value="reported">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Showing {rankedIssues.length} issues sorted by priority
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <h3 style={{ padding: '16px 20px', margin: 0, borderBottom: '1px solid #334155' }}>
          Urgency Ranked Queue
        </h3>
        <table className="table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Description</th>
              <th>Area</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Severity</th>
              <th>Safety</th>
              <th>Upvotes</th>
              <th>Breakdown</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rankedIssues.map((issue) => (
              <tr 
                key={issue.id} 
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedIssue(issue)}
              >
                <td>
                  {issue.imageUrl ? (
                    <img 
                      src={issue.imageUrl} 
                      alt="" 
                      style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                    />
                  ) : (
                    <div style={{ 
                      width: 48, height: 48, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#334155', borderRadius: 6 
                    }}>📷</div>
                  )}
                </td>
                <td style={{ maxWidth: 200 }} title={issue.description}>
                  {truncate(issue.description, 35)}
                </td>
                <td title={issue.area}>{truncate(issue.area, 20)}</td>
                <td>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: 12,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'white',
                    backgroundColor: STATUS_COLORS[issue.status] || '#6b7280'
                  }}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <strong style={{ 
                    color: issue.priorityScore >= 70 ? '#ef4444' : issue.priorityScore >= 50 ? '#f59e0b' : '#3b82f6'
                  }}>
                    {issue.priorityScore}
                  </strong>/100
                </td>
                <td>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: 12,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'white',
                    backgroundColor: SEVERITY_COLORS[issue.severity]
                  }}>
                    {issue.severity}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {issue.safetyRisk ? '⚠️' : '—'}
                </td>
                <td style={{ textAlign: 'center' }}>
                  👍 {issue.upvotes}
                </td>
                <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  S:{issue.priorityBreakdown?.severityScore || 0} • 
                  L:{issue.priorityBreakdown?.locationScore || 0} • 
                  V:{issue.priorityBreakdown?.reportVolumeScore || 0}
                </td>
                <td>
                  <button 
                    className="button"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIssue(issue);
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onUpdate={() => {}}
        />
      )}
    </>
  );
}

export default PriorityQueuePage;
