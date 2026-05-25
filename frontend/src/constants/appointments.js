// Appointment type definitions with display properties
export const APPOINTMENT_TYPES = [
  { value: 'EXAM', label: 'Exam', color: '#3b82f6' },
  { value: 'SURGERY', label: 'Surgery', color: '#ef4444' },
  { value: 'VACCINATION', label: 'Vaccination', color: '#e11d48' },
  { value: 'GROOMING', label: 'Grooming', color: '#f97316' },
  { value: 'CHECKUP', label: 'Check-up', color: '#a855f7' },
  { value: 'EMERGENCY', label: 'Emergency', color: '#dc2626' },
];

// Appointment status definitions with display properties
export const APPOINTMENT_STATUSES = [
  { value: 'SCHEDULED', label: 'Scheduled', buttonClass: 'bg-blue-600 hover:bg-blue-700' },
  { value: 'CONFIRMED', label: 'Confirmed', buttonClass: 'bg-indigo-600 hover:bg-indigo-700' },
  { value: 'IN_PROGRESS', label: 'In Progress', buttonClass: 'bg-orange-600 hover:bg-orange-700' },
  { value: 'COMPLETED', label: 'Completed', buttonClass: 'bg-green-600 hover:bg-green-700' },
  { value: 'CANCELLED', label: 'Cancelled', buttonClass: 'bg-red-600 hover:bg-red-700' },
  { value: 'NO_SHOW', label: 'No Show', buttonClass: 'bg-gray-600 hover:bg-gray-700' },
];

// Helper to get type config by value
export const getTypeConfig = (type) =>
  APPOINTMENT_TYPES.find(t => t.value === type) || APPOINTMENT_TYPES[0];

// Helper to get status config by value
export const getStatusConfig = (status) =>
  APPOINTMENT_STATUSES.find(s => s.value === status) || {
    label: status,
    buttonClass: 'bg-blue-600 hover:bg-blue-700',
  };

// Species options
export const SPECIES_OPTIONS = [
  { value: 'DOG', label: 'Dog' },
  { value: 'CAT', label: 'Cat' },
  { value: 'RABBIT', label: 'Rabbit' },
  { value: 'BIRD', label: 'Bird' },
  { value: 'OTHER', label: 'Other' },
];

// Sex options
export const SEX_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
];
