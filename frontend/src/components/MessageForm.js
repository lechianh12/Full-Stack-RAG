import React, { useState, useRef } from 'react';
import { uploadFile } from '../services/api';

// Component con FileUploadButton
const FileUploadButton = ({ sessionId, onUploadStatusChange, onFilesUploaded }) => {
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;

        const fileNames = Array.from(files).map(f => f.name).join(', ');
        onUploadStatusChange({ status: 'uploading', message: `Đang tải ${files.length} file: ${fileNames}...` });

        try {
            // response bây giờ là { message, processed_files_info, errors }
            const response = await uploadFile(sessionId, Array.from(files));

            const successNames = response.processed_files_info
                ? response.processed_files_info.map(f => f.filename).join(', ')
                : '';
                
            const successMessage = successNames.length > 0
                ? `Tải lên thành công: ${successNames}`
                : (response.message || 'Tải lên hoàn tất!');
            
            onUploadStatusChange({ status: 'success', message: successMessage });
            
            // --- GỌI CALLBACK MỚI ---
            if (response.processed_files_info && onFilesUploaded) {
                onFilesUploaded(response.processed_files_info);
            }
            // --- KẾT THÚC ---

        } catch (error) {
            console.error('Lỗi upload file:', error);
            onUploadStatusChange({ status: 'error', message: 'Tải file thất bại.' });
        } finally {
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
                disabled={!sessionId} 
            />
        </>
    );
};


// Component form chính
const MessageForm = ({ onSendMessage, sessionId, onFilesUploaded }) => { // <-- THÊM PROP MỚI
  const [text, setText] = useState('');
  const [uploadStatus, setUploadStatus] = useState({ status: 'idle', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && sessionId) {
      onSendMessage(text);
      setText('');
    }
  };

  const handleInputChange = (e) => {
      setText(e.target.value);
      if (uploadStatus.status === 'success' || uploadStatus.status === 'error') {
          setUploadStatus({ status: 'idle', message: '' });
      }
  };

  return (
    <div className="message-form-container">
        {uploadStatus.status !== 'idle' && (
            <div className={`upload-status-bar ${uploadStatus.status}`}>
                {uploadStatus.message}
            </div>
        )}
        <form onSubmit={handleSubmit} className="message-form">
            <FileUploadButton 
                sessionId={sessionId} 
                onUploadStatusChange={setUploadStatus}
                onFilesUploaded={onFilesUploaded} // <-- TRUYỀN PROP XUỐNG
            />
            <input
                type="text"
                value={text}
                onChange={handleInputChange}
                placeholder="Nhập tin nhắn..."
                disabled={!sessionId} 
            />
            <button type="submit" disabled={!text.trim() || !sessionId}>Gửi</button>
        </form>
    </div>
  );
};

export default MessageForm;