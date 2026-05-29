import { useState, useEffect, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { isToday, isThisWeek } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { clientsAPI, usersAPI, patientsAPI } from '../api';
import PatientHistoryModal from '../components/PatientHistoryModal';
import { APPOINTMENT_TYPES, APPOINTMENT_STATUSES } from '../constants/appointments';

// Shared Components
import { Modal, LoadingSpinner } from '../components/shared';
// Dashboard Components
import { StatsCard } from '../components/dashboard';
// Appointment Components
import { ClientSearchDropdown } from '../components/appointments';
// Medical Components
import { MedicalRecordForm } from '../components/medical';

// Custom Hooks
import { useAppointments, useDashboard, useMedicalRecords } from '../hooks';

// Helper to preserve local time in ISO string
const toLocalISOString = (date) => {
  if (!date) return null;
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 19);
};

const DashboardPage = () => {
  const { user } = useAuth();

  // Custom Hooks
  const {
    stats: dashboardStats,
    nextAppointment: apiNextAppointment,
    refresh: refreshDashboard,
  } = useDashboard();

  const {
    appointments: rawAppointments,
    loading: appointmentsLoading,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  } = useAppointments();

  const {
    createRecord,
    updateRecord,
    fetchByAppointment,
  } = useMedicalRecords();

  // Data Options for Form
  const [clients, setClients] = useState([]);
  const [vets, setVets] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);

  // Modal & UI States
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState({ start: null, end: null });
  const [selectedClient, setSelectedClient] = useState(null);

  // Time & Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Exam Modal State
  const [showExamModal, setShowExamModal] = useState(false);
  const [examAppointment, setExamAppointment] = useState(null);
  const [examInitialData, setExamInitialData] = useState(null);
  const [isExamReadOnly, setIsExamReadOnly] = useState(false);
  const [isEditingHistory, setIsEditingHistory] = useState(false);

  // Record Form state
  const [recordFormData, setRecordFormData] = useState({
    weight: '',
    temperature: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
  });

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPatient, setHistoryPatient] = useState(null);

  // Today & Week List Modals
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [showWeekModal, setShowWeekModal] = useState(false);

  // Appointment Form Data
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    patientId: '',
    vetId: '',
    type: 'EXAM',
    status: 'SCHEDULED',
    notes: '',
    startTime: '',
    endTime: '',
  });

  const isExpired = formData.status === 'SCHEDULED' && formData.endTime && new Date(formData.endTime) < new Date();
  const isLocked = formData.status === 'COMPLETED' || isExpired;

  // Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Clients and Vets on Mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [clientsRes, vetsRes] = await Promise.all([
          clientsAPI.list(),
          usersAPI.listVets(),
        ]);
        setClients(clientsRes.data || []);
        setVets(vetsRes.data || []);
      } catch (err) {
        console.error('Error fetching dropdown options:', err);
      }
    };
    fetchOptions();
  }, []);

  // Fetch Patients when client changes
  const fetchPatientsForClient = useCallback(async (clientId) => {
    if (!clientId) {
      setPatients([]);
      return;
    }
    setPatientsLoading(true);
    try {
      const response = await patientsAPI.listByOwner(clientId);
      setPatients(response.data || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  // Auto-select current vet in form
  useEffect(() => {
    if (user && vets.length > 0 && !formData.vetId) {
      const currentVet = vets.find(v => v.username === user.username);
      if (currentVet) {
        setFormData(prev => ({ ...prev, vetId: currentVet.id }));
      }
    }
  }, [user, vets, formData.vetId]);

  // Sync Form Data when selected appointment changes
  useEffect(() => {
    if (showModal && selectedAppointment) {
      const props = selectedAppointment.extendedProps || selectedAppointment;

      let startTime = '';
      let endTime = '';

      if (selectedAppointment.start) {
        startTime = toLocalISOString(selectedAppointment.start).slice(0, 16);
        endTime = selectedAppointment.end ? toLocalISOString(selectedAppointment.end).slice(0, 16) : '';
      } else if (selectedAppointment.startTime) {
        startTime = toLocalISOString(new Date(selectedAppointment.startTime)).slice(0, 16);
        endTime = selectedAppointment.endTime ? toLocalISOString(new Date(selectedAppointment.endTime)).slice(0, 16) : '';
      }

      setFormData({
        clientId: props.client?.id || props.clientId || '',
        clientName: props.client ? `${props.client.firstName} ${props.client.lastName}` : '',
        patientId: props.patient?.id || props.patientId || '',
        vetId: props.vet?.id || props.vetId || (user && vets.find(v => v.username === user.username)?.id) || '',
        type: props.type || 'EXAM',
        status: props.status || 'SCHEDULED',
        notes: props.notes || '',
        startTime,
        endTime,
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

  // Robust Filtering: Compare Usernames (Only show logged-in vet's schedule)
  const myAppointments = useMemo(() => {
    if (!user || !rawAppointments.length) return [];
    return rawAppointments.filter(appt =>
      appt.vetUsername && user.username && appt.vetUsername === user.username
    );
  }, [user, rawAppointments]);

  // Today & Week List calculations
  const todaysAppointmentsList = useMemo(() => {
    return myAppointments
      .filter(appt => isToday(new Date(appt.startTime)))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [myAppointments]);

  const weeksAppointmentsList = useMemo(() => {
    return myAppointments
      .filter(appt => isThisWeek(new Date(appt.startTime), { weekStartsOn: 1 }))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [myAppointments]);

  const localStats = useMemo(() => {
    return {
      todayAppointments: todaysAppointmentsList.length,
      weekAppointments: weeksAppointmentsList.length,
    };
  }, [todaysAppointmentsList, weeksAppointmentsList]);

  // Next upcoming appointment
  const nextAppointment = useMemo(() => {
    const now = new Date();
    return myAppointments
      .filter(appt => new Date(appt.startTime) > now && appt.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];
  }, [myAppointments, currentTime]);

  // Format Calendar events
  const events = useMemo(() => {
    return myAppointments.map(appt => {
      const typeConfig = APPOINTMENT_TYPES.find(t => t.value === appt.type) || APPOINTMENT_TYPES[0];

      let backgroundColor = typeConfig.color;
      let borderColor = typeConfig.color;

      const start = new Date(appt.startTime);
      const end = appt.endTime ? new Date(appt.endTime) : new Date(start.getTime() + 30 * 60000);
      const isApptExpired = end < new Date() && appt.status === 'SCHEDULED';

      if (appt.status === 'COMPLETED') {
        backgroundColor = '#16a34a';
        borderColor = '#16a34a';
      } else if (isApptExpired) {
        backgroundColor = '#6b7280';
        borderColor = '#6b7280';
      }

      const clientName = `${appt.clientFirstName || ''} ${appt.clientLastName || ''}`.trim();
      const patientName = appt.patientName || 'Unknown Pet';

      return {
        id: appt.id,
        title: `${clientName} - ${patientName} (Vet: ${appt.vetFirstName || '?'})${isApptExpired ? ' (No Show)' : ''}`,
        start: toLocalISOString(start),
        end: toLocalISOString(end),
        allDay: false,
        backgroundColor,
        borderColor,
        extendedProps: {
          client: { id: appt.clientId, firstName: appt.clientFirstName, lastName: appt.clientLastName },
          patient: { id: appt.patientId, name: appt.patientName, species: appt.patientSpecies },
          vet: { id: appt.vetId, firstName: appt.vetFirstName, lastName: appt.vetLastName },
          type: appt.type,
          status: appt.status,
          notes: appt.notes,
        },
      };
    });
  }, [myAppointments]);

  // Reset Form
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
      endTime: '',
    });
    setSelectedClient(null);
    setPatients([]);
    setSelectedSlot({ start: null, end: null });
    setHistoryPatient(null);
  };

  // Click / Selection Handlers
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
      endTime: toLocalISOString(selectInfo.end).slice(0, 16),
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        patientId: '',
      }));
      fetchPatientsForClient(client.id);
    } else {
      setFormData(prev => ({ ...prev, clientId: '', clientName: '', patientId: '' }));
      setPatients([]);
    }
  };

  // drag-and-drop to reschedule
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

    const isFuture = newStart > new Date();
    let statusOverride = undefined;
    if (isFuture && event.extendedProps.status === 'SCHEDULED') {
      statusOverride = 'SCHEDULED';
    }

    const payload = {
      clientId: event.extendedProps.client?.id,
      patientId: event.extendedProps.patient?.id,
      vetId: event.extendedProps.vet?.id,
      type: event.extendedProps.type,
      status: statusOverride || event.extendedProps.status,
      notes: event.extendedProps.notes,
      startTime: toLocalISOString(newStart),
      endTime: toLocalISOString(newEnd),
    };

    try {
      await updateAppointment(event.id, payload);
      refreshDashboard();
    } catch (error) {
      info.revert();
      alert('Failed to reschedule appointment.');
    }
  };

  const handleSave = async () => {
    if (!formData.clientId || !formData.patientId || !formData.vetId || !formData.startTime) {
      alert('Please fill in all required fields.');
      return;
    }

    const payload = {
      clientId: parseInt(formData.clientId),
      patientId: parseInt(formData.patientId),
      vetId: parseInt(formData.vetId),
      type: formData.type,
      status: formData.status,
      notes: formData.notes,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
    };

    try {
      if (selectedAppointment?.id) {
        await updateAppointment(selectedAppointment.id, payload);
      } else {
        await createAppointment(payload);
      }
      setShowModal(false);
      resetForm();
      refreshDashboard();
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert('Failed to save appointment.');
    }
  };

  const handleDelete = async () => {
    if (!selectedAppointment?.id) return;
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;

    try {
      await deleteAppointment(selectedAppointment.id);
      setShowModal(false);
      resetForm();
      refreshDashboard();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment.');
    }
  };

  // Exam/Record Management
  const handleStartExam = async () => {
    if (!selectedAppointment?.id) return;
    try {
      const props = selectedAppointment.extendedProps || selectedAppointment;
      const payload = {
        clientId: props.client?.id || props.clientId,
        patientId: props.patient?.id || props.patientId,
        vetId: props.vet?.id || props.vetId,
        type: props.type,
        status: 'IN_PROGRESS',
        notes: props.notes,
        startTime: selectedAppointment.startTime || toLocalISOString(selectedAppointment.start),
        endTime: selectedAppointment.endTime || (selectedAppointment.end ? toLocalISOString(selectedAppointment.end) : null),
      };

      await updateAppointment(selectedAppointment.id, payload);

      setExamInitialData(null);
      setRecordFormData({
        weight: '',
        temperature: '',
        symptoms: '',
        diagnosis: '',
        treatment: '',
      });
      setIsExamReadOnly(false);
      setIsEditingHistory(false);
      setShowModal(false);
      setExamAppointment(selectedAppointment);
      setShowExamModal(true);
      refreshDashboard();
    } catch (error) {
      console.error("Error starting exam:", error);
      alert("Failed to start examination.");
    }
  };

  const handleViewRecord = async () => {
    if (!selectedAppointment?.id) return;
    try {
      const rec = await fetchByAppointment(selectedAppointment.id);
      if (rec) {
        setExamInitialData(rec);
        setRecordFormData({
          weight: rec.weight || '',
          temperature: rec.temperature || '',
          symptoms: rec.symptoms || '',
          diagnosis: rec.diagnosis || '',
          treatment: rec.treatment || '',
        });
        setIsExamReadOnly(true);
      } else {
        // No record exists yet
        setExamInitialData(null);
        setRecordFormData({
          weight: '',
          temperature: '',
          symptoms: '',
          diagnosis: '',
          treatment: '',
        });
        setIsExamReadOnly(false);
      }
      setExamAppointment(selectedAppointment);
      setIsEditingHistory(false);
      setShowModal(false);
      setShowExamModal(true);
    } catch (error) {
      console.error("Error viewing record:", error);
      alert("Failed to load medical record.");
    }
  };

  const handleCompleteExam = async (e) => {
    if (isEditingHistory) {
      handleUpdateHistoryRecord();
      return;
    }
    if (!examAppointment?.id) return;

    try {
      const payload = {
        appointmentId: parseInt(examAppointment.id),
        patientId: examAppointment.extendedProps?.patient?.id || examAppointment.patientId,
        weight: parseFloat(recordFormData.weight) || 0,
        temperature: parseFloat(recordFormData.temperature) || 0,
        symptoms: recordFormData.symptoms,
        diagnosis: recordFormData.diagnosis,
        treatment: recordFormData.treatment,
        notes: '',
      };
      await createRecord(payload);

      // Also mark appointment completed
      const props = examAppointment.extendedProps || examAppointment;
      const apptPayload = {
        clientId: props.client?.id || props.clientId,
        patientId: props.patient?.id || props.patientId,
        vetId: props.vet?.id || props.vetId,
        type: props.type,
        status: 'COMPLETED',
        notes: props.notes,
        startTime: examAppointment.startTime || toLocalISOString(examAppointment.start),
        endTime: examAppointment.endTime || (examAppointment.end ? toLocalISOString(examAppointment.end) : null),
      };
      await updateAppointment(examAppointment.id, apptPayload);

      setShowExamModal(false);
      setExamAppointment(null);
      refreshDashboard();
    } catch (error) {
      console.error("Error completing exam:", error);
      alert("Failed to save medical record.");
    }
  };

  // Patient History Modals
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
    setRecordFormData({
      weight: record.weight || '',
      temperature: record.temperature || '',
      symptoms: record.symptoms || '',
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
    });
    setExamAppointment({ id: record.appointmentId, extendedProps: { patient: historyPatient } });
    setIsExamReadOnly(true);
    setIsEditingHistory(false);
    setShowHistoryModal(false);
    setShowExamModal(true);
  };

  const handleEditHistoryRecord = (record) => {
    setExamInitialData(record);
    setRecordFormData({
      weight: record.weight || '',
      temperature: record.temperature || '',
      symptoms: record.symptoms || '',
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
    });
    setExamAppointment({ id: record.appointmentId, extendedProps: { patient: historyPatient } });
    setIsExamReadOnly(false);
    setIsEditingHistory(true);
    setShowHistoryModal(false);
    setShowExamModal(true);
  };

  const handleUpdateHistoryRecord = async () => {
    if (!examInitialData?.id) return;
    try {
      const payload = {
        weight: parseFloat(recordFormData.weight) || 0,
        temperature: parseFloat(recordFormData.temperature) || 0,
        symptoms: recordFormData.symptoms,
        diagnosis: recordFormData.diagnosis,
        treatment: recordFormData.treatment,
      };
      await updateRecord(examInitialData.id, payload);
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

  if (appointmentsLoading) {
    return <LoadingSpinner text="Loading dashboard appointments..." />;
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
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          icon="📅"
          label="Today's Appointments"
          value={localStats.todayAppointments}
          colorClass="bg-blue-50 text-blue-600 border-l-4 border-blue-500 cursor-pointer hover:bg-blue-100/50"
          onClick={() => setShowTodayModal(true)}
        />
        <StatsCard
          icon="📊"
          label="Week's Appointments"
          value={localStats.weekAppointments}
          colorClass="bg-green-50 text-green-600 border-l-4 border-green-500 cursor-pointer hover:bg-green-100/50"
          onClick={() => setShowWeekModal(true)}
        />

        {/* Current Time / Next Appointment Card */}
        <div
          onClick={() => {
            if (nextAppointment) {
              setSelectedAppointment(nextAppointment);
              setIsEditMode(true);
              setShowModal(true);
            }
          }}
          className={`bg-white rounded-lg border border-gray-200 p-5 border-l-4 border-purple-500 flex flex-col justify-between hover:shadow-md transition-shadow ${
            nextAppointment ? 'cursor-pointer hover:bg-purple-50/50' : ''
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <span className="text-2xl">🕒</span>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 text-xs">
            <p className="font-semibold text-gray-400 uppercase tracking-wider mb-1">Next Patient</p>
            {nextAppointment ? (
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-purple-700 truncate">{nextAppointment.patientName}</p>
                  <p className="text-gray-500 text-[10px]">Owner: {nextAppointment.clientFirstName} {nextAppointment.clientLastName}</p>
                </div>
                <span className="px-2 py-0.5 font-semibold text-blue-600 bg-blue-50 rounded">
                  {new Date(nextAppointment.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
            ) : (
              <p className="text-gray-400 italic">No upcoming appointments</p>
            )}
          </div>
        </div>
      </div>

      {/* Scheduler Calendar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">My Schedule</h2>
        <div>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
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

      {/* Today's Appointments List Modal */}
      <Modal isOpen={showTodayModal} onClose={() => setShowTodayModal(false)} title="Today's Appointments" size="lg">
        {todaysAppointmentsList.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No appointments scheduled for today.</p>
        ) : (
          <div className="space-y-3">
            {todaysAppointmentsList.map(appt => (
              <div key={appt.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-gray-900">
                      {new Date(appt.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium uppercase border"
                      style={{
                        borderColor: APPOINTMENT_TYPES.find(t => t.value === appt.type)?.color,
                        color: APPOINTMENT_TYPES.find(t => t.value === appt.type)?.color,
                        backgroundColor: `${APPOINTMENT_TYPES.find(t => t.value === appt.type)?.color}10`,
                      }}
                    >
                      {APPOINTMENT_TYPES.find(t => t.value === appt.type)?.label || appt.type}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{appt.patientName} <span className="text-xs text-gray-500 font-normal">({appt.patientSpecies})</span></p>
                  <p className="text-xs text-gray-500">Owner: {appt.clientFirstName} {appt.clientLastName}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  appt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  appt.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-800' :
                  appt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Week's Appointments List Modal */}
      <Modal isOpen={showWeekModal} onClose={() => setShowWeekModal(false)} title="This Week's Appointments" size="lg">
        {weeksAppointmentsList.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No appointments scheduled for this week.</p>
        ) : (
          <div className="space-y-3">
            {weeksAppointmentsList.map(appt => (
              <div key={appt.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {new Date(appt.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="font-bold text-gray-900">
                      {new Date(appt.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium uppercase border"
                      style={{
                        borderColor: APPOINTMENT_TYPES.find(t => t.value === appt.type)?.color,
                        color: APPOINTMENT_TYPES.find(t => t.value === appt.type)?.color,
                        backgroundColor: `${APPOINTMENT_TYPES.find(t => t.value === appt.type)?.color}10`,
                      }}
                    >
                      {APPOINTMENT_TYPES.find(t => t.value === appt.type)?.label || appt.type}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{appt.patientName} <span className="text-xs text-gray-500 font-normal">({appt.patientSpecies})</span></p>
                  <p className="text-xs text-gray-500">Owner: {appt.clientFirstName} {appt.clientLastName}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  appt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  appt.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-800' :
                  appt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Appointment Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={formData.status === 'COMPLETED' ? 'Medical Record View' : (isExpired ? 'Appointment Expired' : (isEditMode ? 'Edit Appointment' : 'New Appointment'))}
        size="lg"
      >
        <div className="space-y-4">
          {isExpired && (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-r-md text-sm">
              <p className="font-bold">⚠️ This appointment has passed.</p>
              <p className="mt-1">Drag and drop it to a future slot on the calendar to reschedule it.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleFormChange} className="w-full border border-gray-300 rounded-md p-2" disabled={isLocked} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleFormChange} className="w-full border border-gray-300 rounded-md p-2" disabled={isLocked} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <ClientSearchDropdown clients={clients} selectedClient={selectedClient} onSelect={handleClientSelect} disabled={isEditMode || isLocked} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient * {patientsLoading && <span className="text-xs text-blue-500">(Loading...)</span>}</label>
              {!selectedClient ? (
                <div className="w-full border border-dashed border-gray-300 rounded-md p-2 bg-gray-50 text-gray-400 text-sm">Select a client first</div>
              ) : patients.length === 0 ? (
                <div className="w-full border border-yellow-300 rounded-md p-2 bg-yellow-50 text-yellow-800 text-sm">⚠️ No pets registered.</div>
              ) : (
                <select name="patientId" value={formData.patientId} onChange={handleFormChange} className="w-full border border-gray-300 rounded-md p-2" disabled={isLocked}>
                  <option value="">Select a pet...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Veterinarian *</label>
              <select name="vetId" value={formData.vetId} onChange={handleFormChange} className="w-full border border-gray-300 rounded-md p-2" disabled={isLocked}>
                <option value="">Select a vet...</option>
                {vets.map(v => <option key={v.id} value={v.id}>{v.firstName && v.lastName ? `Dr. ${v.firstName} ${v.lastName}` : v.username}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select name="type" value={formData.type} onChange={handleFormChange} className="w-full border border-gray-300 rounded-md p-2" disabled={isLocked}>
                {APPOINTMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {isEditMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleFormChange} className="w-full border border-gray-300 rounded-md p-2" disabled={isLocked}>
                  {APPOINTMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            )}
            <div className={isEditMode ? 'col-span-1' : 'md:col-span-2'}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleFormChange} readOnly={isLocked} rows={2} className={`w-full border border-gray-300 rounded-md p-2 resize-none ${isLocked ? 'bg-gray-100' : ''}`} />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <div className="flex gap-2">
              {selectedAppointment?.id && (
                <>
                  {!isExpired && (
                    <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors" disabled={isLocked}>Delete</button>
                  )}
                  {!isExpired && (isLocked ? (
                    <button onClick={handleViewRecord} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Medical Record</button>
                  ) : (
                    <button onClick={handleStartExam} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Examine</button>
                  ))}
                  <button onClick={handleHistory} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">History</button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-md text-sm font-medium transition-colors">Cancel</button>
              {!isExpired && (
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors" disabled={isLocked}>
                  {selectedAppointment?.id ? 'Update' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Patient History Modal */}
      {showHistoryModal && (
        <PatientHistoryModal
          patient={historyPatient}
          onClose={handleBackToAppointment}
          onViewRecord={handleViewHistoryRecord}
          onEditRecord={handleEditHistoryRecord}
        />
      )}

      {/* Medical Examination Record Modal */}
      <Modal
        isOpen={showExamModal}
        onClose={handleCloseExamModal}
        title={isEditingHistory ? 'Edit Medical Record' : `Medical Exam for ${examAppointment?.extendedProps?.patient?.name || examAppointment?.patientName || 'Patient'}`}
        size="lg"
      >
        <MedicalRecordForm
          formData={recordFormData}
          onChange={(name, val) => setRecordFormData(prev => ({ ...prev, [name]: val }))}
          onSubmit={handleCompleteExam}
          onCancel={handleCloseExamModal}
          isEdit={isEditingHistory || isExamReadOnly}
        />
      </Modal>
    </div>
  );
};

export default DashboardPage;
