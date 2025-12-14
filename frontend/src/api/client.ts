import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
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

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  getMe: () =>
    api.get('/auth/me'),
};

// Users API
export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: any) => api.put('/users/me', data),
  updateParticipantProfile: (data: any) => api.put('/users/me/participant-profile', data),
  list: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
};

// Organizations API
export const organizationsApi = {
  list: () => api.get('/organizations'),
  getById: (id: string) => api.get(`/organizations/${id}`),
  create: (data: any) => api.post('/organizations', data),
  update: (id: string, data: any) => api.put(`/organizations/${id}`, data),
};

// Projects API
export const projectsApi = {
  list: (params?: any) => api.get('/projects', { params }),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  invite: (id: string, userIds: string[]) => api.post(`/projects/${id}/invite`, { userIds }),
  getParticipants: (id: string) => api.get(`/projects/${id}/participants`),
  getGapAnalysis: (id: string) => api.get(`/projects/${id}/gap-analysis`),
};

// Competencies API
export const competenciesApi = {
  getDomains: () => api.get('/competencies/domains'),
  getDomain: (id: string) => api.get(`/competencies/domains/${id}`),
  getLevels: () => api.get('/competencies/levels'),
  getAreas: (domainId?: string) => api.get('/competencies/areas', { params: { domainId } }),
  getInstruments: (params?: any) => api.get('/competencies/instruments', { params }),
  getInstrument: (id: string) => api.get(`/competencies/instruments/${id}`),
  getRoleTargets: (roleType?: string) => api.get('/competencies/role-targets', { params: { roleType } }),
};

// Assessments API
export const assessmentsApi = {
  list: (params?: any) => api.get('/assessments', { params }),
  getById: (id: string) => api.get(`/assessments/${id}`),
  start: (projectId: string, assessmentType: string) =>
    api.post('/assessments/start', { projectId, assessmentType }),
  submitResponses: (id: string, responses: any[]) =>
    api.post(`/assessments/${id}/responses`, { responses }),
  complete: (id: string) =>
    api.post(`/assessments/${id}/complete`),
  getResults: (id: string) =>
    api.get(`/assessments/${id}/results`),
};

// Curriculum API
export const curriculumApi = {
  getLearningUnits: (params?: any) => api.get('/curriculum/learning-units', { params }),
  getLearningUnit: (id: string) => api.get(`/curriculum/learning-units/${id}`),
  getRecommendations: (projectId: string, params?: any) =>
    api.get(`/curriculum/recommendations/${projectId}`, { params }),
  generateRecommendations: (projectId: string, forParticipantId?: string) =>
    api.post(`/curriculum/generate-recommendations/${projectId}`, { forParticipantId }),
  updateRecommendation: (id: string, status: string) =>
    api.put(`/curriculum/recommendations/${id}`, { status }),
  create: (data: any) => api.post('/curriculum', data),
  getById: (id: string) => api.get(`/curriculum/${id}`),
  update: (id: string, data: any) => api.put(`/curriculum/${id}`, data),
  getByProject: (projectId: string) => api.get(`/curriculum/project/${projectId}`),
};

// Reports API
export const reportsApi = {
  getIndividual: (participantId: string, projectId: string) =>
    api.get(`/reports/individual/${participantId}/${projectId}`),
  getInstitutional: (projectId: string) =>
    api.get(`/reports/institutional/${projectId}`),
  save: (data: any) => api.post('/reports/save', data),
  download: (reportId: string) => api.get(`/reports/download/${reportId}`),
  getBenchmarks: (domainId: string) => api.get(`/reports/benchmarks/${domainId}`),
};

export default api;
