import { useState, useEffect, useCallback } from 'react';
import { patientsAPI } from '../api';

/**
 * Custom hook for patient data management.
 * Provides list (all or by owner), create, update, delete, transfer, and deceased operations.
 */
export function usePatients(clientId = null) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = clientId
        ? await patientsAPI.listByOwner(clientId)
        : await patientsAPI.listAll();
      setPatients(response.data);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(err.response?.data?.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const createPatient = useCallback(async (ownerClientId, data) => {
    const response = await patientsAPI.create(ownerClientId, data);
    setPatients(prev => [...prev, response.data]);
    return response.data;
  }, []);

  const updatePatient = useCallback(async (id, data) => {
    const response = await patientsAPI.update(id, data);
    setPatients(prev => prev.map(p => p.id === id ? response.data : p));
    return response.data;
  }, []);

  const deletePatient = useCallback(async (id) => {
    await patientsAPI.delete(id);
    setPatients(prev => prev.filter(p => p.id !== id));
  }, []);

  const transferPatient = useCallback(async (patientId, newOwnerId) => {
    const response = await patientsAPI.transfer(patientId, newOwnerId);
    setPatients(prev => prev.map(p => p.id === patientId ? response.data : p));
    return response.data;
  }, []);

  const markDeceased = useCallback(async (id) => {
    const response = await patientsAPI.markDeceased(id);
    setPatients(prev => prev.map(p => p.id === id ? response.data : p));
    return response.data;
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return {
    patients,
    loading,
    error,
    fetchPatients,
    createPatient,
    updatePatient,
    deletePatient,
    transferPatient,
    markDeceased,
  };
}
