function ResolutionProofPage() {
  return (
    <>
      <div className="row-grid">
        <div className="card">
          <h3>Before / After Evidence</h3>
          <div className="list">
            <div className="list-item" style={{ minHeight: 190, justifyContent: 'center' }}>Before Image Preview</div>
            <div className="list-item" style={{ minHeight: 190, justifyContent: 'center' }}>After Image Preview</div>
          </div>
        </div>

        <div className="card">
          <h3>AI Resolution Validation</h3>
          <div className="list">
            <div className="list-item"><span>Validation Score</span><strong>91%</strong></div>
            <div className="list-item"><span>Defect Presence</span><strong>Low</strong></div>
            <div className="list-item"><span>Recommended Action</span><strong>Approve Closure</strong></div>
          </div>
          <div className="filters" style={{ marginTop: 12 }}>
            <button className="button" type="button">Approve Resolution</button>
            <button className="input" type="button">Request Rework</button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Citizen & Worker Notifications</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Recipient</th>
              <th>Channel</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Issue Resolved</td>
              <td>Citizen (userId: U-211)</td>
              <td>In-app + push</td>
              <td>Queued</td>
            </tr>
            <tr>
              <td>Task Closure Approved</td>
              <td>Road Repair Team A</td>
              <td>In-app</td>
              <td>Sent</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ResolutionProofPage;
