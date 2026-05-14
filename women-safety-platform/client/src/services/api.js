import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.match(/^\/(login|register)?$/)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ===== AUTH API =====
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updateEmergencyContacts: (data) => api.put('/auth/emergency-contacts', data),
  updateLocation: (data) => api.put('/auth/location', data)
};

// ===== EMERGENCY API =====
export const emergencyAPI = {
  triggerSOS: (data) => api.post('/emergency/sos', data),
  getActive: () => api.get('/emergency/active'),
  getHistory: (page = 1) => api.get(`/emergency/history?page=${page}`),
  getById: (id) => api.get(`/emergency/${id}`),
  updateLocation: (id, data) => api.put(`/emergency/${id}/location`, data),
  cancel: (id, reason) => api.put(`/emergency/${id}/cancel`, { reason }),
  resolve: (id) => api.put(`/emergency/${id}/resolve`),
  sendChat: (id, message) => api.post(`/emergency/${id}/chat`, { message })
};

// ===== VOLUNTEER API =====
export const volunteerAPI = {
  register: (data) => api.post('/volunteer/register', data),
  getProfile: () => api.get('/volunteer/profile'),
  toggleAvailability: () => api.put('/volunteer/availability'),
  updateLocation: (data) => api.put('/volunteer/location', data),
  getAlerts: () => api.get('/volunteer/alerts'),
  getMyResponses: () => api.get('/volunteer/my-responses'),
  acceptEmergency: (id, data) => api.put(`/volunteer/${id}/accept`, data),
  declineEmergency: (id) => api.put(`/volunteer/${id}/decline`)
};

// ===== ADMIN API =====
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getVolunteers: (status) => api.get(`/admin/volunteers${status ? `?status=${status}` : ''}`),
  verifyVolunteer: (id, data) => api.put(`/admin/volunteer/${id}/verify`, data),
  getEmergencies: (params) => api.get('/admin/emergencies', { params }),
  toggleUserStatus: (id) => api.put(`/admin/user/${id}/toggle`)
};

export default api;
