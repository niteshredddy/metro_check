import client from './client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  client.post('/api/auth/login', { email, password });

export const register = (data) =>
  client.post('/api/auth/register', data);

// ─── Scans ───────────────────────────────────────────────────────────────────
export const uploadScan = (formData) =>
  client.post('/api/scans', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // 60s for OCR processing
  });

export const getScans = (params = {}) =>
  client.get('/api/scans', { params });

export const getScan = (id) =>
  client.get(`/api/scans/${id}`);

export const downloadReport = (id) =>
  client.get(`/api/scans/${id}/report.pdf`, {
    responseType: 'blob',
  });

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const getStats = () =>
  client.get('/api/dashboard/stats');

// ─── Rules ───────────────────────────────────────────────────────────────────
export const getRules = () =>
  client.get('/api/rules');

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const getImageUrl = (imagePath) =>
  `${API_BASE}/uploads/${imagePath}`;
