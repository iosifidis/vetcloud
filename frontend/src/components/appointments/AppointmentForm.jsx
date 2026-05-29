import React from 'react';
import { APPOINTMENT_TYPES, APPOINTMENT_STATUSES } from '../../constants/appointments';
import ClientSearchDropdown from './ClientSearchDropdown';

/**
 * Appointment form for create/edit operations.
 *
 * @param {object} formData - Current form values
 * @param {function} onChange - Called with (name, value) when any field changes
 * @param {function} onSubmit - Called when form is submitted
 * @param {function} onCancel - Called when cancel button is clicked
 * @param {boolean} isEdit - Whether this is editing an existing appointment
 * @param {Array} clients - List of clients for the dropdown
 * @param {object} selectedClient - Currently selected client
 * @param {function} onClientSelect - Called when a client is selected
 * @param {Array} patients - List of patients for the selected client
 * @param {Array} vets - List of vets for the dropdown
 */
const AppointmentForm = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isEdit = false,
  clients = [],
  selectedClient,
  onClientSelect,
  patients = [],
  vets = [],
}) => {
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
      {/* Client Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Client *
        </label>
        <ClientSearchDropdown
          clients={clients}
          selectedClient={selectedClient}
          onSelect={onClientSelect}
          disabled={isEdit}
        />
      </div>

      {/* Patient Selection */}
      <div>
        <label htmlFor="af-patientId" className="block text-sm font-medium text-gray-700 mb-1">
          Patient *
        </label>
        <select
          id="af-patientId"
          name="patientId"
          value={formData.patientId || ''}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={!selectedClient}
        >
          <option value="">
            {selectedClient ? 'Select a patient' : 'Select a client first'}
          </option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.species}{p.breed ? ` - ${p.breed}` : ''})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type */}
        <div>
          <label htmlFor="af-type" className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select
            id="af-type"
            name="type"
            value={formData.type || 'EXAM'}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {APPOINTMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="af-status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="af-status"
            name="status"
            value={formData.status || 'SCHEDULED'}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Time */}
        <div>
          <label htmlFor="af-startTime" className="block text-sm font-medium text-gray-700 mb-1">
            Start Time *
          </label>
          <input
            id="af-startTime"
            type="datetime-local"
            name="startTime"
            value={formData.startTime || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* End Time */}
        <div>
          <label htmlFor="af-endTime" className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <input
            id="af-endTime"
            type="datetime-local"
            name="endTime"
            value={formData.endTime || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Vet */}
        <div className="md:col-span-2">
          <label htmlFor="af-vetId" className="block text-sm font-medium text-gray-700 mb-1">
            Veterinarian
          </label>
          <select
            id="af-vetId"
            name="vetId"
            value={formData.vetId || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No vet assigned</option>
            {vets.map((v) => (
              <option key={v.id} value={v.id}>
                Dr. {v.firstName || v.username} {v.lastName || ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reason */}
      <div>
        <label htmlFor="af-reason" className="block text-sm font-medium text-gray-700 mb-1">
          Reason
        </label>
        <input
          id="af-reason"
          type="text"
          name="reason"
          value={formData.reason || ''}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Reason for the visit"
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="af-notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="af-notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          rows={3}
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
          {isEdit ? 'Update Appointment' : 'Create Appointment'}
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;
