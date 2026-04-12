import { useState, useRef, useCallback } from 'react';
import { uploadFile } from '../services/api';

function StopIcon() {
  return (
    <svg style={{ width: '14px', height: '14px' }} fill="currentColor" viewBox="0 0 24 24">
      <rect x="5" y="5" width="14" height="14" rx="3" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg style={{ width: '14px', height: '14px', animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none">
      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function MessageInput({
  sessionId, userRole, selectedCollection,
  isStreaming, onSend, onStop, onUploadComplete, onUnauthorized,
}) {
  const [text, setText]                 = useState('');
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMsg, setUploadMsg]       = useState('');
  const [uploadGlobal, setUploadGlobal] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef  = useRef(null);
  const isAdmin      = userRole === 'admin';

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
  }, []);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSend(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadStatus('uploading');
    setUploadMsg(`Đang tải lên ${files.length} file...`);
    try {
      const res = await uploadFile(sessionId, files, isAdmin && uploadGlobal);
      const ok  = res?.processed_files_info?.length || 0;
      const bad = res?.errors?.length || 0;
      if (ok > 0) {
        setUploadStatus(bad > 0 ? 'warn' : 'success');
        setUploadMsg(bad > 0 ? `Đã xử lý ${ok} file, lỗi ${bad} file.` : `Tải lên thành công ${ok} file.`);
        onUploadComplete?.(res);
      } else {
        setUploadStatus('error');
        setUploadMsg(res?.errors?.[0]?.error || 'Không thể xử lý file.');
      }
      setTimeout(() => setUploadStatus(null), 4000);
    } catch (err) {
      if (err?.response?.status === 401) { onUnauthorized(); return; }
      setUploadStatus('error');
      setUploadMsg(err?.response?.data?.detail || 'Tải lên thất bại.');
      setTimeout(() => setUploadStatus(null), 4000);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const canSend = text.trim() && !isStreaming;

  const statusStyle = {
    uploading: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' },
    success:   { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' },
    warn:      { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' },
    error:     { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' },
  };

  return (
    <div>
      {/* Upload status */}
      {uploadStatus && (
        <div style={{ ...statusStyle[uploadStatus], borderRadius: '10px', padding: '8px 12px', marginBottom: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {uploadStatus === 'uploading' && <Spinner />}
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadMsg}</span>
        </div>
      )}

      {/* Admin global toggle */}
      {isAdmin && (
        <label style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '7px 12px', marginBottom: '8px', borderRadius: '10px', cursor: 'pointer',
          background: uploadGlobal ? '#f0fdf4' : '#f9fafb',
          border: uploadGlobal ? '1px solid #86efac' : '1px solid #e5e7eb',
          transition: 'all 0.15s',
        }}>
          <input type="checkbox" checked={uploadGlobal} onChange={e => setUploadGlobal(e.target.checked)}
            style={{ accentColor: '#16a34a', width: '14px', height: '14px' }} />
          <span style={{ fontSize: '12px', fontWeight: 500, color: uploadGlobal ? '#15803d' : '#9ca3af' }}>
            🌍 Upload tài liệu toàn cục (cho tất cả user)
          </span>
        </label>
      )}

      {/* Main input box */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        background: '#fff',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s',
      }}>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          rows={1}
          placeholder={selectedCollection ? 'Hỏi về tài liệu đã chọn…' : 'Nhập câu hỏi… (Enter gửi, Shift+Enter xuống dòng)'}
          style={{
            width: '100%', border: 'none', outline: 'none', resize: 'none',
            padding: '16px 18px 6px',
            fontSize: '15px', lineHeight: 1.65, color: '#111827',
            background: 'transparent', fontFamily: 'inherit',
            maxHeight: '200px', overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        />

        {/* Bottom toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px 12px', gap: '6px' }}>
          {/* File attach */}
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
            onChange={handleFileSelect} accept=".pdf,.docx,.doc,.txt,.md,.csv,.json,.xlsx,.pptx" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            title="Đính kèm tài liệu"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '8px', border: 'none',
              background: 'transparent', cursor: isStreaming ? 'not-allowed' : 'pointer',
              color: '#9ca3af', opacity: isStreaming ? 0.4 : 1, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!isStreaming) e.currentTarget.style.background = '#f3f4f6'; }}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <div style={{ flex: 1 }} />

          {/* Send / Stop */}
          {isStreaming ? (
            <button onClick={onStop} title="Dừng"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '38px', height: '38px', borderRadius: '10px', border: 'none',
                background: '#111827', color: '#fff', cursor: 'pointer',
              }}>
              <StopIcon />
            </button>
          ) : (
            <button onClick={handleSend} disabled={!canSend} title="Gửi"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '38px', height: '38px', borderRadius: '10px', border: 'none',
                background: canSend ? '#111827' : '#e5e7eb',
                color: canSend ? '#fff' : '#9ca3af',
                cursor: canSend ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}>
              <SendIcon />
            </button>
          )}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '11px', color: '#d1d5db', margin: '8px 0 0' }}>
        RAG Assistant có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.
      </p>
    </div>
  );
}
