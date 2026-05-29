import React from 'react';
import { formatDateTime } from '../../utils/date';

/**
 * Card showing the next upcoming appointment.
 *
 * @param {object} appointment - Next appointment data (or null)
 */
const NextAppointmentCard = ({ appointment }) => {
  if (!appointment) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Next Appointment</h3>
        <p className="text-gray-500 text-sm">No upcoming appointments</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Next Appointment</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">📅</span>
          <span className="font-medium text-gray-900">
            {formatDateTime(appointment.startTime)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">👤</span>
          <span className="text-gray-700">
            {appointment.clientFirstName} {appointment.clientLastName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">🐾</span>
          <span className="text-gray-700">{appointment.patientName}</span>
        </div>
        {appointment.reason && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400">💬</span>
            <span className="text-gray-700">{appointment.reason}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NextAppointmentCard;
