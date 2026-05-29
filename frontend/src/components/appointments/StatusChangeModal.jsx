import React from 'react';
import { APPOINTMENT_STATUSES } from '../../constants/appointments';

/**
 * Status change modal — allows cycling through appointment statuses.
 *
 * @param {object} appointment - The appointment to change status on
 * @param {function} onStatusChange - Called with (appointmentId, newStatus)
 * @param {function} onClose - Called when modal is closed
 */
const StatusChangeModal = ({ appointment, onStatusChange, onClose }) => {
  if (!appointment) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Change Status
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Current: <strong>{appointment.status}</strong>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {APPOINTMENT_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => onStatusChange(appointment.id, s.value)}
              disabled={s.value === appointment.status}
              className={`px-3 py-2 rounded-md text-sm font-medium text-white transition-colors ${s.buttonClass} ${
                s.value === appointment.status ? 'opacity-50 cursor-not-allowed ring-2 ring-offset-1 ring-gray-400' : ''
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default StatusChangeModal;
