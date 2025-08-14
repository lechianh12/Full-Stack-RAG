import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Hàm này lấy token và tạo headers cho các request cần xác thực
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (token) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }
  return {};
};

// --- AUTHENTICATION ---
export const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, { username, password });
  if (response.data.access_token) {
    localStorage.setItem('token', response.data.access_token);
  }
  return response.data;
};


// --- SESSION MANAGEMENT ---

/**
 * Lấy tất cả các session của người dùng hiện tại
 */
export const getAllUserSessions = async () => {
  const response = await axios.get(`${API_URL}/session/get_all_sessions`, getAuthHeaders());
  return response.data;
};

/**
 * Tạo một session mới
 */
export const createSession = async () => {
  const response = await axios.post(`${API_URL}/session/create_session`, {}, getAuthHeaders());
  return response.data;
};

/**
 * Xóa một session dựa trên _id của nó trong database
 */
export const deleteSession = async (sessionInternalId) => {
  const response = await axios.delete(`${API_URL}/session/delete_session/${sessionInternalId}`, getAuthHeaders());
  return response.data;
};


// --- CHAT & INGEST ---

/**
 * Lấy tất cả tin nhắn của một session
 */
export const getAllMessages = async (sessionId) => {
  const response = await axios.get(`${API_URL}/chat/get_all_messages/${sessionId}`, getAuthHeaders());
  return response.data;
};

/**
 * Gửi một tin nhắn mới
 */
export const sendMessage = async (sessionId, message) => {
  const url = `${API_URL}/chat/send_message/${sessionId}?message=${encodeURIComponent(message)}`;
  const response = await axios.post(url, null, getAuthHeaders());
  return response.data;
};

/**
 * Tải file lên cho một session cụ thể
 */
// Bên trong file src/services/api.js

/**
 * Tải một hoặc nhiều file lên cho một session cụ thể
 */
export const uploadFile = async (sessionId, files) => {
  const formData = new FormData();
  // Lặp qua danh sách file và append vào formData
  // Key 'files' phải khớp với tham số trên backend
  for (const file of files) {
    formData.append('files', file);
  }

  const url = `${API_URL}/ingest/ingest?session_id=${sessionId}`;
  const response = await axios.post(url, formData, {
    headers: {
      ...getAuthHeaders().headers,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};