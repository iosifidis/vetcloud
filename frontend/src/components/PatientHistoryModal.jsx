import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const PatientHistoryModal = ({ patient, onClose, onViewRecord, onEditRecord, token }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (patient?.id) {
            setLoading(true);
            axios.get(`${API_BASE_URL}/medical-records/patient/${patient.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => setRecords(res.data))
                .catch(err => console.error("Error fetching history:", err))
                .finally(() => setLoading(false));
        }
    }, [patient, token]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-8">
                <div className="px-8 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50 mb-6 -mx-8 -mt-8 rounded-t-lg">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Medical History - {patient?.name || 'Unknown Pet'} {patient?.ownerName ? `(${patient.ownerName})` : ''}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
                </div>

                <div className="py-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="text-center text-gray-500">Loading history...</div>
                    ) : records.length === 0 ? (
                        <div className="text-center text-gray-400">No medical records found for this patient.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {records.map(record => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {formatDate(record.appointment?.startTime || record.visitDate || record.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {record.appointment?.type || record.appointmentType || 'Visit'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">
                                            {record.diagnosis || 'No diagnosis'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                {onViewRecord && (
                                                    <button
                                                        onClick={() => onViewRecord(record)}
                                                        className="text-blue-600 hover:text-blue-800 p-1"
                                                        title="View Details"
                                                    >
                                                        👁️
                                                    </button>
                                                )}
                                                {onEditRecord && (
                                                    <button
                                                        onClick={() => onEditRecord(record)}
                                                        className="text-green-600 hover:text-green-800 p-1"
                                                        title="Edit Record"
                                                    >
                                                        ✏️
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="flex justify-end mt-8 pt-6 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-bold transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientHistoryModal;
