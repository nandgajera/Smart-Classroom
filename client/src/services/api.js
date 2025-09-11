import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Schools API
export const schoolsAPI = {
  getAll: () => api.get('/schools'),
  getById: (id) => api.get(`/schools/${id}`),
  getCourses: (id) => api.get(`/schools/${id}/courses`),
  create: (data) => api.post('/schools', data),
  update: (id, data) => api.put(`/schools/${id}`, data),
  delete: (id) => api.delete(`/schools/${id}`),
};

// Courses API
export const coursesAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  getSemesters: (id) => api.get(`/courses/${id}/semesters`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

// Students API
export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getByAcademicInfo: (schoolId, courseId, semester) => 
    api.get(`/students/academic/${schoolId}/${courseId}/${semester}`),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  updateAttendance: (id, data) => api.put(`/students/${id}/attendance`, data),
  addPayment: (id, data) => api.post(`/students/${id}/payments`, data),
  getStatistics: (params) => api.get('/students/statistics/overview', { params }),
  delete: (id) => api.delete(`/students/${id}`),
};

// Faculty API
export const facultyAPI = {
  getAll: (params) => api.get('/faculty', { params }),
  getById: (id) => api.get(`/faculty/${id}`),
  create: (data) => api.post('/faculty', data),
  update: (id, data) => api.put(`/faculty/${id}`, data),
  delete: (id) => api.delete(`/faculty/${id}`),
};

// Analytics API (mock for now)
export const analyticsAPI = {
  getOverview: (params) => api.get('/analytics/overview', { params }),
  getAttendanceStats: (params) => api.get('/analytics/attendance', { params }),
  getFeeStats: (params) => api.get('/analytics/fees', { params }),
};

export default api;
