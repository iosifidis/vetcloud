import React from 'react';

/**
 * Client form component for create/edit operations.
 *
 * @param {object} formData - Current form values
 * @param {function} onChange - Called when any field changes
 * @param {function} onSubmit - Called when form is submitted
 * @param {function} onCancel - Called when cancel button is clicked
 * @param {boolean} isEdit - Whether this is editing an existing client
 */
const ClientForm = ({ formData, onChange, onSubmit, onCancel, isEdit = false }) => {
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
        {/* First Name */}
        <div>
          <label htmlFor="cf-firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            id="cf-firstName"
            type="text"
            name="firstName"
            value={formData.firstName || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="cf-lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            id="cf-lastName"
            type="text"
            name="lastName"
            value={formData.lastName || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="cf-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            id="cf-email"
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="cf-phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            id="cf-phone"
            type="text"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label htmlFor="cf-address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            id="cf-address"
            type="text"
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* AFM */}
        <div>
          <label htmlFor="cf-afm" className="block text-sm font-medium text-gray-700 mb-1">
            Tax ID (AFM)
          </label>
          <input
            id="cf-afm"
            type="text"
            name="afm"
            value={formData.afm || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ADT */}
        <div>
          <label htmlFor="cf-adt" className="block text-sm font-medium text-gray-700 mb-1">
            ID Number (ADT)
          </label>
          <input
            id="cf-adt"
            type="text"
            name="adt"
            value={formData.adt || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Checkboxes */}
        <div className="flex items-center gap-6 md:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="gdprConsent"
              checked={formData.gdprConsent || false}
              onChange={handleChange}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">GDPR Consent</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isStrayCaretaker"
              checked={formData.isStrayCaretaker || false}
              onChange={handleChange}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Stray Caretaker</span>
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
          {isEdit ? 'Update Client' : 'Add Client'}
        </button>
      </div>
    </form>
  );
};

export default ClientForm;
