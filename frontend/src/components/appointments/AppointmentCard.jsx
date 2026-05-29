import React from 'react';
import { getTypeConfig, getStatusConfig } from '../../constants/appointments';
import { formatDateTime } from '../../utils/date';
import StatusButton from './StatusButton';

/**
 * Single appointment card showing key details.
 *
 * @param {object} appointment - Appointment data with JOINed fields
 * @param {function} onEdit - Called when edit button is clicked
 * @param {function} onDelete - Called when delete button is clicked
 * @param {function} onStatusClick - Called when status badge is clicked
 * @param {function} onClick - Called when the card is clicked
 */
const AppointmentCard = ({ appointment, onEdit, onDelete, onStatusClick, onClick }) => {
  const typeConfig = getTypeConfig(appointment.type);
  const isPast = new Date(appointment.startTime) < new Date();

  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
        isPast ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
      }`}
      onClick={() => onClick?.(appointment)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: typeConfig.color }}
          />
          <span className="text-sm font-semibold text-gray-700">
            {typeConfig.label}
          </span>
        </div>
        <StatusButton
          status={appointment.status}
          onClick={(e) => {
            e.stopPropagation();
            onStatusClick?.(appointment);
          }}
        />
      </div>

      {/* Time */}
      <p className="text-sm text-gray-500 mb-2">
        📅 {formatDateTime(appointment.startTime)}
        {appointment.endTime && ` — ${formatDateTime(appointment.endTime)}`}
      </p>

      {/* Client & Patient */}
      <div className="text-sm mb-1">
        <span className="font-medium text-gray-900">
          {appointment.clientFirstName} {appointment.clientLastName}
        </span>
        {appointment.clientPhone && (
          <span className="text-gray-500 ml-2">📞 {appointment.clientPhone}</span>
        )}
      </div>
      <div className="text-sm text-gray-600">
        🐾 {appointment.patientName}
        {appointment.patientSpecies && (
          <span className="text-gray-400 ml-1">({appointment.patientSpecies})</span>
        )}
      </div>

      {/* Vet */}
      {appointment.vetFirstName && (
        <div className="text-sm text-gray-500 mt-1">
          👨‍⚕️ Dr. {appointment.vetFirstName} {appointment.vetLastName}
        </div>
      )}

      {/* Reason */}
      {appointment.reason && (
        <p className="text-sm text-gray-500 mt-2 truncate">
          💬 {appointment.reason}
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-100">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit?.(appointment); }}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1"
        >
          Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.(appointment.id); }}
          className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default AppointmentCard;
