import React, { useState, useEffect } from 'react';
import api from '../context/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UsersPage = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Simple role check - in a real app, this should probably be more robust
        // or handled by the route protection wrappers.
        if (user && user.role !== 'ADMIN' && user.role !== 'ROLE_ADMIN') {
            // Providing a fallback or just letting the API deny access. 
            // But good UX is to redirect.
            // However, let's just let it load and if API 403s, we handle it.
        }

        fetchUsers();
    }, [user]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('http://localhost:8080/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. You may not have permission.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (userId === user.id) {
            alert("You cannot delete your own account from here. Go to Profile.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this user? Their medical records will be reassigned to 'John Doe' dummy doctor to preserve history.")) {
            return;
        }

        try {
            await api.delete(`http://localhost:8080/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(users.filter(u => u.id !== userId));
            alert("User deleted successfully.");
        } catch (err) {
            console.error('Error deleting user:', err);
            alert("Failed to delete user.");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading users...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">User Management</h1>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                            <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-500">{u.id}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{u.username}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{u.firstName} {u.lastName}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'ADMIN' || u.role === 'ROLE_ADMIN'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {u.id !== user?.id && (
                                        <button
                                            onClick={() => handleDeleteUser(u.id)}
                                            className="text-red-600 hover:text-red-900 font-medium text-sm"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersPage;
