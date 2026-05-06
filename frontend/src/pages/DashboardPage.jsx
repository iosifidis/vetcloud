import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { isToday, isThisWeek } from 'date-fns';
import api from '../context/axiosConfig';
import { useAuth } from '../context/AuthContext';
import PatientHistoryModal from '../components/PatientHistoryModal';
import ClientSearchDropdown from '../components/ClientSearchDropdown';

const API_BASE_URL = 'http://localhost:8080/api';

// ============================================
// CONSTANTS & HELPERS
// ============================================
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

// Helper to preserve local time in ISO string
const toLocalISOString = (date) => {
    if (!date) return null;
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 19);
};

// ============================================
// HELPER COMPONENTS (Ported from AppointmentsPage)
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
// MAIN COMPONENT: DashboardPage
// ============================================
const DashboardPage = () => {
    const { user, token } = useAuth();

    // Data State
    const [rawAppointments, setRawAppointments] = useState([]);
    const [dashboardStats, setDashboardStats] = useState({ totalPatients: 0 });
    const [clients, setClients] = useState([]);
    const [patients, setPatients] = useState([]);
    const [vets, setVets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [patientsLoading, setPatientsLoading] = useState(false);

    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState({ start: null, end: null });
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedVet, setSelectedVet] = useState('');

    // Clock State
    const [currentTime, setCurrentTime] = useState(new Date());

    // Exam Modal State
    const [showExamModal, setShowExamModal] = useState(false);
    const [examAppointment, setExamAppointment] = useState(null);
    const [examInitialData, setExamInitialData] = useState(null);
    const [isExamReadOnly, setIsExamReadOnly] = useState(false);

    // History Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyPatient, setHistoryPatient] = useState(null);
    const [isEditingHistory, setIsEditingHistory] = useState(false);

    // Dashboard Card Modals state
    const [showTodayModal, setShowTodayModal] = useState(false);
    const [showWeekModal, setShowWeekModal] = useState(false);

    // Form Data
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

    // Fetch Appointments (Fetches ALL, filtering happens in useMemo)
    const fetchAppointments = useCallback(async () => {
        if (!token) return;
        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const response = await api.get(`${API_BASE_URL}/appointments`, config);
            setRawAppointments(response.data || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    }, [token]);

    // Fetch Patients for Client
    const fetchPatientsForClient = useCallback(async (clientId) => {
        if (!clientId) {
            setPatients([]);
            return;
        }
        setPatientsLoading(true);
        try {
            const response = await api.get(`${API_BASE_URL}/patients/owner/${clientId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatients(response.data);
        } catch (err) {
            console.error("Error fetching patients:", err);
            setPatients([]);
        } finally {
            setPatientsLoading(false);
        }
    }, [token]);

    // Initial Load Effect (Independent of User)
    useEffect(() => {
        const loadDashboardData = async () => {
            if (!token) return;

            try {
                setLoading(true);
                const config = { headers: { Authorization: `Bearer ${token}` } };

                // Fetch Stats, Clients, Vets in parallel
                const [statsRes, clientsRes, vetsRes] = await Promise.all([
                    api.get(`${API_BASE_URL}/dashboard/stats`, config),
                    api.get(`${API_BASE_URL}/clients`, config),
                    api.get(`${API_BASE_URL}/users/vets`, config).catch(() => ({ data: [] }))
                ]);

                setDashboardStats({
                    totalPatients: statsRes.data.totalPatients || 0,
                });
                setClients(clientsRes.data || []);
                setVets(vetsRes.data || []);

                // Fetch Appointments
                await fetchAppointments();

            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [token, fetchAppointments]); // Intentionally excludes 'user' to prevent loops

    // ============================================
    // FILTERING & DERIVED STATE
    // ============================================

    // Robust Filtering: Compare Usernames (Handles missing user.id)
    const myAppointments = useMemo(() => {
        if (!user || !rawAppointments.length) return [];
        // robust check: compare usernames as strings
        return rawAppointments.filter(appt =>
            appt.vet?.username && user.username &&
            appt.vet.username === user.username
        );
    }, [user, rawAppointments]);

    // Calculate Stats from Filtered List
    const todaysAppointmentsList = useMemo(() => {
        return myAppointments.filter(appt => isToday(new Date(appt.startTime)))
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }, [myAppointments]);

    const weeksAppointmentsList = useMemo(() => {
        return myAppointments.filter(appt => isThisWeek(new Date(appt.startTime), { weekStartsOn: 1 }))
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }, [myAppointments]);

    const stats = useMemo(() => {
        const todayCount = todaysAppointmentsList.length;
        const weekCount = weeksAppointmentsList.length;

        return {
            todayAppointments: todayCount,
            weekAppointments: weekCount,
        };
    }, [myAppointments, todaysAppointmentsList, dashboardStats]);

    // Clock Effect
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Get Next Appointment
    const nextAppointment = useMemo(() => {
        const now = new Date();
        return myAppointments
            .filter(appt => new Date(appt.startTime) > now && appt.status !== 'CANCELLED')
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];
    }, [myAppointments, currentTime]); // Re-evaluate as time passes (optional, but good for immediate updates)

    // Format Events for Calendar
    const events = useMemo(() => {
        return myAppointments.map(appt => {
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
                backgroundColor,
                borderColor,
                extendedProps: {
                    client: appt.client,
                    patient: appt.patient,
                    vet: appt.vet,
                    type: appt.type,
                    status: appt.status,
                    notes: appt.notes
                }
            };
        });
    }, [myAppointments]);

    // Auto-select current vet in form when user is available
    useEffect(() => {
        if (user && vets.length > 0 && !formData.vetId) {
            const currentVet = vets.find(v => v.username === user.username);
            if (currentVet) {
                setFormData(prev => ({ ...prev, vetId: currentVet.id }));
            }
        }
    }, [user, vets, formData.vetId]);

    // Safe Data Parsing for Modal
    useEffect(() => {
        if (showModal && selectedAppointment) {
            const initialData = selectedAppointment;
            const props = initialData.extendedProps || initialData;

            let startTime = '';
            let endTime = '';

            if (initialData.start) {
                // FullCalendar Event Object
                startTime = toLocalISOString(initialData.start).slice(0, 16);
                endTime = initialData.end ? toLocalISOString(initialData.end).slice(0, 16) : '';
            } else if (initialData.startTime) {
                // Raw Appointment Object
                startTime = toLocalISOString(new Date(initialData.startTime)).slice(0, 16);
                endTime = initialData.endTime ? toLocalISOString(new Date(initialData.endTime)).slice(0, 16) : '';
            }

            setFormData({
                clientId: props.client?.id || '',
                clientName: props.client ? `${props.client.firstName} ${props.client.lastName}` : '',
                patientId: props.patient?.id || '',
                vetId: props.vet?.id || (user && vets.find(v => v.username === user.username)?.id) || '',
                type: props.type || 'EXAM',
                status: props.status || 'SCHEDULED',
                notes: props.notes || '',
                startTime: startTime,
                endTime: endTime
            });

            const client = props.client || null;
            setSelectedClient(client);

            if (client?.id) {
                fetchPatientsForClient(client.id);
            } else {
                setPatients([]);
            }
        }
    }, [selectedAppointment, showModal, fetchPatientsForClient, user, vets]);

    // ============================================
    // HANDLERS
    // ============================================

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleClientSelect = (client) => {
        setSelectedClient(client);
        if (client) {
            setFormData(prev => ({
                ...prev,
                clientId: client.id,
                clientName: `${client.firstName} ${client.lastName}`,
                patientId: ''
            }));
            fetchPatientsForClient(client.id);
        } else {
            setFormData(prev => ({ ...prev, clientId: '', clientName: '', patientId: '' }));
            setPatients([]);
        }
    };

    const resetForm = () => {
        setFormData({
            clientId: '',
            clientName: '',
            patientId: '',
            vetId: (user && vets.find(v => v.username === user.username)?.id) || '',
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

    const handleDateSelect = (selectInfo) => {
        setShowModal(true);
        setIsEditMode(false);
        setSelectedAppointment(null);
        setSelectedSlot({ start: selectInfo.start, end: selectInfo.end });
        setFormData({
            clientId: '',
            clientName: '',
            patientId: '',
            vetId: (user && vets.find(v => v.username === user.username)?.id) || '',
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
        setShowModal(true);
        setIsEditMode(true);
        setSelectedAppointment(clickInfo.event);
        setSelectedSlot({ start: clickInfo.event.start, end: clickInfo.event.end });
    };

    // Helper to format payload
    const formatPayload = (data, overrides = {}) => {
        const props = data.extendedProps || data;
        const clientId = props.client?.id || props.clientId;
        const patientId = props.patient?.id || props.patientId;
        const vetId = props.vet?.id || props.vetId;

        let start = overrides.startTime || data.start || data.startTime;
        let end = overrides.endTime || data.end || data.endTime;

        const startTime = start instanceof Date ? toLocalISOString(start) : start;
        const endTime = end instanceof Date ? toLocalISOString(end) : end;

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

    // Drag & Drop Logic
    const handleEventDrop = async (info) => {
        const { event, oldEvent } = info;
        let newStart = event.start;
        let newEnd = event.end;
        if (!newEnd) {
            let duration = 30 * 60000;
            if (oldEvent && oldEvent.start && oldEvent.end) {
                duration = oldEvent.end.getTime() - oldEvent.start.getTime();
            }
            newEnd = new Date(newStart.getTime() + duration);
        }

        // Reactivate if moving to future
        const isFuture = newStart > new Date();
        let statusOverride = undefined;
        if (isFuture && event.extendedProps.status === 'SCHEDULED') {
            statusOverride = 'SCHEDULED';
        }

        const payload = formatPayload(event, {
            startTime: newStart,
            endTime: newEnd,
            status: statusOverride
        });

        try {
            await api.put(`${API_BASE_URL}/appointments/${event.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAppointments();
        } catch (error) {
            info.revert();
            alert('Failed to move appointment.');
        }
    };

    const handleSave = async () => {
        if (!formData.clientId || !formData.patientId || !formData.vetId || !formData.startTime) {
            alert('Please fill in all required fields.');
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
                await api.put(`${API_BASE_URL}/appointments/${selectedAppointment.id}`, payload, config);
            } else {
                await api.post(`${API_BASE_URL}/appointments`, payload, config);
            }
            setShowModal(false);
            resetForm();
            fetchAppointments();
        } catch (error) {
            console.error('Error saving appointment:', error);
            alert('Failed to save appointment.');
        }
    };

    const handleDelete = async () => {
        if (!selectedAppointment?.id) return;
        if (!window.confirm('Are you sure you want to delete this appointment?')) return;

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
            const payload = formatPayload(selectedAppointment, { status: 'IN_PROGRESS' });
            await api.put(`${API_BASE_URL}/appointments/${selectedAppointment.id}`, payload, config);

            setExamInitialData(null);
            setIsExamReadOnly(false);
            setIsEditingHistory(false);
            setShowModal(false);
            setExamAppointment(selectedAppointment);
            setShowExamModal(true);
            fetchAppointments();
        } catch (error) {
            console.error("Error starting exam:", error);
            alert("Failed to start examination.");
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
            await api.post(`${API_BASE_URL}/medical-records`, payload, config);
            setShowExamModal(false);
            setExamAppointment(null);
            fetchAppointments();
        } catch (error) {
            console.error("Error completing exam:", error);
            alert("Failed to complete examination.");
        }
    };

    // History Handlers
    const handleHistory = () => {
        const props = selectedAppointment?.extendedProps || selectedAppointment || {};
        const patient = props.patient;
        const client = props.client;
        if (!patient?.id) {
            alert("Please select a patient first.");
            return;
        }
        setHistoryPatient({ ...patient, ownerName: client ? `${client.firstName} ${client.lastName}` : '' });
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
        setExamAppointment({ extendedProps: { patient: historyPatient } });
        setIsExamReadOnly(true);
        setIsEditingHistory(false);
        setShowHistoryModal(false);
        setShowExamModal(true);
    };

    const handleEditHistoryRecord = (record) => {
        setExamInitialData(record);
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
            setShowHistoryModal(true);
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
        if (historyPatient) setShowHistoryModal(true);
    };

    // ============================================
    // RENDER
    // ============================================
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-600">Loading dashboard...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-6 text-center text-gray-600">
                Please log in to view the dashboard.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                    onClick={() => setShowTodayModal(true)}
                    className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 cursor-pointer hover:bg-blue-50 transition-colors group h-full flex flex-col justify-center"
                >
                    <div className="flex items-center justify-between w-full">
                        <div>
                            <p className="text-sm font-medium text-gray-600 group-hover:text-blue-700">Today's Appointments</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.todayAppointments}</p>
                        </div>
                        <div className="text-4xl group-hover:scale-110 transition-transform">📅</div>
                    </div>
                </div>
                <div
                    onClick={() => setShowWeekModal(true)}
                    className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500 cursor-pointer hover:bg-green-50 transition-colors group h-full flex flex-col justify-center"
                >
                    <div className="flex items-center justify-between w-full">
                        <div>
                            <p className="text-sm font-medium text-gray-600 group-hover:text-green-700">Week's Appointments</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.weekAppointments}</p>
                        </div>
                        <div className="text-4xl group-hover:scale-110 transition-transform">📊</div>
                    </div>
                </div>
                <div
                    onClick={() => {
                        if (nextAppointment) {
                            setSelectedAppointment(nextAppointment);
                            setIsEditMode(true);
                            setShowModal(true);
                        }
                    }}
                    className={`bg-white rounded-lg shadow p-6 border-l-4 border-purple-500 transition-colors group h-full ${nextAppointment ? 'cursor-pointer hover:bg-purple-50' : ''}`}
                >
                    <div className="flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                                <p className="text-2xl font-bold text-gray-900 leading-none mt-1">
                                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div className="text-3xl animate-pulse">🕒</div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Next Appointment</p>
                            {nextAppointment ? (
                                <div>
                                    <p className="text-lg font-bold text-purple-700 group-hover:text-purple-900 truncate">
                                        {nextAppointment.patient?.name}
                                    </p>
                                    <p className="text-sm text-gray-600 truncate">
                                        Owner: {nextAppointment.client?.firstName} {nextAppointment.client?.lastName}
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1 font-medium bg-blue-50 inline-block px-1.5 py-0.5 rounded">
                                        {new Date(nextAppointment.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-gray-400 italic text-sm">No upcoming appointments</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">My Schedule</h2>
                <div>
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
                    />
                </div>
            </div>

            {/* ===== TODAY'S APPOINTMENTS MODAL ===== */}
            {showTodayModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">Today's Appointments</h2>
                            <button onClick={() => setShowTodayModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {todaysAppointmentsList.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No appointments scheduled for today.</p>
                            ) : (
                                <div className="space-y-4">
                                    {todaysAppointmentsList.map(appt => (
                                        <div key={appt.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="font-bold text-lg text-gray-900">
                                                        {new Date(appt.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase border ${APPOINTMENT_TYPES.find(t => t.value === appt.type)
                                                        ? `bg-[${APPOINTMENT_TYPES.find(t => t.value === appt.type)?.color}] text-gray-800 bg-opacity-20 border-opacity-30`
                                                        : 'bg-gray-100 text-gray-800'
                                                        }`} style={{
                                                            borderColor: APPOINTMENT_TYPES.find(t => t.value === appt.type)?.color,
                                                            color: APPOINTMENT_TYPES.find(t => t.value === appt.type)?.color
                                                        }}>
                                                        {APPOINTMENT_TYPES.find(t => t.value === appt.type)?.label || appt.type}
                                                    </span>
                                                </div>
                                                <div className="text-gray-900 font-medium">
                                                    {appt.patient?.name} <span className="text-gray-500 font-normal">({appt.patient?.species})</span>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Owner: {appt.client?.firstName} {appt.client?.lastName}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${appt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                    appt.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-800' :
                                                        appt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {appt.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                            <button onClick={() => setShowTodayModal(false)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== WEEK'S APPOINTMENTS MODAL ===== */}
            {showWeekModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">This Week's Appointments</h2>
                            <button onClick={() => setShowWeekModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {weeksAppointmentsList.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No appointments scheduled for this week.</p>
                            ) : (
                                <div className="space-y-4">
                                    {weeksAppointmentsList.map(appt => (
                                        <div key={appt.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                        {new Date(appt.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <span className="font-bold text-lg text-gray-900">
                                                        {new Date(appt.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase border ${APPOINTMENT_TYPES.find(t => t.value === appt.type)
                                                        ? `bg-[${APPOINTMENT_TYPES.find(t => t.value === appt.type)?.color}] text-gray-800 bg-opacity-20 border-opacity-30`
                                                        : 'bg-gray-100 text-gray-800'
                                                        }`} style={{
                                                            borderColor: APPOINTMENT_TYPES.find(t => t.value === appt.type)?.color,
                                                            color: APPOINTMENT_TYPES.find(t => t.value === appt.type)?.color
                                                        }}>
                                                        {APPOINTMENT_TYPES.find(t => t.value === appt.type)?.label || appt.type}
                                                    </span>
                                                </div>
                                                <div className="text-gray-900 font-medium">
                                                    {appt.patient?.name} <span className="text-gray-500 font-normal">({appt.patient?.species})</span>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Owner: {appt.client?.firstName} {appt.client?.lastName}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${appt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                    appt.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-800' :
                                                        appt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {appt.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                            <button onClick={() => setShowWeekModal(false)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== APPOINTMENT MODAL ===== */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-8">
                        {/* Header */}
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
                                        {selectedSlot.start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                )}
                            </div>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 text-2xl font-bold mr-8">×</button>
                        </div>

                        {/* Body */}
                        <div className="py-6 overflow-y-auto flex-1">
                            {isExpired && (
                                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-r-md">
                                    <p className="font-bold flex items-center gap-2"><span className="text-xl">⚠️</span> This appointment has passed.</p>
                                    <p className="mt-1 ml-8 text-sm">Drag and drop it to a future time/date on the calendar to reactivate it.</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time <span className="text-red-500">*</span></label>
                                    <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleFormChange} className="w-full border border-gray-300 rounded-md px-4 py-2" disabled={isLocked} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time <span className="text-red-500">*</span></label>
                                    <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleFormChange} className="w-full border border-gray-300 rounded-md px-4 py-2" disabled={isLocked} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Client <span className="text-red-500">*</span></label>
                                    <ClientSearchDropdown clients={clients} selectedClient={selectedClient} onSelect={handleClientSelect} disabled={isEditMode || isLocked} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Patient <span className="text-red-500">*</span> {patientsLoading && <span className="text-blue-500 ml-2">(Loading...)</span>}</label>
                                    {!selectedClient ? (
                                        <div className="w-full border border-dashed border-gray-300 rounded-md px-4 py-2 bg-gray-50 text-gray-400">Select a client first</div>
                                    ) : patients.length === 0 ? (
                                        <div className="w-full border border-yellow-300 rounded-md px-4 py-2 bg-yellow-50 text-yellow-800">⚠️ No pets registered.</div>
                                    ) : (
                                        <select name="patientId" value={formData.patientId} onChange={handleFormChange} className="w-full border border-gray-300 rounded-md px-4 py-2" disabled={isLocked}>
                                            <option value="">Select a pet...</option>
                                            {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Veterinarian <span className="text-red-500">*</span></label>
                                    <select name="vetId" value={formData.vetId} onChange={handleFormChange} className="w-full border border-gray-300 rounded-md px-4 py-2" disabled={isLocked}>
                                        <option value="">Select a vet...</option>
                                        {vets.map(v => <option key={v.id} value={v.id}>{v.firstName && v.lastName ? `${v.firstName} ${v.lastName}` : v.username}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                    <select name="type" value={formData.type} onChange={handleFormChange} className="w-full border border-gray-300 rounded-md px-4 py-2" disabled={isLocked}>
                                        {APPOINTMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                {isEditMode && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <select name="status" value={formData.status} onChange={handleFormChange} className="w-full border border-gray-300 rounded-md px-4 py-2" disabled={isLocked}>
                                            {APPOINTMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div className={isEditMode ? 'col-span-1' : 'col-span-2'}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes {isLocked && <span className="text-gray-400">(Read Only)</span>}</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleFormChange} readOnly={isLocked} rows={3} className={`w-full border border-gray-300 rounded-md px-4 py-2 resize-none ${isLocked ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`} />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                            <div className="flex gap-3">
                                {selectedAppointment?.id && (
                                    <>
                                        {!isExpired && (
                                            <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-bold transition-colors" disabled={isLocked}>Delete</button>
                                        )}
                                        {!isExpired && (isLocked ? (
                                            <button onClick={handleViewRecord} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-bold transition-colors">Medical Record</button>
                                        ) : (
                                            <button onClick={handleStartExam} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-bold transition-colors">Examine</button>
                                        ))}
                                        <button onClick={handleHistory} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md font-bold transition-colors">History</button>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setShowModal(false); resetForm(); }} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-bold transition-colors">Cancel</button>
                                {!isExpired && (
                                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-bold transition-colors" disabled={isLocked}>
                                        {selectedAppointment?.id ? 'Update' : 'Save'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <PatientHistoryModal
                    patient={historyPatient}
                    onClose={handleBackToAppointment}
                    onViewRecord={handleViewHistoryRecord}
                    onEditRecord={handleEditHistoryRecord}
                    token={token}
                />
            )}

            {/* Exam Modal */}
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

export default DashboardPage;
