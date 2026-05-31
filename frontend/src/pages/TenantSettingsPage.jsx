import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import api from '../api/client';

const TenantSettingsPage = () => {
    const { user } = useAuth();
    const { settings, updateSettings, fetchSettings } = useTenant();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        clinicName: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
        logoUrl: '',
        enabledModules: []
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const availableModules = [
        { id: 'appointments', label: 'Ραντεβού' },
        { id: 'clients', label: 'Πελάτες' },
        { id: 'patients', label: 'Ασθενείς' },
        { id: 'records', label: 'Ιστορικό' },
        { id: 'users', label: 'Χρήστες & Προσωπικό' },
    ];

    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            navigate('/');
        }
        
        // Populate form with current settings
        if (settings) {
            setFormData({
                clinicName: settings.clinicName || '',
                primaryColor: settings.primaryColor || '#3b82f6',
                secondaryColor: settings.secondaryColor || '#1e40af',
                logoUrl: settings.logoUrl || '',
                enabledModules: settings.enabledModules || []
            });
        }
    }, [user, navigate, settings]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleModuleToggle = (moduleId) => {
        setFormData(prev => {
            const isEnabled = prev.enabledModules.includes(moduleId);
            if (isEnabled) {
                return { ...prev, enabledModules: prev.enabledModules.filter(m => m !== moduleId) };
            } else {
                return { ...prev, enabledModules: [...prev.enabledModules, moduleId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            const response = await api.put('/tenant/settings', formData);
            updateSettings(response.data);
            setMessage('Οι ρυθμίσεις αποθηκεύτηκαν επιτυχώς!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Failed to save settings:", error);
            setMessage('Σφάλμα κατά την αποθήκευση των ρυθμίσεων.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Ρυθμίσεις Ιατρείου</h1>
            
            {message && (
                <div className={`mb-4 p-4 rounded-md ${message.includes('Σφάλμα') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message}
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    
                    {/* Basic Info */}
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Βασικές Πληροφορίες</h3>
                        <p className="mt-1 text-sm text-gray-500">Πληροφορίες που εμφανίζονται στην εφαρμογή.</p>
                        <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                            <div className="sm:col-span-2">
                                <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700">Όνομα Ιατρείου</label>
                                <input
                                    type="text"
                                    name="clinicName"
                                    id="clinicName"
                                    value={formData.clinicName}
                                    onChange={handleInputChange}
                                    className="mt-1 p-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border"
                                    required
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">URL Λογότυπου (Προαιρετικό)</label>
                                <input
                                    type="url"
                                    name="logoUrl"
                                    id="logoUrl"
                                    value={formData.logoUrl}
                                    onChange={handleInputChange}
                                    className="mt-1 p-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border"
                                />
                                {formData.logoUrl && (
                                    <div className="mt-2">
                                        <img src={formData.logoUrl} alt="Logo Preview" className="h-16 w-auto object-contain" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="hidden sm:block" aria-hidden="true">
                        <div className="py-5"><div className="border-t border-gray-200" /></div>
                    </div>

                    {/* Appearance */}
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Εμφάνιση (Χρώματα)</h3>
                        <p className="mt-1 text-sm text-gray-500">Προσαρμόστε τα χρώματα της εφαρμογής σύμφωνα με το brand σας.</p>
                        <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                            <div>
                                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">Κύριο Χρώμα</label>
                                <div className="mt-1 flex items-center">
                                    <input
                                        type="color"
                                        name="primaryColor"
                                        id="primaryColor"
                                        value={formData.primaryColor}
                                        onChange={handleInputChange}
                                        className="h-8 w-8 border border-gray-300 rounded-md shadow-sm"
                                    />
                                    <span className="ml-3 text-sm text-gray-500">{formData.primaryColor}</span>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700">Δευτερεύον Χρώμα</label>
                                <div className="mt-1 flex items-center">
                                    <input
                                        type="color"
                                        name="secondaryColor"
                                        id="secondaryColor"
                                        value={formData.secondaryColor}
                                        onChange={handleInputChange}
                                        className="h-8 w-8 border border-gray-300 rounded-md shadow-sm"
                                    />
                                    <span className="ml-3 text-sm text-gray-500">{formData.secondaryColor}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hidden sm:block" aria-hidden="true">
                        <div className="py-5"><div className="border-t border-gray-200" /></div>
                    </div>

                    {/* Modules */}
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Ενεργά Modules</h3>
                        <p className="mt-1 text-sm text-gray-500">Επιλέξτε ποιες λειτουργίες είναι διαθέσιμες στο ιατρείο σας.</p>
                        <div className="mt-4 space-y-4">
                            {availableModules.map((module) => (
                                <div className="flex items-start" key={module.id}>
                                    <div className="flex items-center h-5">
                                        <input
                                            id={`module-${module.id}`}
                                            name={`module-${module.id}`}
                                            type="checkbox"
                                            checked={formData.enabledModules.includes(module.id)}
                                            onChange={() => handleModuleToggle(module.id)}
                                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                            disabled={module.id === 'users'} // Prevent disabling core module
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor={`module-${module.id}`} className="font-medium text-gray-700">
                                            {module.label} {module.id === 'users' && '(Υποχρεωτικό)'}
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-5 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[var(--color-primary)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {saving ? 'Αποθήκευση...' : 'Αποθήκευση Αλλαγών'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TenantSettingsPage;
