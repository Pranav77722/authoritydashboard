import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import IssuesListPage from './pages/IssuesListPage';
import PriorityQueuePage from './pages/PriorityQueuePage';
import MapOpsPage from './pages/MapOpsPage';
import WorkforcePage from './pages/WorkforcePage';
import ResolutionProofPage from './pages/ResolutionProofPage';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="issues" element={<IssuesListPage />} />
        <Route path="priority" element={<PriorityQueuePage />} />
        <Route path="map-ops" element={<MapOpsPage />} />
        <Route path="workforce" element={<WorkforcePage />} />
        <Route path="resolution" element={<ResolutionProofPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
