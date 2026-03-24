import { useState, useRef } from 'react';
import { updateIssueStatus, resolveIssue, rejectIssue } from '../../services/issueActions';
import './IssueDetailModal.css';

const STATUS_OPTIONS = [
  { value: 'reported', label: 'Reported', color: '#f59e0b' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'resolved', label: 'Resolved', color: '#10b981' },
  { value: 'rejected', label: 'Rejected', color: '#ef4444' },
];

const SEVERITY_COLORS = {
  critical: '#ef4444',
  moderate: '#f59e0b',
  minor: '#10b981',
};

// Cloudinary config (same as mobile app)
const CLOUDINARY_CLOUD_NAME = 'deq6jl6ur';
const CLOUDINARY_UPLOAD_PRESET = 'City Sangam';

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  
  if (!response.ok) throw new Error('Upload failed');
  const data = await response.json();
  return data.secure_url;
}

function IssueDetailModal({ issue, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('details');
  const [statusNotes, setStatusNotes] = useState('');
  const [newStatus, setNewStatus] = useState(issue.status);
  const [loading, setLoading] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  
  // Resolution proof image
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const fileInputRef = useRef(null);
  
  // Success/Error feedback
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!issue) return null;

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getStatusColor = (status) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || '#6b7280';
  };

  const handleProofImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofImage(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleStatusUpdate = async () => {
    if (newStatus === issue.status && !statusNotes.trim()) return;
    
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      let proofUrl = null;
      
      // Upload proof image if resolving with image
      if (newStatus === 'resolved' && proofImage) {
        setUploadingProof(true);
        proofUrl = await uploadToCloudinary(proofImage);
        setUploadingProof(false);
      }
      
      if (newStatus === 'resolved') {
        await resolveIssue(issue.id, statusNotes, proofUrl);
      } else if (newStatus === 'rejected') {
        await rejectIssue(issue.id, statusNotes);
      } else {
        await updateIssueStatus(issue.id, newStatus, statusNotes);
      }
      
      // Show success message
      const statusLabel = STATUS_OPTIONS.find(s => s.value === newStatus)?.label || newStatus;
      setSuccessMessage(`✅ Issue updated to "${statusLabel}" successfully!`);
      
      onUpdate?.();
      setStatusNotes('');
      setProofImage(null);
      setProofPreview(null);
      
      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to update status:', error);
      setErrorMessage('❌ Failed to update status: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setUploadingProof(false);
    }
  };

  const openInMaps = () => {
    if (issue.latitude && issue.longitude) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`,
        '_blank'
      );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">Issue #{issue.id.slice(0, 8)}</h2>
            <span 
              className="status-badge" 
              style={{ backgroundColor: getStatusColor(issue.status) }}
            >
              {issue.status.replace('_', ' ')}
            </span>
            <span 
              className="severity-badge"
              style={{ backgroundColor: SEVERITY_COLORS[issue.severity] }}
            >
              {issue.severity}
            </span>
            {issue.safetyRisk && (
              <span className="safety-badge">⚠️ Safety Risk</span>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            📋 Details
          </button>
          <button 
            className={`tab-btn ${activeTab === 'location' ? 'active' : ''}`}
            onClick={() => setActiveTab('location')}
          >
            📍 Location
          </button>
          <button 
            className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
            onClick={() => setActiveTab('actions')}
          >
            ⚡ Actions
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {activeTab === 'details' && (
            <div className="details-tab">
              {/* Image Section */}
              {issue.imageUrl && (
                <div className="image-section">
                  <img 
                    src={issue.imageUrl} 
                    alt="Issue" 
                    className={`issue-image ${imageZoomed ? 'zoomed' : ''}`}
                    onClick={() => setImageZoomed(!imageZoomed)}
                  />
                  <p className="image-hint">Click to {imageZoomed ? 'shrink' : 'expand'}</p>
                </div>
              )}

              {/* Issue Info Grid */}
              <div className="info-grid">
                <div className="info-card">
                  <h4>📁 Category</h4>
                  <p className="info-value capitalize">{issue.category}</p>
                </div>
                <div className="info-card">
                  <h4>📅 Reported</h4>
                  <p className="info-value">{formatDate(issue.createdAt)}</p>
                </div>
                <div className="info-card">
                  <h4>👤 Reporter</h4>
                  <p className="info-value">{issue.userName}</p>
                </div>
                <div className="info-card">
                  <h4>👍 Upvotes</h4>
                  <p className="info-value">{issue.upvotes}</p>
                </div>
                <div className="info-card">
                  <h4>💬 Comments</h4>
                  <p className="info-value">{issue.commentsCount}</p>
                </div>
                <div className="info-card">
                  <h4>📊 Priority Score</h4>
                  <p className="info-value">{issue.priorityScore}/100</p>
                </div>
              </div>

              {/* Description */}
              <div className="description-section">
                <h4>📝 Description</h4>
                <p className="description-text">{issue.description || 'No description provided'}</p>
              </div>

              {/* AI Summary */}
              {issue.aiSummary && (
                <div className="ai-section">
                  <h4>🤖 AI Analysis</h4>
                  <p className="ai-summary">{issue.aiSummary}</p>
                  {issue.aiConfidence > 0 && (
                    <div className="confidence-bar-container">
                      <span>Confidence: {Math.round(issue.aiConfidence * 100)}%</span>
                      <div className="confidence-bar">
                        <div 
                          className="confidence-fill"
                          style={{ 
                            width: `${issue.aiConfidence * 100}%`,
                            backgroundColor: issue.aiConfidence > 0.7 ? '#10b981' : issue.aiConfidence > 0.4 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Resolution Info (if resolved) */}
              {issue.status === 'resolved' && (
                <div className="resolution-section">
                  <h4>✅ Resolution Details</h4>
                  <p><strong>Resolved At:</strong> {formatDate(issue.resolvedAt)}</p>
                  {issue.resolutionNotes && <p><strong>Notes:</strong> {issue.resolutionNotes}</p>}
                  {issue.resolutionImageUrl && (
                    <img src={issue.resolutionImageUrl} alt="Resolution proof" className="resolution-image" />
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'location' && (
            <div className="location-tab">
              <div className="location-info-card">
                <h4>📍 Address</h4>
                <p className="location-address">{issue.locationName}</p>
              </div>

              <div className="coordinates-section">
                <div className="coord-box">
                  <span className="coord-label">Latitude</span>
                  <span className="coord-value">{issue.latitude?.toFixed(6) || 'N/A'}</span>
                </div>
                <div className="coord-box">
                  <span className="coord-label">Longitude</span>
                  <span className="coord-value">{issue.longitude?.toFixed(6) || 'N/A'}</span>
                </div>
              </div>

              {issue.latitude && issue.longitude && (
                <button className="maps-btn" onClick={openInMaps}>
                  🗺️ Open in Google Maps
                </button>
              )}

              {issue.landmarkType && issue.landmarkType !== 'other' && (
                <div className="landmark-info">
                  <h4>🏛️ Nearby Landmark Type</h4>
                  <p className="capitalize">{issue.landmarkType}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="actions-tab">
              {/* Status Update */}
              <div className="action-card">
                <h4>🔄 Update Status</h4>
                <div className="status-selector">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`status-option ${newStatus === opt.value ? 'selected' : ''}`}
                      style={{ 
                        borderColor: opt.color,
                        backgroundColor: newStatus === opt.value ? opt.color : 'transparent',
                        color: newStatus === opt.value ? 'white' : opt.color
                      }}
                      onClick={() => setNewStatus(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                
                {/* Resolution Proof Image - only show when resolving */}
                {newStatus === 'resolved' && (
                  <div className="proof-upload-section">
                    <h5>📸 Resolution Proof Photo</h5>
                    <p className="proof-hint">Upload an "after" photo to show the issue is fixed</p>
                    
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleProofImageSelect}
                      style={{ display: 'none' }}
                    />
                    
                    {proofPreview ? (
                      <div className="proof-preview-container">
                        <img src={proofPreview} alt="Proof preview" className="proof-preview" />
                        <button 
                          className="remove-proof-btn"
                          onClick={() => {
                            setProofImage(null);
                            setProofPreview(null);
                          }}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="upload-proof-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        📷 Select Proof Photo
                      </button>
                    )}
                  </div>
                )}
                
                <textarea
                  className="notes-input"
                  placeholder="Add notes (required for resolve/reject)..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                />
                
                {/* Success Message */}
                {successMessage && (
                  <div className="success-message">
                    {successMessage}
                  </div>
                )}
                
                {/* Error Message */}
                {errorMessage && (
                  <div className="error-message">
                    {errorMessage}
                  </div>
                )}
                
                <button 
                  className="update-btn"
                  onClick={handleStatusUpdate}
                  disabled={loading || uploadingProof || successMessage || (newStatus === issue.status && !statusNotes.trim())}
                >
                  {uploadingProof ? '📤 Uploading proof...' : loading ? '⏳ Updating...' : '✓ Update Status'}
                </button>
              </div>

              {/* Assignment Info */}
              <div className="action-card">
                <h4>👷 Assignment</h4>
                {issue.assignedWorkerName ? (
                  <p className="assigned-info">
                    Currently assigned to: <strong>{issue.assignedWorkerName}</strong>
                  </p>
                ) : (
                  <p className="unassigned-info">Not yet assigned to any worker</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="action-card">
                <h4>⚡ Quick Actions</h4>
                <div className="quick-actions">
                  <button 
                    className="quick-btn acknowledge"
                    onClick={() => {
                      setNewStatus('in_progress');
                      setStatusNotes('Issue acknowledged and being processed');
                    }}
                  >
                    ✓ Acknowledge
                  </button>
                  <button 
                    className="quick-btn escalate"
                    onClick={() => {
                      setStatusNotes('ESCALATED: Requires immediate attention');
                    }}
                  >
                    🚨 Escalate
                  </button>
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="action-card">
                <h4>📊 Priority Breakdown</h4>
                <div className="priority-breakdown">
                  <div className="breakdown-item">
                    <span>Severity Score</span>
                    <span className="breakdown-value">{issue.priorityBreakdown?.severityScore || 0}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Location Score</span>
                    <span className="breakdown-value">{issue.priorityBreakdown?.locationScore || 0}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Volume Score</span>
                    <span className="breakdown-value">{issue.priorityBreakdown?.reportVolumeScore || 0}</span>
                  </div>
                  <div className="breakdown-item total">
                    <span>Total Priority</span>
                    <span className="breakdown-value">{issue.priorityScore}/100</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IssueDetailModal;
