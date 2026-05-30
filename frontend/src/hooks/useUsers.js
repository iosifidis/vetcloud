import { useState, useEffect, useCallback } from 'react';
import { usersAPI } from '../api';

/**
 * Custom hook for admin user management.
 * Lists all clinic staff and provides create, update, deactivate, and delete operations.
 */
export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersAPI.list();
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (data) => {
    const response = await usersAPI.create(data);
    setUsers(prev => [...prev, response.data]);
    return response.data;
  }, []);

  const updateUser = useCallback(async (id, data) => {
    const response = await usersAPI.update(id, data);
    setUsers(prev => prev.map(u => u.id === id ? response.data : u));
    return response.data;
  }, []);

  const toggleActive = useCallback(async (id, isCurrentlyActive) => {
    const response = isCurrentlyActive
      ? await usersAPI.deactivate(id)
      : await usersAPI.activate(id);
    setUsers(prev => prev.map(u => u.id === id ? response.data : u));
    return response.data;
  }, []);

  const deleteUser = useCallback(async (id) => {
    await usersAPI.delete(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    toggleActive,
    deleteUser,
  };
}
