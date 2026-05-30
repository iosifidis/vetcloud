import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../hooks';
import { Modal, ConfirmDialog } from '../components/shared';

const UsersPage = () => {
    const { user } = useAuth();
    const { users, loading, error, createUser, toggleActive, deleteUser } = useUsers();
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        firstName: '',
        lastName: '',
        roleName: 'VET'
    });
    
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const handleCreateChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await createUser(formData);
            setShowCreateModal(false);
            setFormData({
                username: '',
                password: '',
                email: '',
                firstName: '',
                lastName: '',
                roleName: 'VET'
            });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create user');
        }
    };

    const handleToggleActive = async (targetUser) => {
        if (targetUser.id === user.id) {
            alert("You cannot deactivate your own account from here.");
            return;
        }
        try {
            await toggleActive(targetUser.id, targetUser.isActive);
        } catch (err) {
            alert("Failed to change activation status");
        }
    };

    const handleDeleteClick = (targetUser) => {
        if (targetUser.id === user.id) {
            alert("You cannot delete your own account from here. Go to Profile.");
            return;
        }
        setConfirmDeleteId(targetUser.id);
    };

    const handleConfirmDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await deleteUser(confirmDeleteId);
            setConfirmDeleteId(null);
        } catch (err) {
            alert("Failed to delete user");
            setConfirmDeleteId(null);
        }
    };

    // If not admin, the API hook might return 403, and we'll show error.
    if (loading) return <div className="p-8 text-center text-gray-500">Loading users...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Clinic Staff Management</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                    + Add Staff Member
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {users.map(u => (
                            <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.isActive ? 'opacity-75 bg-gray-50' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-900">{u.username}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {u.email || '—'}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        u.roleName === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {u.roleName}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={() => handleToggleActive(u)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                            u.isActive 
                                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                        }`}
                                    >
                                        {u.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {u.id !== user?.id && (
                                        <button
                                            onClick={() => handleDeleteClick(u)}
                                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                    No staff members found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Add New Staff Member"
            >
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleCreateChange}
                                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleCreateChange}
                                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleCreateChange}
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                            <input
                                type="text"
                                name="username"
                                required
                                value={formData.username}
                                onChange={handleCreateChange}
                                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                            <select
                                name="roleName"
                                value={formData.roleName}
                                onChange={handleCreateChange}
                                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="VET">Veterinarian</option>
                                <option value="ADMIN">Administrator</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleCreateChange}
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Create Member
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Delete */}
            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                title="Delete Staff Member"
                message="Are you sure you want to permanently delete this user? Their medical records will be reassigned to a placeholder 'John Doe' to preserve history."
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDeleteId(null)}
                confirmText="Delete Member"
                isDestructive={true}
            />
        </div>
    );
};

export default UsersPage;
