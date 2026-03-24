import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useLiveIssues } from '../hooks/useLiveIssues';

const mapContainerStyle = {
  width: '100%',
  height: '420px',
  borderRadius: '12px',
};

const center = { lat: 19.5687, lng: 74.2103 };

function MapOpsPage() {
  const { issues, loading, error } = useLiveIssues();
  const [windowFilter, setWindowFilter] = useState('30d');

  const filteredIssues = useMemo(() => {
    const days = windowFilter === '7d' ? 7 : windowFilter === '90d' ? 90 : 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return issues.filter((issue) => new Date(issue.createdAt).getTime() >= cutoff);
  }, [issues, windowFilter]);

  const hotAreas = useMemo(() => {
    const count = filteredIssues.reduce((acc, issue) => {
      acc[issue.area] = (acc[issue.area] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(count)
      .map(([name, value]) => {
        const areaIssues = filteredIssues.filter((issue) => issue.area === name);
        const latitudes = areaIssues
          .map((issue) => issue.latitude)
          .filter((latitude) => typeof latitude === 'number');
        const longitudes = areaIssues
          .map((issue) => issue.longitude)
          .filter((longitude) => typeof longitude === 'number');

        const centerLat = latitudes.length
          ? latitudes.reduce((sum, latitude) => sum + latitude, 0) / latitudes.length
          : null;
        const centerLng = longitudes.length
          ? longitudes.reduce((sum, longitude) => sum + longitude, 0) / longitudes.length
          : null;

        return { name, value, centerLat, centerLng };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredIssues]);

  const markers = useMemo(
    () =>
      filteredIssues
      .filter((issue) => typeof issue.latitude === 'number' && typeof issue.longitude === 'number')
      .map((issue) => ({
        id: issue.id,
        title: issue.title,
        status: issue.status,
        severity: issue.severity,
        area: issue.area,
        position: {
          lat: issue.latitude,
          lng: issue.longitude,
        },
      })),
    [filteredIssues]
  );

  const getGoogleMapsUrl = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;

  const openInGoogleMaps = (lat, lng) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return;
    window.open(getGoogleMapsUrl(lat, lng), '_blank', 'noopener,noreferrer');
  };

  const getMarkerColor = (severity) => {
    if (severity === 'critical') return '#ef4444';
    if (severity === 'moderate') return '#f59e0b';
    if (severity === 'minor') return '#10b981';
    return '#3b82f6';
  };

  if (loading) {
    return <div className="card">Loading live geo data...</div>;
  }

  if (error) {
    return <div className="card" style={{ color: '#dc2626' }}>{error}</div>;
  }

  return (
    <>
      <div className="card">
        <h3>Hotspot Trend Controls</h3>
        <div className="filters">
          <select className="select" value={windowFilter} onChange={(event) => setWindowFilter(event.target.value)}>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button className="button" type="button">Generate Heatmap</button>
        </div>
      </div>

      <div className="row-grid">
        <div className="card">
          <h3>Issue Geo Operations (Leaflet)</h3>
          <div style={{ ...mapContainerStyle, overflow: 'hidden', border: '1px solid #dbe4ff' }}>
            <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {markers.map((marker) => (
                <CircleMarker
                  key={marker.id}
                  center={[marker.position.lat, marker.position.lng]}
                  pathOptions={{ color: getMarkerColor(marker.severity), fillOpacity: 0.7 }}
                  radius={8}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <strong>{marker.title || 'Civic Issue'}</strong>
                      <div style={{ marginTop: 4, fontSize: 12, color: '#475569' }}>
                        {marker.area || 'Unknown area'}
                      </div>
                      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span className={`badge ${marker.severity || 'minor'}`}>{marker.severity || 'minor'}</span>
                        <span className="badge">{marker.status || 'reported'}</span>
                      </div>
                      <button
                        className="button"
                        type="button"
                        style={{ marginTop: 10, width: '100%', height: 32 }}
                        onClick={() => openInGoogleMaps(marker.position.lat, marker.position.lng)}
                      >
                        Open in Google Maps
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="card">
          <h3>Worst Affected Areas ({windowFilter})</h3>
          <div className="list">
            {hotAreas.map((area) => (
              <div className="list-item" key={area.name}>
                <div>
                  <span>{area.name}</span>
                  <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>{area.value} reports</div>
                </div>
                <button
                  className="button"
                  type="button"
                  style={{ height: 32 }}
                  disabled={typeof area.centerLat !== 'number' || typeof area.centerLng !== 'number'}
                  onClick={() => openInGoogleMaps(area.centerLat, area.centerLng)}
                >
                  Google Maps
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default MapOpsPage;
