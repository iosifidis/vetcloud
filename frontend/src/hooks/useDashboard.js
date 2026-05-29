import { useState, useEffect, useCallback } from 'react';
import { dashboardAPI, appointmentsAPI } from '../api';

/**
 * Custom hook for dashboard data.
 * Loads stats and next appointment on mount.
 */
export function useDashboard() {
  const [stats, setStats] = useState(null);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, nextRes] = await Promise.all([
        dashboardAPI.getStats(),
        appointmentsAPI.getNext(),
      ]);
      setStats(statsRes.data);
      setNextAppointment(nextRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    stats,
    nextAppointment,
    loading,
    error,
    refresh: fetchDashboard,
  };
}
