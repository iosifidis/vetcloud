import { useState, useEffect } from 'react';
import { patientsAPI } from '../api';
import PatientHistoryModal from '../components/PatientHistoryModal';
import { usePatients } from '../hooks';

const PatientsPage = () => {
  const { patients, loading } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const filtered = patients.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(term) ||
      (p.species || '').toLowerCase().includes(term) ||
      (p.breed || '').toLowerCase().includes(term) ||
      (p.ownerFirstName || '').toLowerCase().includes(term) ||
      (p.ownerLastName || '').toLowerCase().includes(term)
    );
  });

  const handleViewHistory = (patient) => {
    setSelectedPatient({
      ...patient,
      ownerName: `${patient.ownerFirstName || ''} ${patient.ownerLastName || ''}`.trim(),
    });
    setShowHistoryModal(true);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
        <input
          type="text"
          placeholder="Search by name, species, breed, or owner..."
          className="border border-gray-300 rounded-md px-4 py-2 w-96 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading patients...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Species / Breed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age / Sex</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    {searchTerm ? 'No patients match your search.' : 'No patients registered yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map(patient => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{patient.name}</div>
                      {patient.isDeceased && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 mt-0.5">
                          Deceased
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">{patient.species}</div>
                      <div className="text-sm text-gray-500">{patient.breed || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-blue-700">
                        {patient.ownerFirstName} {patient.ownerLastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {patient.sex || '—'}
                      {patient.birthDate && (
                        <span className="text-gray-400 ml-1">
                          ({new Date().getFullYear() - new Date(patient.birthDate).getFullYear()}y)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewHistory(patient)}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                      >
                        History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* History Modal */}
      {showHistoryModal && selectedPatient && (
        <PatientHistoryModal
          patient={selectedPatient}
          onClose={() => { setShowHistoryModal(false); setSelectedPatient(null); }}
        />
      )}
    </div>
  );
};

export default PatientsPage;
