import { useState, useEffect, useCallback } from 'react';
import { appointmentsAPI } from '../api';

/**
 * Custom hook for appointment data management.
 * Provides list, search, create, update, delete operations.
 */
export function useAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await appointmentsAPI.list();
      setAppointments(response.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchAppointments = useCallback(async (term) => {
    if (!term || term.trim() === '') {
      return fetchAppointments();
    }
    setLoading(true);
    setError(null);
    try {
      const response = await appointmentsAPI.search(term);
      setAppointments(response.data);
    } catch (err) {
      console.error('Error searching appointments:', err);
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments]);

  const createAppointment = useCallback(async (data) => {
    const response = await appointmentsAPI.create(data);
    // Refresh the list to get JOINed data (client/patient/vet names)
    await fetchAppointments();
    return response.data;
  }, [fetchAppointments]);

  const updateAppointment = useCallback(async (id, data) => {
    const response = await appointmentsAPI.update(id, data);
    // Refresh the list to get JOINed data
    await fetchAppointments();
    return response.data;
  }, [fetchAppointments]);

  const deleteAppointment = useCallback(async (id) => {
    await appointmentsAPI.delete(id);
    setAppointments(prev => prev.filter(a => a.id !== id));
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    searchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
}
