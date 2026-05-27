import React from 'react';

/**
 * Client table component displaying the client list.
 *
 * @param {Array} clients - Array of client objects
 * @param {function} onEdit - Called with client object when edit button is clicked
 * @param {function} onDelete - Called with client id when delete button is clicked
 * @param {function} onSelect - Called with client object when row is clicked
 */
const ClientTable = ({ clients, onEdit, onDelete, onSelect }) => {
  if (!clients || clients.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No clients found</p>
        <p className="text-sm mt-1">Add a new client to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pets
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clients.map((client) => (
            <tr
              key={client.id}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onSelect?.(client)}
            >
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {client.firstName} {client.lastName}
                </div>
                {client.isStrayCaretaker && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                    Stray Caretaker
                  </span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {client.email}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {client.phone || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {client.petCount || 0}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(client);
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(client.id);
                  }}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientTable;
