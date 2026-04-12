import { useState, useRef, useCallback } from 'react';
import { uploadFile } from '../services/api';

function PaperclipIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function MessageInput({
  sessionId, userRole, selectedCollection, selectedDocName, isStreaming,
  onSend, onStop, onUploadComplete, onUnauthorized, onOpenDocPanel,
}) {
  const [text, setText]                 = useState('');
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMsg, setUploadMsg]       = useState('');
  const [uploadGlobal, setUploadGlobal] = useState(false); // admin toggle
  const fileInputRef = useRef(null);
  const textareaRef  = useRef(null);
  const isAdmin = userRole === 'admin';

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, []);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSend(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadStatus('uploading');
    setUploadMsg(`Đang tải lên ${files.length} file...`);

    try {
      const response = await uploadFile(sessionId, files, isAdmin && uploadGlobal);
      const uploadedCount = response?.processed_files_info?.length || 0;
      const failedCount = response?.errors?.length || 0;

      if (uploadedCount > 0) {
        setUploadStatus(failedCount > 0 ? 'error' : 'success');
        setUploadMsg(
          failedCount > 0
            ? `Đã tải ${uploadedCount} file, lỗi ${failedCount} file.`
            : `Tải lên thành công ${uploadedCount} file.`
        );
        onUploadComplete?.(response);
      } else {
        setUploadStatus('error');
        setUploadMsg(response?.errors?.[0]?.error || 'Không thể xử lý tài liệu đã tải lên.');
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

  const statusColors = {
    uploading: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' },
    success:   { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' },
    error:     { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' },
  };

  const canSend = text.trim() && !isStreaming;

  return (
    <div className="flex-shrink-0 bg-white border-t border-slate-200 px-4 pt-3 pb-3">
      {/* Upload status */}
      {uploadStatus && (
        <div className="mb-2 px-3 py-2 rounded-lg text-xs flex items-center gap-2"
          style={statusColors[uploadStatus]}>
          {uploadStatus === 'uploading' && <Spinner />}
          <span className="truncate">{uploadMsg}</span>
        </div>
      )}

      {/* Selected document chip – hiện ngay trên input khi đã chọn tài liệu */}
      {selectedDocName && (
        <div
          className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
        >
          <svg style={{ width: '13px', height: '13px', color: '#f97316', flexShrink: 0 }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="flex-1 text-xs font-medium truncate" style={{ color: '#c2410c' }}>
            {selectedDocName}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#fdba74', color: '#7c2d12', fontWeight: 600 }}>RAG</span>
          <button
            onClick={onOpenDocPanel}
            className="text-xs underline"
            style={{ color: '#ea580c', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >đổi</button>
        </div>
      )}

      {/* Admin: toggle upload toàn cục */}
      {isAdmin && (
        <label
          className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer select-none"
          style={{ background: uploadGlobal ? '#f0fdf4' : '#f8fafc', border: uploadGlobal ? '1px solid #86efac' : '1px solid #e2e8f0', transition: 'all 0.15s' }}
        >
          <input
            type="checkbox"
            checked={uploadGlobal}
            onChange={e => setUploadGlobal(e.target.checked)}
            style={{ accentColor: '#16a34a', width: '14px', height: '14px' }}
          />
          <span className="text-xs font-semibold" style={{ color: uploadGlobal ? '#15803d' : '#94a3b8' }}>
            🌍 Upload tài liệu toàn cục (hiện cho tất cả user)
          </span>
        </label>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 rounded-xl px-3 py-2 transition-all"
        style={{
          background: '#f8fafc',
          border: selectedDocName ? '1px solid #fed7aa' : '1px solid #e2e8f0',
        }}>

        {/* Attach */}
        <input ref={fileInputRef} type="file" multiple className="hidden"
          onChange={handleFileSelect} accept=".pdf,.docx,.doc,.txt,.md,.csv,.json,.xlsx,.pptx" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming}
          title="Đính kèm tài liệu"
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
          style={{ color: '#94a3b8', opacity: isStreaming ? 0.4 : 1 }}
        >
          <PaperclipIcon />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          rows={1}
          placeholder={
            selectedCollection
              ? 'Hỏi về tài liệu đã chọn… (Enter gửi)'
              : 'Nhập câu hỏi… (Enter gửi, Shift+Enter xuống dòng)'
          }
          className="flex-1 bg-transparent text-sm resize-none min-h-6 overflow-y-auto"
          style={{ outline: 'none', border: 'none', color: '#1e293b', maxHeight: '160px', lineHeight: '1.5' }}
        />

        {/* Send / Stop button */}
        {isStreaming ? (
          <button onClick={onStop} title="Dừng"
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: '#ef4444', color: '#fff', cursor: 'pointer' }}>
            <StopIcon />
          </button>
        ) : (
          <button onClick={handleSend} disabled={!canSend}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: canSend ? 'linear-gradient(135deg,#f97316,#ea580c)' : '#e2e8f0',
              color: canSend ? '#fff' : '#94a3b8',
              cursor: canSend ? 'pointer' : 'not-allowed',
            }}>
            <SendIcon />
          </button>
        )}
      </div>

      <p className="text-center text-xs mt-1.5" style={{ color: '#cbd5e1' }}>
        RAG Assistant có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.
      </p>
    </div>
  );
}
