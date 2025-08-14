import React, { useState } from 'react';
import { uploadFile } from '../services/api';

const FileUpload = ({ sessionId }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [responseMessage, setResponseMessage] = useState('');

  const handleFileChange = (e) => {
    // e.target.files là một danh sách (FileList)
    if (e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files)); // Chuyển FileList thành Array
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setResponseMessage('Vui lòng chọn ít nhất một file.');
      return;
    }
    if (!sessionId) {
      setResponseMessage('Lỗi: Không có Session ID để tải file lên.');
      return;
    }

    setStatus('uploading');
    setResponseMessage(`Đang tải lên ${selectedFiles.length} file...`);

    try {
      // Gửi toàn bộ danh sách file trong một request duy nhất
      const response = await uploadFile(sessionId, selectedFiles);
      setStatus('success');
      setResponseMessage(response.message || 'Tải lên hoàn tất!');
      // Xóa các file đã chọn sau khi tải lên thành công
      setSelectedFiles([]);
    } catch (error) {
      setStatus('error');
      setResponseMessage('Tải file thất bại. Vui lòng thử lại.');
      console.error('Lỗi upload file:', error);
    }
  };

  return (
    <div className="file-upload-container">
      <h4>Tải tài liệu lên phiên chat này</h4>
      <div className="upload-controls">
        {/* Thêm thuộc tính 'multiple' để cho phép chọn nhiều file */}
        <input type="file" multiple onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={selectedFiles.length === 0 || status === 'uploading'}>
          {status === 'uploading' ? 'Đang tải...' : `Tải lên (${selectedFiles.length})`}
        </button>
      </div>

      {/* Hiển thị danh sách các file đã chọn */}
      {selectedFiles.length > 0 && (
        <div className="file-list">
          <p>Các file đã chọn:</p>
          <ul>
            {selectedFiles.map((file, index) => (
              <li key={index}>{file.name} - ({(file.size / 1024).toFixed(2)} KB)</li>
            ))}
          </ul>
        </div>
      )}

      {responseMessage && <p className={`upload-status ${status}`}>{responseMessage}</p>}
    </div>
  );
};

export default FileUpload;