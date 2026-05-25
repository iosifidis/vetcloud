import api from './client';

/**
 * Auth API calls.
 * Centralized — used by AuthContext.
 */
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  refresh: () => api.post('/api/auth/refresh'),
  logout: () => api.post('/api/auth/logout'),
};

/**
 * Client (Pet Owner) API calls.
 */
export const clientsAPI = {
  list: () => api.get('/api/clients'),
  getById: (id) => api.get(`/api/clients/${id}`),
  search: (term) => api.get('/api/clients', { params: { search: term } }),
  create: (data) => api.post('/api/clients', data),
  update: (id, data) => api.put(`/api/clients/${id}`, data),
  delete: (id) => api.delete(`/api/clients/${id}`),
};

/**
 * Patient (Animal) API calls.
 */
export const patientsAPI = {
  listByOwner: (clientId) => api.get(`/api/patients/owner/${clientId}`),
  listAll: () => api.get('/api/patients'),
  getById: (id) => api.get(`/api/patients/${id}`),
  create: (clientId, data) => api.post(`/api/clients/${clientId}/patients`, data),
  update: (id, data) => api.put(`/api/patients/${id}`, data),
  delete: (id) => api.delete(`/api/patients/${id}`),
  transfer: (patientId, newOwnerId) => api.put(`/api/patients/${patientId}/owner/${newOwnerId}`),
  markDeceased: (id) => api.put(`/api/patients/${id}/status`, { isDeceased: true }),
};

/**
 * Appointment API calls.
 */
export const appointmentsAPI = {
  list: () => api.get('/api/appointments'),
  getById: (id) => api.get(`/api/appointments/${id}`),
  search: (term) => api.get('/api/appointments/search', { params: { q: term } }),
  getNext: () => api.get('/api/appointments/next'),
  create: (data) => api.post('/api/appointments', data),
  update: (id, data) => api.put(`/api/appointments/${id}`, data),
  delete: (id) => api.delete(`/api/appointments/${id}`),
};

/**
 * Medical Record API calls.
 */
export const medicalRecordsAPI = {
  getByAppointment: (appointmentId) => api.get(`/api/medical-records/appointment/${appointmentId}`),
  listByPatient: (patientId) => api.get(`/api/medical-records/patient/${patientId}`),
  listByClient: (clientId) => api.get(`/api/medical-records/client/${clientId}`),
  create: (data) => api.post('/api/medical-records', data),
  update: (id, data) => api.put(`/api/medical-records/${id}`, data),
};

/**
 * User API calls.
 */
export const usersAPI = {
  list: () => api.get('/api/users'),
  listVets: () => api.get('/api/users/vets'),
  getById: (id) => api.get(`/api/users/${id}`),
  create: (data) => api.post('/api/users', data),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  delete: (id) => api.delete(`/api/users/${id}`),
};

/**
 * Dashboard API calls.
 */
export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
};
