import { collection, onSnapshot } from 'firebase/firestore';
import { db, hasFirebaseConfig, authReadyPromise } from './firebase';
import { calculatePriorityScore, getPriorityBand } from './priority';

function normalizeIssue(issue) {
  const { priorityScore, breakdown } = calculatePriorityScore(issue);
  return {
    ...issue,
    priorityScore,
    priorityBand: getPriorityBand(priorityScore),
    priorityBreakdown: breakdown,
  };
}

function mapIssueDoc(docItem) {
  const data = docItem.data();
  return normalizeIssue({
    // Core identifiers
    id: docItem.id,
    
    // Reporter information
    userId: data.userId || null,
    userName: data.userName || 'Anonymous',
    
    // Issue content
    imageUrl: data.imageUrl || null,
    description: data.description || '',
    aiSummary: data.aiSummary || '',
    
    // Classification
    category: data.category || 'other',
    severity: data.severity || 'moderate',
    safetyRisk: !!data.safetyRisk,
    
    // AI analysis metadata
    aiConfidence: data.aiConfidence || 0,
    
    // Location data
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    area: data.locationName || 'Unknown',
    locationName: data.locationName || 'Unknown',
    landmarkType: data.landmarkType || 'other',
    
    // Status and engagement
    status: data.status || 'reported',
    upvotes: data.upvotes || 0,
    upvotedBy: data.upvotedBy || [],
    commentsCount: data.commentsCount || 0,
    reportCount: data.reportCount || 1,
    
    // Resolution tracking
    assignedWorker: data.assignedToWorkerId || null,
    assignedWorkerName: data.assignedWorkerName || null,
    timeTakenHours: data.timeTakenHours || 0,
    resolvedAt: data.resolvedAt?.toDate?.()?.toISOString?.() || null,
    resolutionNotes: data.resolutionNotes || '',
    resolutionImageUrl: data.resolutionImageUrl || null,
    
    // Timestamps
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
  });
}

export function subscribeToIssues(onData, onError) {
  if (!hasFirebaseConfig || !db) {
    onError?.(new Error('Firebase env is missing. Add VITE_FIREBASE_* values to authority-dashboard/.env.'));
    onData?.([]);
    return () => {};
  }

  let unsubscribe = () => {};

  // Wait for auth to be ready before subscribing to Firestore
  authReadyPromise.then(() => {
    unsubscribe = onSnapshot(
      collection(db, 'issues'),
      (snapshot) => {
        const issues = snapshot.docs.map(mapIssueDoc);
        onData(issues);
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        onError?.(error);
      }
    );
  }).catch((error) => {
    onError?.(error);
  });

  return () => unsubscribe();
}

export function buildDashboardMetrics(issues) {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  let daily = 0;
  let weekly = 0;
  let monthly = 0;

  issues.forEach((issue) => {
    const ts = new Date(issue.createdAt).getTime();
    if (ts >= dayAgo) daily += 1;
    if (ts >= weekAgo) weekly += 1;
    if (ts >= monthAgo) monthly += 1;
  });

  const resolvedCount = issues.filter((issue) => issue.status === 'resolved').length;
  const criticalCount = issues.filter((issue) => issue.priorityBand === 'critical' && issue.status !== 'resolved').length;

  const categoryCount = issues.reduce((acc, issue) => {
    acc[issue.category] = (acc[issue.category] || 0) + 1;
    return acc;
  }, {});

  const areaCount = issues.reduce((acc, issue) => {
    acc[issue.area] = (acc[issue.area] || 0) + 1;
    return acc;
  }, {});

  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const worstAreas = Object.entries(areaCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const avgResolutionTime = resolvedCount
    ? Math.round(
        issues
          .filter((issue) => issue.status === 'resolved')
          .reduce((sum, issue) => sum + (issue.timeTakenHours || 0), 0) / resolvedCount
      )
    : 0;

  const resolutionRate = issues.length ? Math.round((resolvedCount / issues.length) * 100) : 0;

  return {
    daily,
    weekly,
    monthly,
    criticalCount,
    resolutionRate,
    avgResolutionTime,
    topCategories,
    worstAreas,
  };
}
