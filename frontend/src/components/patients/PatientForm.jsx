import React from 'react';
import { SPECIES_OPTIONS, SEX_OPTIONS } from '../../constants/appointments';

/**
 * Patient form component for create/edit operations.
 *
 * @param {object} formData - Current form values
 * @param {function} onChange - Called when any field changes (name, value)
 * @param {function} onSubmit - Called when form is submitted
 * @param {function} onCancel - Called when cancel button is clicked
 * @param {boolean} isEdit - Whether this is editing an existing patient
 */
const PatientForm = ({ formData, onChange, onSubmit, onCancel, isEdit = false }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onChange(name, type === 'checkbox' ? checked : value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label htmlFor="pf-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            id="pf-name"
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Species */}
        <div>
          <label htmlFor="pf-species" className="block text-sm font-medium text-gray-700 mb-1">
            Species *
          </label>
          <select
            id="pf-species"
            name="species"
            value={formData.species || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select species</option>
            {SPECIES_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Breed */}
        <div>
          <label htmlFor="pf-breed" className="block text-sm font-medium text-gray-700 mb-1">
            Breed
          </label>
          <input
            id="pf-breed"
            type="text"
            name="breed"
            value={formData.breed || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sex */}
        <div>
          <label htmlFor="pf-sex" className="block text-sm font-medium text-gray-700 mb-1">
            Sex
          </label>
          <select
            id="pf-sex"
            name="sex"
            value={formData.sex || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select sex</option>
            {SEX_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Birth Date */}
        <div>
          <label htmlFor="pf-birthDate" className="block text-sm font-medium text-gray-700 mb-1">
            Birth Date
          </label>
          <input
            id="pf-birthDate"
            type="date"
            name="birthDate"
            value={formData.birthDate || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Weight */}
        <div>
          <label htmlFor="pf-weight" className="block text-sm font-medium text-gray-700 mb-1">
            Weight (kg)
          </label>
          <input
            id="pf-weight"
            type="number"
            step="0.1"
            name="weight"
            value={formData.weight || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Microchip Number */}
        <div>
          <label htmlFor="pf-microchipNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Microchip Number
          </label>
          <input
            id="pf-microchipNumber"
            type="text"
            name="microchipNumber"
            value={formData.microchipNumber || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Microchip Date */}
        <div>
          <label htmlFor="pf-microchipDate" className="block text-sm font-medium text-gray-700 mb-1">
            Microchip Date
          </label>
          <input
            id="pf-microchipDate"
            type="date"
            name="microchipDate"
            value={formData.microchipDate || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Checkboxes */}
        <div className="flex flex-wrap items-center gap-6 md:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isDobApproximate"
              checked={formData.isDobApproximate || false}
              onChange={handleChange}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Approximate DOB</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isSterilized"
              checked={formData.isSterilized || false}
              onChange={handleChange}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Sterilized</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          {isEdit ? 'Update Patient' : 'Add Patient'}
        </button>
      </div>
    </form>
  );
};

export default PatientForm;
