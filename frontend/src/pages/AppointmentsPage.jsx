import { useState, useEffect, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../context/axiosConfig';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:8080/api';

const APPOINTMENT_TYPES = [
    { value: 'EXAM', label: 'Exam', color: '#3b82f6' },
    { value: 'SURGERY', label: 'Surgery', color: '#ef4444' },
    { value: 'VACCINATION', label: 'Vaccination', color: '#e11d48' },
    { value: 'GROOMING', label: 'Grooming', color: '#f97316' },
    { value: 'CHECKUP', label: 'Check-up', color: '#a855f7' },
    { value: 'EMERGENCY', label: 'Emergency', color: '#dc2626' },
];

const APPOINTMENT_STATUSES = [
    { value: 'SCHEDULED', label: 'Scheduled', buttonClass: 'bg-blue-600 hover:bg-blue-700' },
    { value: 'CONFIRMED', label: 'Confirmed', buttonClass: 'bg-indigo-600 hover:bg-indigo-700' },
    { value: 'IN_PROGRESS', label: 'In Progress', buttonClass: 'bg-orange-600 hover:bg-orange-700' },
    { value: 'COMPLETED', label: 'Completed', buttonClass: 'bg-green-600 hover:bg-green-700' },
    { value: 'CANCELLED', label: 'Cancelled', buttonClass: 'bg-red-600 hover:bg-red-700' },
    { value: 'NO_SHOW', label: 'No Show', buttonClass: 'bg-gray-600 hover:bg-gray-700' },
];

// Helper to preserve local time in ISO string (YYYY-MM-DDTHH:mm:ss)
const toLocalISOString = (date) => {
    if (!date) return null;
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 19);
};

// ============================================
// SEARCHABLE CLIENT DROPDOWN COMPONENT
// ============================================
const ClientSearchDropdown = ({ clients, selectedClient, onSelect, disabled }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [filteredClients, setFilteredClients] = useState([]);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredClients(clients.slice(0, 10));
            return;
        }
        const searchLower = searchTerm.toLowerCase();
        const filtered = clients.filter(client => {
            const firstName = (client.firstName || '').toLowerCase();
            const lastName = (client.lastName || '').toLowerCase();
            const fullName = `${firstName} ${lastName}`;
            const phone = client.phoneNumber || client.phone || '';
            return (
                firstName.includes(searchLower) ||
                lastName.includes(searchLower) ||
                fullName.includes(searchLower) ||
                phone.includes(searchTerm)
            );
        });
        setFilteredClients(filtered.slice(0, 10));
    }, [searchTerm, clients]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (client) => {
        onSelect(client);
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleClear = () => {
        onSelect(null);
        setSearchTerm('');
        inputRef.current?.focus();
    };

    const getClientDisplayName = (client) => {
        if (!client) return '';
        const phone = client.phoneNumber || client.phone || '';
        return `${client.firstName} ${client.lastName}${phone ? ` (${phone})` : ''}`;
    };

    if (disabled && selectedClient) {
        return (
            <div className="w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-100 text-gray-600 cursor-not-allowed">
                {getClientDisplayName(selectedClient)}
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {selectedClient ? (
                <div className="flex items-center justify-between w-full border border-gray-300 rounded-md px-4 py-2 bg-blue-50">
                    <span className="text-blue-700 font-medium">
                        {getClientDisplayName(selectedClient)}
                    </span>
                    {!disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600 ml-2"
                        >
                            ✕
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsOpen(true);
                            }}
                            onFocus={() => setIsOpen(true)}
                            placeholder="Search Client by Name or Phone..."
                            disabled={disabled}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    {isOpen && filteredClients.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredClients.map((client) => (
                                <div
                                    key={client.id}
                                    onClick={() => handleSelect(client)}
                                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                    <div className="font-medium text-gray-900">
                                        {client.firstName} {client.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        📞 {client.phoneNumber || client.phone || 'No phone'}
                                        {client.email && ` • ${client.email}`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {isOpen && searchTerm && filteredClients.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
                            No clients found matching "{searchTerm}"
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ============================================
// STATUS BUTTON COMPONENT (Clickable Action Button)
// ============================================
const StatusButton = ({ status, onClick }) => {
    const config = APPOINTMENT_STATUSES.find(s => s.value === status) || {
        label: status,
        buttonClass: 'bg-blue-600 hover:bg-blue-700'
    };
    return (
        <button
            className={`px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider ${config.buttonClass}`}
            onClick={onClick}
            type="button"
        >
            {config.label}
        </button>
    );
};

// ============================================
// PATIENT HISTORY MODAL COMPONENT
// ============================================
const PatientHistoryModal = ({ patient, onClose, onViewRecord, onEditRecord, token }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (patient?.id) {
            api.get(`${API_BASE_URL}/medical-records/patient/${patient.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => setRecords(res.data))
                .catch(err => console.error("Error fetching history:", err))
                .finally(() => setLoading(false));
        }
    }, [patient, token]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-8">
                <div className="px-8 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50 mb-6 -mx-8 -mt-8 rounded-t-lg">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Medical History - {patient?.name || 'Unknown Pet'} {patient?.ownerName ? `(${patient.ownerName})` : ''}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
                </div>

                <div className="py-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="text-center text-gray-500">Loading history...</div>
                    ) : records.length === 0 ? (
                        <div className="text-center text-gray-400">No medical records found for this patient.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {records.map(record => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {formatDate(record.visitDate || record.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {record.appointment?.type || record.appointmentType || 'Visit'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">
                                            {record.diagnosis || 'No diagnosis'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => onViewRecord(record)}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="View Details"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => onEditRecord(record)}
                                                    className="text-green-600 hover:text-green-800 p-1"
                                                    title="Edit Record"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="flex justify-end mt-8 pt-6 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-bold transition-colors"
                    >
                        Back to Appointment
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// EXAMINATION MODAL COMPONENT
// ============================================
const ExaminationModal = ({ appointment, initialData, readOnly, isEditingHistory, onClose, onComplete }) => {
    const [examData, setExamData] = useState({
        weight: '',
        temperature: '',
        symptoms: '',
        diagnosis: '',
        treatment: ''
    });

    useEffect(() => {
        if (initialData) {
            setExamData({
                weight: initialData.weight || '',
                temperature: initialData.temperature || '',
                symptoms: initialData.symptoms || '',
                diagnosis: initialData.diagnosis || '',
                treatment: initialData.treatment || ''
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setExamData(prev => ({ ...prev, [name]: value }));
    };

    const props = appointment?.extendedProps || appointment || {};

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-8">
                <div className="px-8 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50 mb-6 -mx-8 -mt-8 rounded-t-lg">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {isEditingHistory ? 'Edit Medical Record' : `Medical Exam for ${props.patient?.name || 'Unknown Pet'}`}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
                </div>

                <div className="py-6 overflow-y-auto flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                            <input
                                type="number"
                                name="weight"
                                value={examData.weight}
                                onChange={handleChange}
                                disabled={readOnly}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                step="0.1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
                            <input
                                type="number"
                                name="temperature"
                                value={examData.temperature}
                                onChange={handleChange}
                                disabled={readOnly}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                step="0.1"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms (Subjective)</label>
                        <textarea
                            name="symptoms"
                            value={examData.symptoms}
                            onChange={handleChange}
                            disabled={readOnly}
                            rows="3"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis (Assessment)</label>
                        <textarea
                            name="diagnosis"
                            value={examData.diagnosis}
                            onChange={handleChange}
                            disabled={readOnly}
                            rows="3"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Treatment (Plan)</label>
                        <textarea
                            name="treatment"
                            value={examData.treatment}
                            onChange={handleChange}
                            disabled={readOnly}
                            rows="3"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                    {readOnly ? (
                        <button
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-bold transition-colors"
                        >
                            Close
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onComplete(examData)}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-bold transition-colors"
                            >
                                {isEditingHistory ? 'Update Record' : 'Complete Examination'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT: AppointmentsPage
// ============================================
const AppointmentsPage = () => {
    const { user, token } = useAuth();

    // Data State
    const [events, setEvents] = useState([]);
    const [clients, setClients] = useState([]);
    const [patients, setPatients] = useState([]);
    const [vets, setVets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [patientsLoading, setPatientsLoading] = useState(false);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);

    // Instant Search Logic
    useEffect(() => {
        if (searchTerm.trim().length > 0) {
            const term = searchTerm.toLowerCase();
            const results = events.filter(event => {
                const props = event.extendedProps || {};
                const clientName = `${props.client?.firstName || ''} ${props.client?.lastName || ''}`.toLowerCase();
                const patientName = (props.patient?.name || '').toLowerCase();
                const phone = (props.client?.phone || props.client?.phoneNumber || '').toLowerCase();
                return clientName.includes(term) || patientName.includes(term) || phone.includes(term);
            }).map(event => ({
                id: event.id,
                startTime: event.start,
                endTime: event.end,
                client: event.extendedProps.client,
                patient: event.extendedProps.patient,
                vet: event.extendedProps.vet,
                type: event.extendedProps.type,
                status: event.extendedProps.status,
                notes: event.extendedProps.notes
            }));
            setSearchResults(results);
            setShowSearchResults(true);
        } else {
            setShowSearchResults(false);
            setSearchResults([]);
        }
    }, [searchTerm, events]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState({ start: null, end: null });

    // Exam Modal State
    const [showExamModal, setShowExamModal] = useState(false);
    const [examAppointment, setExamAppointment] = useState(null);
    const [examInitialData, setExamInitialData] = useState(null);
    const [isExamReadOnly, setIsExamReadOnly] = useState(false);

    // History Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyPatient, setHistoryPatient] = useState(null);
    const [isEditingHistory, setIsEditingHistory] = useState(false);

    // Form Fields
    const [formData, setFormData] = useState({
        clientId: '',
        clientName: '',
        patientId: '',
        vetId: '',
        type: 'EXAM',
        status: 'SCHEDULED',
        notes: '',
        startTime: '',
        endTime: ''
    });

    // Expired Logic: End time is in the past AND status is SCHEDULED
    const isExpired = formData.status === 'SCHEDULED' && formData.endTime && new Date(formData.endTime) < new Date();

    // Check if appointment is completed (locked/read-only)
    const isLocked = formData.status === 'COMPLETED' || isExpired;

    // ============================================
    // DATA FETCHING
    // ============================================
    const fetchAppointments = useCallback(async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await api.get(`${API_BASE_URL}/appointments`, config);
            const formattedEvents = response.data.map(appt => {
                const typeConfig = APPOINTMENT_TYPES.find(t => t.value === appt.type) || APPOINTMENT_TYPES[0];

                // Determine color based on status first, then type
                let backgroundColor = typeConfig.color;
                let borderColor = typeConfig.color;

                const start = new Date(appt.startTime);
                const end = appt.endTime ? new Date(appt.endTime) : new Date(start.getTime() + 30 * 60000);
                const isExpired = end < new Date() && appt.status === 'SCHEDULED';

                if (appt.status === 'COMPLETED') {
                    backgroundColor = '#16a34a'; // Green
                    borderColor = '#16a34a';
                } else if (isExpired) {
                    backgroundColor = '#6b7280'; // Gray
                    borderColor = '#6b7280';
                }

                return {
                    id: appt.id,
                    title: `${appt.client?.firstName || ''} ${appt.client?.lastName || ''} - ${appt.patient?.name || ''} (Vet: ${appt.vet?.firstName || appt.vet?.username || '?'})${isExpired ? ' (No Show)' : ''}`,
                    start: toLocalISOString(start),
                    end: toLocalISOString(end),
                    allDay: false,
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    extendedProps: {
                        client: appt.client,
                        patient: appt.patient,
                        vet: appt.vet,
                        type: appt.type,
                        status: appt.status,
                        notes: appt.notes,
                        reason: appt.reason
                    }
                };
            });
            setEvents(formattedEvents);
        } catch (error) {
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchClients = useCallback(async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await api.get(`${API_BASE_URL}/clients`, config);
            setClients(response.data);
        } catch (error) {
            setClients([]);
        }
    }, [token]);

    const fetchVets = useCallback(async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await api.get(`${API_BASE_URL}/users/vets`, config);
            setVets(response.data);
        } catch (error) {
            setVets([]);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchAppointments();
            fetchClients();
            fetchVets();
        }
    }, [token, fetchAppointments, fetchClients, fetchVets]);

    // ============================================
    // EFFECTS: DATA SYNC & PARSING
    // ============================================

    // FIX: Explicit fetchPatientsForClient function
    const fetchPatientsForClient = useCallback(async (clientId) => {
        if (!clientId) {
            setPatients([]);
            return;
        }
        setPatientsLoading(true);
        try {
            // FIX: Use the correct endpoint matching ClientsPage
            const response = await api.get(`${API_BASE_URL}/patients/owner/${clientId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatients(response.data);
            console.log("Fetched pets:", response.data);
        } catch (err) {
            console.error("Error fetching patients:", err);
            setPatients([]);
        } finally {
            setPatientsLoading(false);
        }
    }, [token]);

    // Safe Data Parsing for Modal (Robust Logic)
    useEffect(() => {
        if (showModal && selectedAppointment) {
            const initialData = selectedAppointment;
            // Check if it's a FullCalendar event (has .extendedProps) or a plain object
            const props = initialData.extendedProps || initialData;

            // Safe extraction of start/end times
            let startTime = '';
            let endTime = '';

            if (initialData.start) {
                // FullCalendar Event Object (has Date objects)
                startTime = toLocalISOString(initialData.start);
                endTime = initialData.end ? toLocalISOString(initialData.end) : '';
            } else {
                // Search Result (has ISO strings) or other object
                if (initialData.startTime) {
                    const s = new Date(initialData.startTime);
                    startTime = toLocalISOString(s);
                }
                if (initialData.endTime) {
                    const e = new Date(initialData.endTime);
                    endTime = toLocalISOString(e);
                }
            }

            setFormData({
                clientId: props.client?.id || '',
                clientName: props.client ? `${props.client.firstName} ${props.client.lastName}` : '',
                patientId: props.patient?.id || '',
                vetId: props.vet?.id || '',
                type: props.type || 'EXAM',
                status: props.status || 'SCHEDULED',
                notes: props.notes || '',
                startTime: startTime,
                endTime: endTime
            });

            const client = props.client || null;
            setSelectedClient(client);

            // Trigger fetch immediately
            if (client?.id) {
                fetchPatientsForClient(client.id);
            } else {
                setPatients([]);
            }
        }
    }, [selectedAppointment, showModal, fetchPatientsForClient]);

    const handleClientSelect = (client) => {
        setSelectedClient(client);

        if (client) {
            setFormData(prev => ({
                ...prev,
                clientId: client.id,
                clientName: `${client.firstName} ${client.lastName} (${client.phoneNumber || ''})`,
                patientId: ''
            }));
            fetchPatientsForClient(client.id);
        } else {
            setFormData(prev => ({ ...prev, clientId: '', clientName: '', patientId: '' }));
            setPatients([]);
        }
    };

    // ============================================
    // CALENDAR EVENT HANDLERS
    // ============================================
    const handleDateSelect = (selectInfo) => {
        setShowModal(true);
        setIsEditMode(false);
        setSelectedAppointment(null);
        setSelectedSlot({ start: selectInfo.start, end: selectInfo.end });
        setFormData({
            clientId: '',
            clientName: '',
            patientId: '',
            vetId: '',
            type: 'EXAM',
            status: 'SCHEDULED',
            notes: '',
            startTime: toLocalISOString(selectInfo.start).slice(0, 16),
            endTime: toLocalISOString(selectInfo.end).slice(0, 16)
        });
        setSelectedClient(null);
        setPatients([]);
    };

    const handleEventClick = (clickInfo) => {
        console.log("Event clicked:", clickInfo.event);
        setShowModal(true);
        setIsEditMode(true);
        setSelectedAppointment(clickInfo.event);
        setSelectedSlot({ start: clickInfo.event.start, end: clickInfo.event.end });
    };

    const handleNewAppointment = () => {
        const now = new Date();
        const startStr = toLocalISOString(now);
        const endStr = toLocalISOString(new Date(now.getTime() + 30 * 60000));

        setShowModal(true);
        setIsEditMode(false);
        setSelectedAppointment(null);
        setSelectedSlot({ start: now, end: new Date(now.getTime() + 30 * 60000) });
        setFormData({
            clientId: '',
            clientName: '',
            patientId: '',
            vetId: '',
            type: 'EXAM',
            status: 'SCHEDULED',
            notes: '',
            startTime: startStr,
            endTime: endStr
        });
        setSelectedClient(null);
        setPatients([]);
    };

    // Helper to format payload for generic update endpoint
    // Converts nested objects (client, patient, vet) back to flat IDs
    const formatPayload = (data, overrides = {}) => {
        const props = data.extendedProps || data;

        // Extract IDs
        const clientId = props.client?.id || props.clientId;
        const patientId = props.patient?.id || props.patientId;
        const vetId = props.vet?.id || props.vetId;

        // Extract and format dates
        let start = overrides.startTime || data.start || data.startTime;
        let end = overrides.endTime || data.end || data.endTime;

        const startTime = start instanceof Date ? toLocalISOString(start) : start;
        const endTime = end instanceof Date ? toLocalISOString(end) : end;

        // Remove date fields from overrides to avoid overwriting with raw objects
        const { startTime: _s, endTime: _e, ...otherOverrides } = overrides;

        return {
            clientId,
            patientId,
            vetId,
            type: props.type,
            status: props.status,
            notes: props.notes,
            startTime,
            endTime,
            ...otherOverrides
        };
    };

    // ============================================
    // DRAG & DROP / RESIZE HANDLER (Robust)
    // ============================================
    const handleEventDrop = async (info) => {
        const { event, oldEvent } = info;
        // Calculate duration if end is null
        let newStart = event.start;
        let newEnd = event.end;
        if (!newEnd) {
            // Use original duration if possible, else default to 30min
            let duration = 30 * 60000;
            if (oldEvent && oldEvent.start && oldEvent.end) {
                duration = oldEvent.end.getTime() - oldEvent.start.getTime();
            } else if (event.extendedProps && event.extendedProps.start && event.extendedProps.end) {
                const origStart = new Date(event.extendedProps.start);
                const origEnd = new Date(event.extendedProps.end);
                duration = origEnd.getTime() - origStart.getTime();
            }
            newEnd = new Date(newStart.getTime() + duration);
        }

        // Drag & Drop Logic: Reactivate if moving to future
        const isFuture = newStart > new Date();
        let statusOverride = undefined;
        if (isFuture && event.extendedProps.status === 'SCHEDULED') {
            statusOverride = 'SCHEDULED';
        }

        // Use helper to construct payload with flat IDs
        const payload = formatPayload(event, {
            startTime: newStart,
            endTime: newEnd,
            status: statusOverride
        });

        try {
            await api.put(`${API_BASE_URL}/appointments/${event.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Appointment moved!');
            fetchAppointments();
        } catch (error) {
            info.revert();
            alert('Failed to move appointment. Please try again.');
        }
    };

    // Alias for resize
    const handleEventResize = handleEventDrop;

    // ============================================
    // FORM HANDLERS, MODAL, SEARCH, ETC.
    // ============================================
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            clientId: '',
            clientName: '',
            patientId: '',
            vetId: '',
            type: 'EXAM',
            status: 'SCHEDULED',
            notes: '',
            startTime: '',
            endTime: ''
        });
        setSelectedClient(null);
        setPatients([]);
        setSelectedSlot({ start: null, end: null });
        setHistoryPatient(null);
    };

    const handleSearchResultClick = (appointment) => {
        setShowModal(true);
        setIsEditMode(true);
        setSelectedAppointment(appointment);
        setSelectedSlot({
            start: new Date(appointment.startTime),
            end: appointment.endTime ? new Date(appointment.endTime) : null
        });
    };

    const formatDisplayDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ============================================
    // ACTIONS: SAVE, DELETE, EXAMINE, HISTORY
    // ============================================
    const handleSave = async () => {
        if (!formData.clientId || !formData.patientId || !formData.vetId || !formData.startTime) {
            alert('Please fill in all required fields (Client, Patient, Vet, Start Time).');
            return;
        }

        const payload = {
            clientId: formData.clientId,
            patientId: formData.patientId,
            vetId: formData.vetId,
            type: formData.type,
            status: formData.status,
            notes: formData.notes,
            startTime: new Date(formData.startTime).toISOString(),
            endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null
        };

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (selectedAppointment?.id) {
                // Update existing
                await api.put(`${API_BASE_URL}/appointments/${selectedAppointment.id}`, payload, config);
            } else {
                // Create new
                await api.post(`${API_BASE_URL}/appointments`, payload, config);
            }

            setShowModal(false);
            resetForm();
            fetchAppointments();
        } catch (error) {
            console.error('Error saving appointment:', error);
            alert('Failed to save appointment. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (!selectedAppointment?.id) return;

        if (!window.confirm('Are you sure you want to delete this appointment?')) {
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await api.delete(`${API_BASE_URL}/appointments/${selectedAppointment.id}`, config);
            setShowModal(false);
            resetForm();
            fetchAppointments();
        } catch (error) {
            console.error('Error deleting appointment:', error);
            alert('Failed to delete appointment.');
        }
    };

    const handleStartExam = async () => {
        if (!selectedAppointment?.id) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Step 1: Call generic API to update status to IN_PROGRESS
            const payload = formatPayload(selectedAppointment, { status: 'IN_PROGRESS' });
            await api.put(`${API_BASE_URL}/appointments/${selectedAppointment.id}`, payload, config);

            // Step 2 & 3: Close AppointmentModal and Open ExamModal
            setExamInitialData(null);
            setIsExamReadOnly(false);
            setIsEditingHistory(false);
            setShowModal(false);
            setExamAppointment(selectedAppointment);
            setShowExamModal(true);

            // Refresh calendar
            fetchAppointments();
        } catch (error) {
            console.error("Error starting exam:", error);
            alert("Failed to start examination. Please try again.");
        }
    };

    const handleViewRecord = async () => {
        if (!selectedAppointment?.id) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await api.get(`${API_BASE_URL}/medical-records/appointment/${selectedAppointment.id}`, config);

            setExamInitialData(response.data);
            setExamAppointment(selectedAppointment);
            setIsExamReadOnly(true);
            setIsEditingHistory(false);
            setShowModal(false);
            setShowExamModal(true);
        } catch (error) {
            // Handle 404: Open in Create Mode
            if (error.response && error.response.status === 404) {
                setExamInitialData(null);
                setExamAppointment(selectedAppointment);
                setIsExamReadOnly(false);
                setIsEditingHistory(false);
                setShowModal(false);
                setShowExamModal(true);
            } else {
                console.error("Error fetching medical record:", error);
                alert("Failed to load medical record.");
            }
        }
    };

    const handleCompleteExam = async (examData) => {
        // If editing history, handle update instead
        if (isEditingHistory) {
            handleUpdateHistoryRecord(examData);
            return;
        }

        if (!examAppointment?.id) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const payload = {
                appointmentId: examAppointment.id,
                weight: parseFloat(examData.weight),
                temperature: parseFloat(examData.temperature),
                symptoms: examData.symptoms,
                diagnosis: examData.diagnosis,
                treatment: examData.treatment
            };

            // POST /api/medical-records
            await api.post(`${API_BASE_URL}/medical-records`, payload, config);

            setShowExamModal(false);
            setExamAppointment(null);
            fetchAppointments();
        } catch (error) {
            console.error("Error completing exam:", error);
            alert("Failed to complete examination. Please try again.");
        }
    };

    // ============================================
    // HISTORY HANDLERS
    // ============================================
    const handleHistory = () => {
        const props = selectedAppointment?.extendedProps || selectedAppointment || {};
        const patient = props.patient;
        const client = props.client;

        if (!patient?.id) {
            alert("Please select a patient first.");
            return;
        }

        setHistoryPatient({
            ...patient,
            ownerName: client ? `${client.firstName} ${client.lastName}` : ''
        });
        setShowModal(false);
        setShowHistoryModal(true);
    };

    const handleBackToAppointment = () => {
        setShowHistoryModal(false);
        setHistoryPatient(null);
        setShowModal(true);
    };

    const handleViewHistoryRecord = (record) => {
        setExamInitialData(record);
        // Mock appointment object for header display
        setExamAppointment({ extendedProps: { patient: historyPatient } });
        setIsExamReadOnly(true);
        setIsEditingHistory(false);
        setShowHistoryModal(false);
        setShowExamModal(true);
    };

    const handleEditHistoryRecord = (record) => {
        setExamInitialData(record);
        // Mock appointment object for header display
        setExamAppointment({ extendedProps: { patient: historyPatient } });
        setIsExamReadOnly(false);
        setIsEditingHistory(true);
        setShowHistoryModal(false);
        setShowExamModal(true);
    };

    const handleUpdateHistoryRecord = async (examData) => {
        if (!examInitialData?.id) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = {
                id: examInitialData.id,
                weight: parseFloat(examData.weight),
                temperature: parseFloat(examData.temperature),
                symptoms: examData.symptoms,
                diagnosis: examData.diagnosis,
                treatment: examData.treatment
            };

            await api.put(`${API_BASE_URL}/medical-records/${examInitialData.id}`, payload, config);

            setShowExamModal(false);
            setShowHistoryModal(true); // Return to history list
        } catch (error) {
            console.error("Error updating record:", error);
            alert("Failed to update medical record.");
        }
    };

    const handleCloseExamModal = () => {
        setShowExamModal(false);
        setExamAppointment(null);
        setExamInitialData(null);
        setIsEditingHistory(false);
        setIsExamReadOnly(false);

        // If we were in history flow (patient is set), return to history list
        if (historyPatient) {
            setShowHistoryModal(true);
        }
    };

    // ============================================
    // RENDER
    // ============================================
    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-500">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* ===== HEADER & SEARCH ===== */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
                    <p className="text-gray-500 mt-1">Manage your schedule efficiently</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Search client, patient..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* New Appointment Button */}
                    <button
                        onClick={handleNewAppointment}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2 whitespace-nowrap shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Appointment
                    </button>
                </div>
            </div>

            {/* ===== LEGEND ===== */}
            <div className="flex flex-wrap gap-3 mb-6">
                {APPOINTMENT_TYPES.map(type => (
                    <div key={type.value} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></div>
                        <span className="text-sm font-medium text-gray-700">{type.label}</span>
                    </div>
                ))}
            </div>

            {/* ===== SEARCH RESULTS TABLE ===== */}
            {showSearchResults && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                    {searchResults.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-400">
                            No appointments found matching "{searchTerm}"
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date/Time
                                    </th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Owner (Phone)
                                    </th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Pet
                                    </th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reason
                                    </th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {searchResults.map((appointment) => (
                                    <tr
                                        key={appointment.id}
                                        onClick={() => handleSearchResultClick(appointment)}
                                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">
                                                {formatDisplayDateTime(appointment.startTime)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">
                                                {appointment.client?.firstName} {appointment.client?.lastName}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {appointment.client?.phone || appointment.client?.phoneNumber || 'No phone'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">
                                                🐾 {appointment.patient?.name || 'Unknown'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {appointment.patient?.species || ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900">{appointment.type}</div>
                                            {appointment.notes && (
                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                    {appointment.notes}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusButton
                                                status={appointment.status}
                                                onClick={() => handleSearchResultClick(appointment)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ===== CALENDAR SECTION ===== */}
            {!showSearchResults && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        events={events}
                        selectable={true}
                        selectMirror={true}
                        dayMaxEvents={true}
                        weekends={true}
                        select={handleDateSelect}
                        eventClick={handleEventClick}
                        slotMinTime="00:00:00"
                        slotMaxTime="24:00:00"
                        allDaySlot={false}
                        slotDuration="00:30:00"
                        height="auto"
                        eventDisplay="block"
                        nowIndicator={true}
                        editable={true}
                        eventDrop={handleEventDrop}
                        eventResize={handleEventResize}
                    />
                </div>
            )}

            {/* ===== APPOINTMENT MODAL ===== */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-8">
                        {/* Modal Header */}
                        <div className="px-8 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50 mb-6 -mx-8 -mt-8 rounded-t-lg">
                            <div className="ml-8">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {formData.status === 'COMPLETED' ? 'Medical Record' : (isExpired ? 'Appointment Expired' : (isEditMode ? 'Edit Appointment' : 'New Appointment'))}
                                    </h2>
                                    {formData.status === 'COMPLETED' && (
                                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase">
                                            🔒 Completed
                                        </span>
                                    )}
                                    {isExpired && (
                                        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full uppercase">
                                            ⚠️ Expired
                                        </span>
                                    )}
                                </div>
                                {selectedSlot.start && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        {selectedSlot.start.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold mr-8"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="py-6 overflow-y-auto flex-1">
                            {isExpired && (
                                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-r-md">
                                    <p className="font-bold flex items-center gap-2">
                                        <span className="text-xl">⚠️</span> This appointment has passed.
                                    </p>
                                    <p className="mt-1 ml-8 text-sm">Drag and drop it to a future time/date on the calendar to reactivate it.</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-6">
                                {/* Start Time */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="startTime"
                                        value={formData.startTime}
                                        onChange={handleFormChange}
                                        className="w-full border border-gray-300 rounded-md px-4 py-2"
                                        disabled={isLocked}
                                    />
                                </div>
                                {/* End Time */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="endTime"
                                        value={formData.endTime}
                                        onChange={handleFormChange}
                                        className="w-full border border-gray-300 rounded-md px-4 py-2"
                                        disabled={isLocked}
                                    />
                                </div>

                                {/* Client */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Client <span className="text-red-500">*</span>
                                    </label>
                                    <ClientSearchDropdown
                                        clients={clients}
                                        selectedClient={selectedClient}
                                        onSelect={handleClientSelect}
                                        disabled={isEditMode || isLocked}
                                    />
                                </div>

                                {/* Patient */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Patient <span className="text-red-500">*</span>
                                        {patientsLoading && <span className="text-blue-500 ml-2">(Loading...)</span>}
                                    </label>
                                    {!selectedClient ? (
                                        <div className="w-full border border-dashed border-gray-300 rounded-md px-4 py-2 bg-gray-50 text-gray-400">
                                            Select a client first
                                        </div>
                                    ) : patientsLoading ? (
                                        <div className="w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-50 text-gray-500">
                                            Loading pets...
                                        </div>
                                    ) : patients.length === 0 ? (
                                        <div className="w-full border border-yellow-300 rounded-md px-4 py-2 bg-yellow-50 text-yellow-800">
                                            ⚠️ No pets registered.{' '}
                                            <a href="/clients" className="text-blue-600 hover:underline">Add a pet</a>
                                        </div>
                                    ) : (
                                        <select
                                            name="patientId"
                                            value={formData.patientId}
                                            onChange={handleFormChange}
                                            className="w-full border border-gray-300 rounded-md px-4 py-2"
                                            disabled={isLocked}
                                        >
                                            <option value="">Select a pet...</option>
                                            {patients.map(patient => (
                                                <option key={patient.id} value={patient.id}>
                                                    {patient.name} ({patient.species}{patient.breed ? ` - ${patient.breed}` : ''})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Veterinarian */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Veterinarian <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="vetId"
                                        value={formData.vetId}
                                        onChange={handleFormChange}
                                        className="w-full border border-gray-300 rounded-md px-4 py-2"
                                        disabled={isLocked}
                                    >
                                        <option value="">Select a vet...</option>
                                        {vets.map(vet => (
                                            <option key={vet.id} value={vet.id}>
                                                {vet.firstName && vet.lastName ? `${vet.firstName} ${vet.lastName}` : vet.username}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Appointment Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Appointment Type
                                    </label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleFormChange}
                                        className="w-full border border-gray-300 rounded-md px-4 py-2"
                                        disabled={isLocked}
                                    >
                                        {APPOINTMENT_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status (Edit Mode Only - NOT locked for status changes until saved) */}
                                {isEditMode && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleFormChange}
                                            className="w-full border border-gray-300 rounded-md px-4 py-2"
                                            disabled={isLocked}
                                        >
                                            {APPOINTMENT_STATUSES.map(status => (
                                                <option key={status.value} value={status.value}>
                                                    {status.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Notes (Full Width - Read-only when locked) */}
                                <div className={isEditMode ? 'col-span-1' : 'col-span-2'}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes {isLocked && <span className="text-gray-400">(Read Only)</span>}
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleFormChange}
                                        readOnly={isLocked}
                                        rows={3}
                                        placeholder={isLocked ? '' : 'Add any notes about this appointment...'}
                                        className={`w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${isLocked ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                            {/* Left Group */}
                            <div className="flex gap-3">
                                {selectedAppointment?.id && (
                                    <>
                                        {!isExpired && (
                                            <button
                                                onClick={handleDelete}
                                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-bold transition-colors"
                                                disabled={isLocked}
                                            >
                                                Delete
                                            </button>
                                        )}
                                        {!isLocked && (
                                            <button
                                                onClick={handleStartExam}
                                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-bold transition-colors"
                                            >
                                                Examine
                                            </button>
                                        )}
                                        <button
                                            onClick={handleHistory}
                                            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md font-bold transition-colors"
                                        >
                                            History
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Right Group */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                {!isExpired && (
                                    <button
                                        onClick={handleSave}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-bold transition-colors"
                                        disabled={isLocked}
                                    >
                                        {selectedAppointment?.id ? 'Update' : 'Save'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== PATIENT HISTORY MODAL ===== */}
            {showHistoryModal && (
                <PatientHistoryModal
                    patient={historyPatient}
                    onClose={handleBackToAppointment}
                    onViewRecord={handleViewHistoryRecord}
                    onEditRecord={handleEditHistoryRecord}
                    token={token}
                />
            )}

            {/* ===== EXAMINATION MODAL ===== */}
            {showExamModal && (
                <ExaminationModal
                    appointment={examAppointment}
                    initialData={examInitialData}
                    readOnly={isExamReadOnly}
                    isEditingHistory={isEditingHistory}
                    onClose={handleCloseExamModal}
                    onComplete={handleCompleteExam}
                />
            )}
        </div>
    );
};

export default AppointmentsPage;
