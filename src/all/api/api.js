import axios from 'axios';
import { isAdminLoggedIn } from '../hooks/useAdminAuth';

const baseURL = import.meta.env.VITE_API_BASE_URL;
if (!baseURL) {
  console.error('VITE_API_BASE_URL is not set in .env file. API calls will fail.');
}
export const API_BASE_URL = baseURL;

// ── Client-side rate limiter — max 30 requests per 10 seconds ─────────────────
const RATE_LIMIT  = 60;
const RATE_WINDOW = 10_000;
const reqTimes    = [];

function checkRateLimit() {
  const now = Date.now();
  while (reqTimes.length && reqTimes[0] < now - RATE_WINDOW) reqTimes.shift();
  if (reqTimes.length >= RATE_LIMIT) throw new Error('Too many requests. Please slow down.');
  reqTimes.push(now);
}

// ── Axios instance ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 25_000,
  withCredentials: false,
});

// ── Request interceptor ────────────────────────────────────────────────────────
api.interceptors.request.use(config => {
  checkRateLimit();
  // Always attach admin key if available — the backend validates it
  const adminKey = import.meta.env.VITE_ADMIN_KEY;
  if (adminKey && isAdminLoggedIn()) {
    config.headers['X-Admin-Key'] = adminKey;
  }
  return config;
}, error => Promise.reject(error));

// ── Response interceptor ───────────────────────────────────────────────────────
api.interceptors.response.use(
  response => response,
  error => {
    // Enhance error with readable message
    let message = 'An error occurred';
    let errorCode = null;
    
    if (!error.response) {
      message = 'Cannot reach server. Check your connection and the VITE_API_BASE_URL environment variable.';
      errorCode = 'NETWORK_ERROR';
    } else if (error.response.status === 404) {
      message = `Endpoint not found: ${error.config?.url}. Check backend is running.`;
      errorCode = 'NOT_FOUND';
    } else if (error.response.status === 500) {
      const errorId = error.response.data?.error_id;
      message = errorId 
        ? `Server error [ID: ${errorId}]. Contact support with this ID.`
        : 'Server error. Please try again later.';
      errorCode = 'SERVER_ERROR';
    } else if (error.response.status === 403) {
      message = 'Access denied. Check your admin key.';
      errorCode = 'FORBIDDEN';
    } else if (error.response.status === 422) {
      message = error.response.data?.message || 'Invalid input. Please check your data.';
      errorCode = 'VALIDATION_ERROR';
    } else if (error.response.status === 408) {
      message = 'Request timeout. Server took too long to respond.';
      errorCode = 'TIMEOUT';
    }
    
    // Attach enhanced error info
    error.userMessage = message;
    error.errorCode = errorCode;
    return Promise.reject(error);
  }
);

// ── Template service ───────────────────────────────────────────────────────────
export const templateService = {
  getAll:       ()         => api.get('/templates'),
  getById:      (id)       => api.get(`/templates/${id}`),
  create:       (data)     => api.post('/templates', data),
  update:       (id, data) => api.put(`/templates/${id}`, data),
  delete:       (id)       => api.delete(`/templates/${id}`),
  approve:      (id)       => api.put(`/templates/${id}/approve`),
  reject:       (id)       => api.put(`/templates/${id}/reject`),
  getByUuid:    (uuid)     => api.get(`/templates/by-uuid/${uuid}`),
  updateByUuid: (uuid, d)  => api.put(`/templates/by-uuid/${uuid}`, d),
  search:       (params)   => api.get('/templates/search', { params }),
  filter:       (params)   => api.get('/templates/filter', { params }),
  getApproved:  ()         => api.get('/templates/filter', { params: { status: 'APPROVED' } }),
};

// ── Contact service ────────────────────────────────────────────────────────────
export const contactService = {
  submit:     (data) => api.post('/contact', data),
  getAll:     ()     => api.get('/contact'),
  markRead:   (id)   => api.put(`/contact/${id}/read`),
  markUnread: (id)   => api.put(`/contact/${id}/unread`),
  delete:     (id)   => api.delete(`/contact/${id}`),
};

// ── Chat service ───────────────────────────────────────────────────────────────
export const chatService = {
  // Public — user
  sendMessage:    (data)  => api.post('/chat/send', data),
  getThread:      (email) => api.get('/chat/history', { params: { email } }),
  // Admin only — always include admin key explicitly for reliability
  getAllThreads:   ()      => api.get('/chat/admin/threads', { headers: { 'X-Admin-Key': import.meta.env.VITE_ADMIN_KEY } }),
  getThreadAdmin: (email) => api.get('/chat/admin/thread', { params: { email }, headers: { 'X-Admin-Key': import.meta.env.VITE_ADMIN_KEY } }),
  reply:          (data)  => api.post('/chat/admin/reply', data, { headers: { 'X-Admin-Key': import.meta.env.VITE_ADMIN_KEY } }),
  deleteThread:   (email) => api.delete('/chat/admin/thread', { params: { email }, headers: { 'X-Admin-Key': import.meta.env.VITE_ADMIN_KEY } }),
};

export default api;
