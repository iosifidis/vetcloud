import React, { useState, useEffect } from 'react';
import { medicalRecordsAPI } from '../api';
import { formatDateTime } from '../utils/date';
import { LoadingSpinner } from './shared';

/**
 * Modal dialog showing a patient's medical history.
 *
 * @param {object} patient - Patient data object
 * @param {function} onClose - Called when modal is closed
 * @param {function} onViewRecord - Called with record when view button is clicked
 * @param {function} onEditRecord - Called with record when edit button is clicked
 */
const PatientHistoryModal = ({ patient, onClose, onViewRecord, onEditRecord }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patient?.id) {
      setLoading(true);
      setError(null);
      medicalRecordsAPI.listByPatient(patient.id)
        .then(res => setRecords(res.data))
        .catch(err => {
          console.error("Error fetching patient history:", err);
          setError("Failed to load medical history.");
        })
        .finally(() => setLoading(false));
    }
  }, [patient]);

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
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <LoadingSpinner text="Loading history..." />
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : records.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No medical records found for this patient.</p>
          ) : (
            <div className="overflow-x-auto">
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
