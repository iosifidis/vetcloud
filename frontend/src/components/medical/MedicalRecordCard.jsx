import React from 'react';
import { formatDateTime } from '../../utils/date';

/**
 * Medical record card showing a summary of a patient visit.
 *
 * @param {object} record - Medical record data
 * @param {function} onEdit - Called when edit button is clicked
 * @param {function} onClick - Called when card is clicked
 */
const MedicalRecordCard = ({ record, onEdit, onClick }) => {
  return (
    <div
      className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(record)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          {record.visitDate && (
            <p className="text-xs text-gray-400">
              📅 {formatDateTime(record.visitDate)}
            </p>
          )}
          {record.appointmentType && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded mt-1">
              {record.appointmentType}
            </span>
          )}
        </div>
        {record.patientName && (
          <span className="text-sm font-medium text-gray-600">
            🐾 {record.patientName}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2 text-sm">
        {record.symptoms && (
          <div>
            <span className="font-medium text-gray-700">Symptoms: </span>
            <span className="text-gray-600">{record.symptoms}</span>
          </div>
        )}
        {record.diagnosis && (
          <div>
            <span className="font-medium text-gray-700">Diagnosis: </span>
            <span className="text-gray-600">{record.diagnosis}</span>
          </div>
        )}
        {record.treatment && (
          <div>
            <span className="font-medium text-gray-700">Treatment: </span>
            <span className="text-gray-600">{record.treatment}</span>
          </div>
        )}
      </div>

      {/* Vitals */}
      {(record.weight > 0 || record.temperature > 0) && (
        <div className="flex gap-4 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
          {record.weight > 0 && <span>⚖️ {record.weight} kg</span>}
          {record.temperature > 0 && <span>🌡️ {record.temperature}°C</span>}
        </div>
      )}

      {/* Actions */}
      {onEdit && (
        <div className="flex justify-end mt-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(record); }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default MedicalRecordCard;
