import { useState, useEffect, useCallback } from 'react';
import { clientsAPI } from '../api';

/**
 * Custom hook for client data management.
 * Provides list, search, create, update, delete operations.
 */
export function useClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await clientsAPI.list();
      setClients(response.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err.response?.data?.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchClients = useCallback(async (term) => {
    if (!term || term.trim() === '') {
      return fetchClients();
    }
    setLoading(true);
    setError(null);
    try {
      const response = await clientsAPI.search(term);
      setClients(response.data);
    } catch (err) {
      console.error('Error searching clients:', err);
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [fetchClients]);

  const createClient = useCallback(async (data) => {
    const response = await clientsAPI.create(data);
    setClients(prev => [...prev, response.data]);
    return response.data;
  }, []);

  const updateClient = useCallback(async (id, data) => {
    const response = await clientsAPI.update(id, data);
    setClients(prev => prev.map(c => c.id === id ? response.data : c));
    return response.data;
  }, []);

  const deleteClient = useCallback(async (id) => {
    await clientsAPI.delete(id);
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    error,
    fetchClients,
    searchClients,
    createClient,
    updateClient,
    deleteClient,
  };
}
