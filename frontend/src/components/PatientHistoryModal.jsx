import React, { useState, useEffect } from 'react';
import { medicalRecordsAPI, alertsAPI } from '../api';
import { formatDateTime } from '../utils/date';
import { LoadingSpinner } from './shared';

/**
 * Modal dialog showing a patient's medical history and alerts.
 *
 * @param {object} patient - Patient data object
 * @param {function} onClose - Called when modal is closed
 * @param {function} onViewRecord - Called with record when view button is clicked
 * @param {function} onEditRecord - Called with record when edit button is clicked
 */
const PatientHistoryModal = ({ patient, onClose, onViewRecord, onEditRecord }) => {
  const [records, setRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newAlertText, setNewAlertText] = useState('');
  const [newAlertSeverity, setNewAlertSeverity] = useState('MEDIUM');

  useEffect(() => {
    if (patient?.id) {
      setLoading(true);
      setError(null);
      Promise.all([
        medicalRecordsAPI.listByPatient(patient.id),
        alertsAPI.listByPatient(patient.id)
      ])
        .then(([recordsRes, alertsRes]) => {
          setRecords(recordsRes.data);
          setAlerts(alertsRes.data || []);
        })
        .catch(err => {
          console.error("Error fetching patient history:", err);
          setError("Failed to load medical history or alerts.");
        })
        .finally(() => setLoading(false));
    }
  }, [patient]);

  const handleAddAlert = async () => {
    if (!newAlertText.trim()) return;
    try {
      const res = await alertsAPI.create(patient.id, {
        alertType: 'MEDICAL',
        description: newAlertText,
        severity: newAlertSeverity,
        isActive: true
      });
      setAlerts(prev => [res.data, ...prev]);
      setNewAlertText('');
      setNewAlertSeverity('MEDIUM');
    } catch (err) {
      alert("Failed to add alert");
    }
  };

  const handleToggleAlert = async (alert) => {
    try {
      const res = await alertsAPI.update(alert.id, {
        alertType: alert.alertType,
        description: alert.description,
        severity: alert.severity,
        isActive: !alert.isActive
      });
      setAlerts(prev => prev.map(a => a.id === alert.id ? res.data : a));
    } catch (err) {
      alert("Failed to update alert");
    }
  };

  const getSeverityClass = (severity) => {
    switch(severity) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">
            Medical History - {patient?.name || 'Unknown Pet'} {patient?.ownerName ? `(${patient.ownerName})` : ''}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          {loading ? (
            <LoadingSpinner text="Loading patient data..." />
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : (
            <>
              {/* Alerts Section */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">⚠️</span> Patient Alerts
                </h3>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 flex gap-3">
                  <input 
                    type="text" 
                    value={newAlertText}
                    onChange={(e) => setNewAlertText(e.target.value)}
                    placeholder="Enter new alert (e.g., Allergic to penicillin)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select 
                    value={newAlertSeverity}
                    onChange={(e) => setNewAlertSeverity(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                  <button 
                    onClick={handleAddAlert}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    Add
                  </button>
                </div>

                {alerts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {alerts.map(a => (
                      <div key={a.id} className={`p-3 rounded-md border flex justify-between items-start ${getSeverityClass(a.severity)} ${!a.isActive ? 'opacity-50 grayscale' : ''}`}>
                        <div>
                          <p className="font-semibold">{a.description}</p>
                          <p className="text-xs mt-1 opacity-75">{formatDateTime(a.createdAt)}</p>
                        </div>
                        <button 
                          onClick={() => handleToggleAlert(a)}
                          className="text-xs font-semibold px-2 py-1 rounded bg-white bg-opacity-50 hover:bg-opacity-100"
                        >
                          {a.isActive ? 'Resolve' : 'Reactivate'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No active alerts for this patient.</p>
                )}
              </section>

              {/* Records Section */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">📋</span> Visit History
                </h3>
                
                {records.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 border border-dashed rounded-lg">No medical records found for this patient.</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-left border-collapse min-w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                          <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {records.map(record => (
                          <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                              {record.visitDate ? formatDateTime(record.visitDate) : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {record.appointmentType || 'Visit'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">
                              {record.diagnosis || 'No diagnosis'}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => onViewRecord?.(record)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                                title="View Details"
                              >
                                View
                              </button>
                              <button
                                onClick={() => onEditRecord?.(record)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit Record"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-md font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryModal;
