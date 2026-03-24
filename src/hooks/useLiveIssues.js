import { useEffect, useState } from 'react';
import { subscribeToIssues } from '../services/municipalData';

export function useLiveIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToIssues(
      (nextIssues) => {
        setIssues(nextIssues);
        setLoading(false);
        setError('');
      },
      (err) => {
        setLoading(false);
        setError(err?.message || 'Failed to read issues from Firestore.');
      }
    );

    return unsubscribe;
  }, []);

  return { issues, loading, error };
}
