import { useMemo, useState } from 'react';
import { useLiveIssues } from '../hooks/useLiveIssues';
import IssueDetailModal from '../components/IssueDetailModal';
import './IssuesListPage.css';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'pothole', label: 'Pothole' },
  { value: 'garbage', label: 'Garbage' },
  { value: 'streetlight', label: 'Streetlight' },
  { value: 'drainage', label: 'Drainage' },
  { value: 'road_damage', label: 'Road Damage' },
  { value: 'water_supply', label: 'Water Supply' },
  { value: 'sewage', label: 'Sewage' },
  { value: 'illegal_dumping', label: 'Illegal Dumping' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'reported', label: 'Reported' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All Severity' },
  { value: 'critical', label: 'Critical' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'minor', label: 'Minor' },
];

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

function IssuesListPage() {
  const { issues, loading, error } = useLiveIssues();
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal
  const [selectedIssue, setSelectedIssue] = useState(null);

  const filteredIssues = useMemo(() => {
    let result = [...issues];
    
    // Apply filters
    if (categoryFilter !== 'all') {
      result = result.filter(i => i.category === categoryFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(i => i.status === statusFilter);
    }
    if (severityFilter !== 'all') {
      result = result.filter(i => i.severity === severityFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.description?.toLowerCase().includes(q) ||
        i.locationName?.toLowerCase().includes(q) ||
        i.userName?.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'createdAt':
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
          break;
        case 'priorityScore':
          valA = a.priorityScore;
          valB = b.priorityScore;
          break;
        case 'upvotes':
          valA = a.upvotes;
          valB = b.upvotes;
          break;
        case 'severity':
          const severityOrder = { critical: 3, moderate: 2, minor: 1 };
          valA = severityOrder[a.severity] || 0;
          valB = severityOrder[b.severity] || 0;
          break;
        default:
          valA = a[sortBy];
          valB = b[sortBy];
      }
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
    
    return result;
  }, [issues, categoryFilter, statusFilter, severityFilter, searchQuery, sortBy, sortOrder]);

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffHrs < 48) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const truncate = (text, maxLen = 50) => {
    if (!text) return '';
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIndicator = (field) => {
    if (sortBy !== field) return '';
    return sortOrder === 'desc' ? ' ↓' : ' ↑';
  };

  // Stats
  const stats = useMemo(() => ({
    total: issues.length,
    pending: issues.filter(i => i.status === 'reported').length,
    inProgress: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    critical: issues.filter(i => i.severity === 'critical' && i.status !== 'resolved').length,
  }), [issues]);

  if (loading) {
    return <div className="card">Loading all issues...</div>;
  }

  if (error) {
    return <div className="card" style={{ color: '#dc2626' }}>{error}</div>;
  }

  return (
    <div className="issues-list-page">
      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Issues</span>
        </div>
        <div className="stat-card pending">
          <span className="stat-value">{stats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-card progress">
          <span className="stat-value">{stats.inProgress}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-card resolved">
          <span className="stat-value">{stats.resolved}</span>
          <span className="stat-label">Resolved</span>
        </div>
        <div className="stat-card critical">
          <span className="stat-value">{stats.critical}</span>
          <span className="stat-label">Critical Active</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card filters-card">
        <div className="filters-row">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search by description, location, reporter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <select 
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          <select 
            className="filter-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            {SEVERITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div className="results-info">
          Showing {filteredIssues.length} of {issues.length} issues
        </div>
      </div>

      {/* Issues Table */}
      <div className="card table-card">
        <table className="issues-table">
          <thead>
            <tr>
              <th>Image</th>
              <th onClick={() => toggleSort('createdAt')} className="sortable">
                Date{getSortIndicator('createdAt')}
              </th>
              <th>Category</th>
              <th onClick={() => toggleSort('severity')} className="sortable">
                Severity{getSortIndicator('severity')}
              </th>
              <th>Status</th>
              <th>Location</th>
              <th>Description</th>
              <th>Reporter</th>
              <th onClick={() => toggleSort('upvotes')} className="sortable">
                Upvotes{getSortIndicator('upvotes')}
              </th>
              <th onClick={() => toggleSort('priorityScore')} className="sortable">
                Priority{getSortIndicator('priorityScore')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.length === 0 ? (
              <tr>
                <td colSpan="11" className="empty-state">
                  No issues found matching your filters
                </td>
              </tr>
            ) : (
              filteredIssues.map((issue) => (
                <tr 
                  key={issue.id} 
                  className={`issue-row ${issue.safetyRisk ? 'safety-risk' : ''}`}
                  onClick={() => setSelectedIssue(issue)}
                >
                  <td>
                    {issue.imageUrl ? (
                      <img 
                        src={issue.imageUrl} 
                        alt="" 
                        className="thumbnail"
                      />
                    ) : (
                      <div className="no-image">📷</div>
                    )}
                  </td>
                  <td className="date-cell">{formatDate(issue.createdAt)}</td>
                  <td className="category-cell capitalize">{issue.category}</td>
                  <td>
                    <span 
                      className="severity-pill"
                      style={{ backgroundColor: SEVERITY_COLORS[issue.severity] }}
                    >
                      {issue.severity}
                    </span>
                  </td>
                  <td>
                    <span 
                      className="status-pill"
                      style={{ backgroundColor: STATUS_COLORS[issue.status] }}
                    >
                      {issue.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="location-cell" title={issue.locationName}>
                    {truncate(issue.locationName, 25)}
                  </td>
                  <td className="description-cell" title={issue.description}>
                    {truncate(issue.description, 40)}
                  </td>
                  <td className="reporter-cell">{issue.userName}</td>
                  <td className="upvotes-cell">
                    👍 {issue.upvotes}
                  </td>
                  <td className="priority-cell">
                    <span className={`priority-score ${issue.priorityBand}`}>
                      {issue.priorityScore}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIssue(issue);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onUpdate={() => {
            // Data refreshes automatically via real-time listener
          }}
        />
      )}
    </div>
  );
}

export default IssuesListPage;
