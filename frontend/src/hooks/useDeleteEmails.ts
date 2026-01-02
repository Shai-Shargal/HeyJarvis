import { useState, useCallback } from 'react';
import { deleteTodayEmails, DeleteTodayResponse } from '../helpers/api';

export function useDeleteEmails(jwt: string | null) {
  const [result, setResult] = useState<DeleteTodayResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function dryRunDelete() {
    if (!jwt) {
      setError('Not connected. Please connect Google first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const deleteResult = await deleteTodayEmails(jwt, true, false);
      setResult(deleteResult);
    } catch (err) {
      console.error('Error deleting emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete emails');
    } finally {
      setLoading(false);
    }
  }

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    result,
    loading,
    error,
    dryRunDelete,
    clearResult,
  };
}

