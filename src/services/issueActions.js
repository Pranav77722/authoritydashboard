import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, hasFirebaseConfig } from './firebase';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const EMAILJS_DEFAULT_TO_EMAIL = import.meta.env.VITE_EMAILJS_DEFAULT_TO_EMAIL || 'prnvconsole@gmail.com';

/**
 * Update issue status with optional notes
 */
export async function updateIssueStatus(issueId, status, notes = '') {
  if (!hasFirebaseConfig || !db) {
    throw new Error('Firebase not configured');
  }
  
  const issueRef = doc(db, 'issues', issueId);
  const updateData = {
    status,
    updatedAt: serverTimestamp(),
  };
  
  if (status === 'resolved') {
    updateData.resolvedAt = serverTimestamp();
    if (notes) updateData.resolutionNotes = notes;
  }
  
  await updateDoc(issueRef, updateData);
  
  // Log status update for audit trail
  await addDoc(collection(db, 'updates'), {
    issueId,
    status,
    notes,
    createdAt: serverTimestamp(),
    type: 'status_change',
  });
  
  // Notify Citizen
  await sendCitizenNotification(
    issueId, 
    'Status Updated 📝', 
    `Your issue's status was changed to: ${status.replace('_', ' ')}.`
  );
}

/**
 * Assign issue to a worker
 */
export async function assignIssueToWorker(
  issueId,
  workerId,
  workerName,
  workerEmail = '',
  issueDescription = '',
  priority = '',
  issueDetails = {}
) {
  if (!hasFirebaseConfig || !db) {
    throw new Error('Firebase not configured');
  }
  
  const issueRef = doc(db, 'issues', issueId);
  await updateDoc(issueRef, {
    assignedToWorkerId: workerId,
    assignedWorkerName: workerName,
    status: 'in_progress',
    updatedAt: serverTimestamp(),
  });
  
  await addDoc(collection(db, 'updates'), {
    issueId,
    status: 'in_progress',
    notes: `Assigned to ${workerName}`,
    createdAt: serverTimestamp(),
    type: 'assignment',
  });

  // Add worker-facing in-app notification entry for assignment tracking.
  await addDoc(collection(db, 'notifications'), {
    workerId,
    issueId,
    title: 'New Task Assigned',
    message: `A new issue (${issueId}) is assigned to ${workerName}.`,
    isRead: false,
    channel: 'in_app',
    createdAt: serverTimestamp(),
  });
  
  // 1. Notify Citizen
  await sendCitizenNotification(
    issueId, 
    'Issue In Progress 👷', 
    `Worker ${workerName} has been assigned and is working on your issue!`
  );

  // 2. Notify Assigned Worker via EmailJS
  try {
      if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        console.warn(
          'EmailJS is not configured. Set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY in authority-dashboard/.env'
        );
        return;
      }

      const emailjs = await import('@emailjs/browser');
      const recipientEmail = String(workerEmail || issueDetails.email || EMAILJS_DEFAULT_TO_EMAIL).trim();
      if (!recipientEmail) {
        console.warn('Skipping EmailJS send because recipient email is empty.');
        return;
      }

      const latitude = issueDetails.latitude ?? '';
      const longitude = issueDetails.longitude ?? '';
      const hasCoordinates = latitude !== '' && longitude !== '';
      const locationName = issueDetails.locationName || issueDetails.area || 'Location unavailable';
      const areaName = issueDetails.area || issueDetails.locationName || 'Area unavailable';
      const encodedQuery = encodeURIComponent(`${locationName}, ${areaName}`);
      const mapsLink = hasCoordinates
        ? `https://www.google.com/maps?q=${latitude},${longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
      const locationFullText = hasCoordinates
        ? `${locationName}, ${areaName} (${latitude}, ${longitude})`
        : `${locationName}, ${areaName}`;

      const templateParams = {
        to_email: recipientEmail,
        email: recipientEmail,
        user_email: recipientEmail,
        recipient_email: recipientEmail,
        to_name: issueDetails.recipientName || workerName,
        worker_email: recipientEmail,
        worker_name: workerName,
        issue_id: issueId,
        issue_description: issueDescription || 'New task assigned through the dashboard.',
        priority: priority || 'Normal',
        assigned_at: new Date().toLocaleString(),
        issue_category: issueDetails.category || 'Not specified',
        issue_severity: issueDetails.severity || 'Not specified',
        issue_location_name: locationName,
        issue_area: areaName,
        issue_location_full: locationFullText,
        issue_latitude: hasCoordinates ? String(latitude) : 'N/A',
        issue_longitude: hasCoordinates ? String(longitude) : 'N/A',
        issue_maps_link: mapsLink,
        issue_reported_by: issueDetails.userName || 'Citizen',
        issue_status: issueDetails.status || 'reported',
        issue_created_at: issueDetails.createdAt
          ? new Date(issueDetails.createdAt).toLocaleString()
          : 'N/A',
        issue_summary: issueDetails.aiSummary || issueDescription || 'N/A',
      };

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      console.log('Worker email notification sent successfully to', recipientEmail);
  } catch (emailError) {
    console.error('Failed to send worker email notification:', emailError);
  }
}

/**
 * Mark issue as resolved with proof image
 */
export async function resolveIssue(issueId, notes, proofImageUrl = null) {
  if (!hasFirebaseConfig || !db) {
    throw new Error('Firebase not configured');
  }
  
  const issueRef = doc(db, 'issues', issueId);
  const updateData = {
    status: 'resolved',
    resolutionNotes: notes,
    resolvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  if (proofImageUrl) {
    updateData.resolutionImageUrl = proofImageUrl;
  }
  
  await updateDoc(issueRef, updateData);
  
  await addDoc(collection(db, 'updates'), {
    issueId,
    status: 'resolved',
    notes,
    proofImageUrl,
    createdAt: serverTimestamp(),
    type: 'resolution',
  });
  
  await sendCitizenNotification(
    issueId, 
    'Issue Resolved! ✅', 
    `Your reported issue was successfully marked as resolved by the authority.`
  );
}

/**
 * Reject/close issue with reason
 */
export async function rejectIssue(issueId, reason) {
  if (!hasFirebaseConfig || !db) {
    throw new Error('Firebase not configured');
  }
  
  const issueRef = doc(db, 'issues', issueId);
  await updateDoc(issueRef, {
    status: 'rejected',
    resolutionNotes: reason,
    updatedAt: serverTimestamp(),
  });
  
  await addDoc(collection(db, 'updates'), {
    issueId,
    status: 'rejected',
    notes: reason,
    createdAt: serverTimestamp(),
    type: 'rejection',
  });
  
  await sendCitizenNotification(
    issueId, 
    'Issue Rejected ❌', 
    `Your issue was rejected. Reason: ${reason}`
  );
}

/**
 * Helper: Notify the original reporter
 */
async function sendCitizenNotification(issueId, title, message) {
  try {
    const issueSnap = await getDoc(doc(db, 'issues', issueId));
    if (!issueSnap.exists()) return;
    const issueData = issueSnap.data();
    if (!issueData.userId) return;
    
    await addDoc(collection(db, 'notifications'), {
      userId: issueData.userId,
      issueId: issueId,
      title: title,
      message: message,
      isRead: false,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error('Error sending notification:', err);
  }
}
