import React, { useState, useEffect } from 'react';
import api from '../context/axiosConfig';

const MedicalRecordModal = ({ record, onClose, onSave, token }) => {
    const [formData, setFormData] = useState({
        weight: '',
        temperature: '',
        symptoms: '',
        diagnosis: '',
        treatment: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (record) {
            setFormData({
                weight: record.weight || '',
                temperature: record.temperature || '',
                symptoms: record.symptoms || '',
                diagnosis: record.diagnosis || '',
                treatment: record.treatment || ''
            });
        }
    }, [record]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                id: record.id,
                weight: parseFloat(formData.weight),
                temperature: parseFloat(formData.temperature),
                symptoms: formData.symptoms,
                diagnosis: formData.diagnosis,
                treatment: formData.treatment
            };

            await api.put(
                `http://localhost:8080/api/medical-records/${record.id}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            onSave();
        } catch (error) {
            console.error('Error updating record:', error);
            alert('Failed to update medical record.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-8">
                <div className="px-8 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50 mb-6 -mx-8 -mt-8 rounded-t-lg">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Medical Record</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
                </div>

                <form onSubmit={handleSubmit} className="py-2 overflow-y-auto flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                            <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" step="0.1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
                            <input type="number" name="temperature" value={formData.temperature} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" step="0.1" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                        <textarea name="symptoms" value={formData.symptoms} onChange={handleChange} rows="3" className="w-full border border-gray-300 rounded-md px-3 py-2 resize-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                        <textarea name="diagnosis" value={formData.diagnosis} onChange={handleChange} rows="3" className="w-full border border-gray-300 rounded-md px-3 py-2 resize-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Treatment</label>
                        <textarea name="treatment" value={formData.treatment} onChange={handleChange} rows="3" className="w-full border border-gray-300 rounded-md px-3 py-2 resize-none" />
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-bold transition-colors"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-bold transition-colors"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MedicalRecordModal;
