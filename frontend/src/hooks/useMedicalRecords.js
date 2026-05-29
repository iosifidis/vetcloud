import { useState, useCallback } from 'react';
import { medicalRecordsAPI } from '../api';

/**
 * Custom hook for medical record data management.
 * Supports loading by patient, client, or appointment.
 */
export function useMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchByPatient = useCallback(async (patientId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await medicalRecordsAPI.listByPatient(patientId);
      setRecords(response.data);
    } catch (err) {
      console.error('Error fetching medical records by patient:', err);
      setError(err.response?.data?.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByClient = useCallback(async (clientId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await medicalRecordsAPI.listByClient(clientId);
      setRecords(response.data);
    } catch (err) {
      console.error('Error fetching medical records by client:', err);
      setError(err.response?.data?.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByAppointment = useCallback(async (appointmentId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await medicalRecordsAPI.getByAppointment(appointmentId);
      // Single record — wrap in array for consistency
      setRecords(response.data ? [response.data] : []);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        setRecords([]);
        return null;
      }
      console.error('Error fetching medical record by appointment:', err);
      setError(err.response?.data?.message || 'Failed to load record');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRecord = useCallback(async (data) => {
    const response = await medicalRecordsAPI.create(data);
    setRecords(prev => [response.data, ...prev]);
    return response.data;
  }, []);

  const updateRecord = useCallback(async (id, data) => {
    const response = await medicalRecordsAPI.update(id, data);
    setRecords(prev => prev.map(r => r.id === id ? response.data : r));
    return response.data;
  }, []);

  return {
    records,
    loading,
    error,
    fetchByPatient,
    fetchByClient,
    fetchByAppointment,
    createRecord,
    updateRecord,
  };
}
