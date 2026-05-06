import React, { useState, useEffect } from 'react';
import api from '../context/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
    const { token, user, logout } = useAuth();
    const navigate = useNavigate();

    // We keep form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '', // Only send if changing
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || ''
            }));
            setLoading(false);
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (formData.password && formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            // Assuming endpoint is PUT /api/users/{id}
            await api.put(`http://localhost:8080/api/users/${user.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage({ type: 'success', text: 'Profile updated successfully. Please re-login if you changed your password.' });

            // Should probably update context user too, but a re-login is safer if data changed significantly
            if (formData.password) {
                setTimeout(() => logout(), 2000);
            }

        } catch (err) {
            console.error("Error updating profile:", err);
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("CRITICAL WARNING: Are you sure you want to delete your account? This cannot be undone. Your medical records will be preserved alongside a placeholder doctor.")) {
            return;
        }

        try {
            await api.delete(`http://localhost:8080/api/users/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Account deleted.");
            logout();
        } catch (err) {
            console.error("Error deleting account:", err);
            alert("Failed to delete account.");
        }
    };

    if (loading) return <div className="p-8">Loading profile...</div>;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

            {message.text && (
                <div className={`mb-6 p-4 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-8">
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Update Profile'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold text-red-600 mb-2">Danger Zone</h3>
                <p className="text-gray-600 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <button
                    onClick={handleDeleteAccount}
                    className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-6 py-2 rounded-md font-semibold transition-colors"
                >
                    Delete My Account
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;
