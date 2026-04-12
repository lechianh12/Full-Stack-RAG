// File: src/services/api.js

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
  // Lưu token, role và username
  if (response.data.access_token) {
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('userRole', response.data.role); // Lưu role
    localStorage.setItem('username', response.data.username); // Lưu username
  }
  return response.data;
};

// --- THAY ĐỔI HÀM DƯỚI ĐÂY ---
export const register = async (username, password, email) => {
  // Gửi request đến endpoint /register với đầy đủ 3 trường
  // Backend authen_router.py nhận vào 'account: Authen'
  const response = await axios.post(`${API_URL}/auth/register`, { 
    username, 
    password, 
    email 
  });
  return response.data; // Trả về data
};
// --- KẾT THÚC THAY ĐỔI ---


// --- SESSION MANAGEMENT ---
// (Giữ nguyên phần còn lại của file...)

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

// --- THÊM HÀM MỚI ---
/**
 * Lấy tất cả tài liệu (metadata) của một session
 */
export const getDocumentsForSession = async (sessionId) => {
  const response = await axios.get(`${API_URL}/session/get_session_documents/${sessionId}`, getAuthHeaders());
  return response.data;
};
// --- KẾT THÚC HÀM MỚI ---


/**
 * Lấy tất cả tin nhắn của một session
 */
export const getAllMessages = async (sessionId) => {
  const response = await axios.get(`${API_URL}/chat/get_all_messages/${sessionId}`, getAuthHeaders());
  return response.data;
};

/**
 * Gửi một tin nhắn mới, có thể đính kèm collection_name
 */
export const sendMessage = async (sessionId, message, collection_name = null) => {
  const url = `${API_URL}/chat/send_message/${sessionId}`;
  // Gửi message và collection_name trong body
  const body = {
    message: message,
    collection_name: collection_name 
  };
  const response = await axios.post(url, body, getAuthHeaders());
  return response.data;
};

/**
 * Tải một hoặc nhiều file lên cho một session cụ thể
 * @param {string} sessionId
 * @param {File[]} files
 * @param {boolean} isGlobal - true = admin upload tài liệu toàn cục
 */
export const uploadFile = async (sessionId, files, isGlobal = false) => {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const url = `${API_URL}/ingest/ingest?session_id=${sessionId}&is_global=${isGlobal}`;
  const response = await axios.post(url, formData, {
    headers: {
      ...getAuthHeaders().headers,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data; // Trả về { message, processed_files_info, errors }
};



/**
 * Streaming version of sendMessage using SSE.
 * Returns an AbortController so the caller can cancel the stream.
 */
export const sendMessageStream = (sessionId, message, collectionNames, { onChunk, onMeta, onDone, onError }) => {
  const token = localStorage.getItem('token');
  const controller = new AbortController();

  // collectionNames is string[] (multi-doc) or null/[]
  const names = Array.isArray(collectionNames) ? collectionNames : (collectionNames ? [collectionNames] : []);

  const run = async () => {
    const response = await fetch(`${API_URL}/chat/send_message_stream/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message, collection_names: names.length > 0 ? names : null }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = new Error(`HTTP ${response.status}`);
      err.response = response;
      throw err;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'meta')  onMeta?.(data);
          if (data.type === 'chunk') onChunk?.(data.text);
          if (data.type === 'done')  onDone?.(data);
          if (data.type === 'error') onError?.(new Error(data.text));
        } catch (_) { /* ignore malformed JSON */ }
      }
    }
  };

  run().catch(err => {
    if (err.name !== 'AbortError') onError?.(err);
  });

  return controller;
};


export const getCurrentUserInfo = () => {
  return {
    token: localStorage.getItem('token'),
    role: localStorage.getItem('userRole'),
    username: localStorage.getItem('username'),
  };
};

/** Lấy role thực tế từ DB (không phải localStorage) */
export const getMe = async () => {
  const response = await axios.get(`${API_URL}/auth/me`, getAuthHeaders());
  return response.data; // { username, email, role }
};

/** Admin: xem danh sách tất cả user kèm role */
export const listUsers = async () => {
  const response = await axios.get(`${API_URL}/auth/list_users`, getAuthHeaders());
  return response.data;
};

/** Admin: đổi role của user */
export const setUserRole = async (targetUsername, newRole) => {
  const response = await axios.patch(
    `${API_URL}/auth/me/role?target_username=${encodeURIComponent(targetUsername)}&new_role=${newRole}`,
    {},
    getAuthHeaders()
  );
  return response.data;
};