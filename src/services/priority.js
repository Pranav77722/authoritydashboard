const severityWeight = {
  critical: 40,
  moderate: 25,
  minor: 10,
};

const locationWeight = {
  hospital: 20,
  school: 18,
  traffic_junction: 16,
  market: 12,
  residential: 8,
  other: 6,
};

export function calculatePriorityScore(issue) {
  const severityScore = severityWeight[issue.severity] || 10;
  const locationScore = locationWeight[issue.landmarkType || 'other'] || 6;
  const reportCount = issue.reportCount || 1;
  const reportVolumeScore = Math.min(20, 5 * Math.log2(reportCount + 1));

  const createdAt = issue.createdAt ? new Date(issue.createdAt) : new Date();
  const openHours = Math.max(0, (Date.now() - createdAt.getTime()) / (1000 * 60 * 60));
  const ageScore = Math.min(10, openHours / 12);

  const safetyBoost = issue.safetyRisk ? 10 : 0;
  const spamPenalty = issue.spamFlag ? 15 : 0;

  const raw = severityScore + locationScore + reportVolumeScore + ageScore + safetyBoost - spamPenalty;
  const priorityScore = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    priorityScore,
    breakdown: {
      severityScore,
      locationScore,
      reportVolumeScore: Math.round(reportVolumeScore),
      ageScore: Math.round(ageScore),
      safetyBoost,
      spamPenalty,
    },
  };
}

export function getPriorityBand(score) {
  if (score >= 75) return 'critical';
  if (score >= 45) return 'moderate';
  return 'minor';
}
