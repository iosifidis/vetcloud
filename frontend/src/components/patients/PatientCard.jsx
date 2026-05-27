import React from 'react';
import { calculateAge } from '../../utils/date';

/**
 * Patient card component showing patient details in a compact card format.
 *
 * @param {object} patient - Patient data object
 * @param {function} onEdit - Called when edit button is clicked
 * @param {function} onDelete - Called when delete button is clicked
 * @param {function} onClick - Called when card is clicked
 */
const PatientCard = ({ patient, onEdit, onDelete, onClick }) => {
  const age = patient.birthDate ? calculateAge(patient.birthDate) : null;

  const speciesEmoji = {
    DOG: '🐕',
    CAT: '🐈',
    RABBIT: '🐇',
    BIRD: '🐦',
    OTHER: '🐾',
  };

  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
        patient.isDeceased ? 'bg-gray-50 border-gray-300 opacity-75' : 'bg-white border-gray-200'
      }`}
      onClick={() => onClick?.(patient)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{speciesEmoji[patient.species] || '🐾'}</span>
          <div>
            <h4 className="font-semibold text-gray-900">
              {patient.name}
              {patient.isDeceased && (
                <span className="ml-2 text-xs font-normal text-gray-500">(Deceased)</span>
              )}
            </h4>
            <p className="text-sm text-gray-500">
              {patient.species}{patient.breed ? ` · ${patient.breed}` : ''}
              {patient.sex ? ` · ${patient.sex}` : ''}
            </p>
          </div>
        </div>

        {!patient.isDeceased && (
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(patient);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(patient.id);
              }}
              className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {age && (
          <span>Age: {age}</span>
        )}
        {patient.weight > 0 && (
          <span>Weight: {patient.weight} kg</span>
        )}
        {patient.microchipNumber && (
          <span>Chip: {patient.microchipNumber}</span>
        )}
        {patient.isSterilized && (
          <span className="text-green-600">✓ Sterilized</span>
        )}
      </div>
    </div>
  );
};

export default PatientCard;
