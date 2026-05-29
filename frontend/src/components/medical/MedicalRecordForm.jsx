import React from 'react';

/**
 * Medical record form for create/edit operations.
 *
 * @param {object} formData - Current form values
 * @param {function} onChange - Called with (name, value) when a field changes
 * @param {function} onSubmit - Called when form is submitted
 * @param {function} onCancel - Called when cancel button is clicked
 * @param {boolean} isEdit - Whether editing an existing record
 */
const MedicalRecordForm = ({ formData, onChange, onSubmit, onCancel, isEdit = false }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Symptoms */}
      <div>
        <label htmlFor="mr-symptoms" className="block text-sm font-medium text-gray-700 mb-1">
          Symptoms
        </label>
        <textarea
          id="mr-symptoms"
          name="symptoms"
          value={formData.symptoms || ''}
          onChange={handleChange}
          rows={3}
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Observed symptoms..."
        />
      </div>

      {/* Diagnosis */}
      <div>
        <label htmlFor="mr-diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
          Diagnosis
        </label>
        <textarea
          id="mr-diagnosis"
          name="diagnosis"
          value={formData.diagnosis || ''}
          onChange={handleChange}
          rows={3}
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Diagnosis..."
        />
      </div>

      {/* Treatment */}
      <div>
        <label htmlFor="mr-treatment" className="block text-sm font-medium text-gray-700 mb-1">
          Treatment
        </label>
        <textarea
          id="mr-treatment"
          name="treatment"
          value={formData.treatment || ''}
          onChange={handleChange}
          rows={3}
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Treatment prescribed..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weight */}
        <div>
          <label htmlFor="mr-weight" className="block text-sm font-medium text-gray-700 mb-1">
            Weight (kg)
          </label>
          <input
            id="mr-weight"
            type="number"
            step="0.01"
            name="weight"
            value={formData.weight || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Temperature */}
        <div>
          <label htmlFor="mr-temperature" className="block text-sm font-medium text-gray-700 mb-1">
            Temperature (°C)
          </label>
          <input
            id="mr-temperature"
            type="number"
            step="0.1"
            name="temperature"
            value={formData.temperature || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="mr-notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="mr-notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          rows={2}
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes..."
        />
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
          {isEdit ? 'Update Record' : 'Create Record'}
        </button>
      </div>
    </form>
  );
};

export default MedicalRecordForm;
