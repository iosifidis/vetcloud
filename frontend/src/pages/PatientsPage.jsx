import React, { useState, useEffect } from 'react';
import api from '../context/axiosConfig';
import { useAuth } from '../context/AuthContext';
import PatientHistoryModal from '../components/PatientHistoryModal';
import MedicalRecordModal from '../components/MedicalRecordModal';

// ============================================
// MAIN COMPONENT: PatientsPage
// ============================================
const PatientsPage = () => {
    const { token } = useAuth();
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredPatients(patients);
            return;
        }

        const searchLower = searchTerm.toLowerCase();

        const filtered = patients.filter(patient => {
            const petName = (patient.name || '').toLowerCase();
            const species = (patient.species || '').toLowerCase();
            const breed = (patient.breed || '').toLowerCase();
            const ownerName = (patient.ownerName || '').toLowerCase();
            const ownerPhone = (patient.ownerPhone || '').toLowerCase();

            return (
                petName.includes(searchLower) ||
                species.includes(searchLower) ||
                breed.includes(searchLower) ||
                ownerName.includes(searchLower) ||
                ownerPhone.includes(searchLower)
            );
        });

        setFilteredPatients(filtered);
    }, [searchTerm, patients]);

    const fetchPatients = async () => {
        try {
            // NOTE: We don't have a direct /api/patients endpoint that returns ALL patients with owner info clearly flattened.
            // We have /api/clients which includes pets.
            // It might be better to fetch clients and flatten the list of pets from there 
            // OR use /api/patients if it exists.

            // Let's try to fetch clients and extract pets to ensure we have owner info which is crucial for search.
            const response = await api.get('http://localhost:8080/api/clients', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const clients = response.data || [];
            const allPatients = [];

            clients.forEach(client => {
                if (client.pets && Array.isArray(client.pets)) {
                    client.pets.forEach(pet => {
                        allPatients.push({
                            ...pet,
                            ownerId: client.id,
                            ownerName: `${client.firstName} ${client.lastName}`,
                            ownerPhone: client.phoneNumber || client.phone
                        });
                    });
                }
            });

            setPatients(allPatients);
            setFilteredPatients(allPatients);

        } catch (error) {
            console.error('Error fetching patients:', error);
            // Try fallback to /api/patients if clients fail? 
            // For now, assuming Clients -> Pets is the source of truth as seen in ClientsPage.
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistory = (patient) => {
        setSelectedPatient(patient);
        setShowHistoryModal(true);
    };

    const handleEditRecord = (record) => {
        // Close history modal temporarily or keep it open?
        // ClientsPage keeps history open underneath. We can do the same.
        // But the modal overlay might conflict if z-indices aren't managed.
        // ClientsPage manages it by stacking. MedicalRecordModal has z-index 10000.
        // PatientHistoryModal has z-index 9999. So it should stack fine.
        setSelectedRecord(record);
        setIsEditRecordModalOpen(true);
    };

    const handleRecordSaved = () => {
        setIsEditRecordModalOpen(false);
        setSelectedRecord(null);
        // We might want to refresh the history modal data.
        // PatientHistoryModal fetches data on mount/update of 'patient'.
        // If we want to refresh it, we might need a trigger or re-open it.
        // But PatientHistoryModal doesn't expose a refresh method.
        // We can force a refresh by closing and opening, or better: 
        // passing a refresh trigger. 
        // For now, let's just close the edit modal. Users can reopen history to see changes if needed, 
        // or we can try to improve PatientHistoryModal to listen to updates.
        // Actually, let's keep it simple: just close edit modal. 
        // If the user is viewing history, they might need to close/reopen to see the change.
        // To fix this properly, PatientHistoryModal could take a 'refreshTrigger' prop.
        // But for 'Same button as Clients', ClientsPage refreshes the list in its own modal.
        // Here, PatientHistoryModal manages its own list. 
        // Let's rely on re-opening for now or just trust it.
        // Wait, ClientsPage passes `fetchRecords` to `onSave`. 
        // We can modify PatientHistoryModal to expose a refresh trigger?
        // Or simply cycle the patient object to trigger useEffect?
        setSelectedPatient({ ...selectedPatient });
    };

    const closeModals = () => {
        setShowHistoryModal(false);
        setSelectedPatient(null);
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-gray-900">Patients</h1>
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Search by Pet, Owner, or Phone..."
                        className="border border-gray-300 rounded-md px-4 py-2 w-96 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading patients...</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Patient Name
                                </th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Species / Breed
                                </th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Owner
                                </th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Age / Sex
                                </th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        {searchTerm ? 'No patients found matching your search' : 'No patients registered yet'}
                                    </td>
                                </tr>
                            ) : (
                                filteredPatients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{patient.name}</div>
                                            {patient.isDeceased && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                    Deceased
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{patient.species}</div>
                                            <div className="text-sm text-gray-500">{patient.breed || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-blue-600">
                                                {patient.ownerName}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {patient.ownerPhone || 'No Phone'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {patient.sex || '-'}
                                                {patient.birthDate && (
                                                    <span className="text-gray-500 ml-1">
                                                        ({new Date().getFullYear() - new Date(patient.birthDate).getFullYear()}y)
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleViewHistory(patient)}
                                                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-semibold transition-colors text-sm"
                                            >
                                                History / Timeline
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
                    onClose={closeModals}
                    onEditRecord={handleEditRecord}
                    token={token}
                />
            )}

            {/* Edit Record Modal */}
            {isEditRecordModalOpen && selectedRecord && (
                <MedicalRecordModal
                    record={selectedRecord}
                    onClose={() => setIsEditRecordModalOpen(false)}
                    onSave={handleRecordSaved}
                    token={token}
                />
            )}
        </div>
    );
};

export default PatientsPage;
