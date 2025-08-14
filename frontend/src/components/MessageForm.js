import React, { useState, useRef } from 'react';
import { uploadFile } from '../services/api';

// Tách nút Upload ra một component con để quản lý state riêng, tránh ảnh hưởng đến form chính
const FileUploadButton = ({ sessionId, onUploadStatusChange }) => {
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;

        onUploadStatusChange({ status: 'uploading', message: `Đang tải ${files.length} file...` });
        try {
            const response = await uploadFile(sessionId, Array.from(files));
            onUploadStatusChange({ status: 'success', message: response.message || 'Tải lên thành công!' });
        } catch (error) {
            console.error('Lỗi upload file:', error);
            onUploadStatusChange({ status: 'error', message: 'Tải file thất bại.' });
        } finally {
            // Reset input để người dùng có thể chọn lại cùng một file
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <>
            <label htmlFor="file-upload" className="file-upload-button" title="Tải file lên">
                📎
            </label>
            <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
                disabled={!sessionId} // Vô hiệu hóa khi chưa có session
            />
        </>
    );
};


// Component form chính
const MessageForm = ({ onSendMessage, sessionId }) => {
  const [text, setText] = useState('');
  const [uploadStatus, setUploadStatus] = useState({ status: 'idle', message: '' });

  // Hàm xử lý khi gửi form (nhấn Enter hoặc nút Gửi)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && sessionId) {
      onSendMessage(text);
      setText('');
      // Reset thông báo upload khi gửi tin nhắn mới
      setUploadStatus({ status: 'idle', message: '' });
    }
  };

  return (
    <div className="message-form-container">
        {/* Thanh trạng thái cho việc upload file */}
        {uploadStatus.status !== 'idle' && (
            <div className={`upload-status-bar ${uploadStatus.status}`}>
                {uploadStatus.message}
            </div>
        )}
        <form onSubmit={handleSubmit} className="message-form">
            <FileUploadButton sessionId={sessionId} onUploadStatusChange={setUploadStatus} />
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nhập tin nhắn..."
                disabled={!sessionId} // Vô hiệu hóa khi chưa có session
            />
            <button type="submit" disabled={!text.trim() || !sessionId}>Gửi</button>
        </form>
    </div>
  );
};

export default MessageForm;