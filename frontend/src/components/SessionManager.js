import React from 'react';

const SessionManager = ({ 
  sessions, 
  isLoading, 
  activeSessionId, 
  onSessionSelect, 
  onCreateSession, 
  onDeleteSession 
}) => {
  
  if (isLoading) {
    return <div className="session-manager">Đang tải các phiên chat...</div>;
  }

  // Hàm helper để lấy tên hiển thị
  const getDisplayName = (session) => {
    // Ưu tiên display_name nếu có
    if (session.display_name) {
      return session.display_name;
    }
    // Fallback nếu không có (trường hợp dữ liệu cũ)
    return `Chat ${session.session_id.substring(0, 8)}...`;
  };

  return (
    <div className="session-manager">
      <h3>Quản lý phiên</h3>
      <button onClick={onCreateSession} className="new-session-btn">
        + Tạo phiên mới
      </button>
      <ul className="session-list">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <li
              // Dùng session_id làm key vì nó là unique string
              key={session.session_id} 
              className={session.session_id === activeSessionId ? 'active' : ''}
            >
              <span className="session-name" onClick={() => onSessionSelect(session.session_id)}>
                {/* Sử dụng hàm getDisplayName */}
                {getDisplayName(session)} 
              </span>
              <button onClick={() => onDeleteSession(session)} className="delete-btn">
                Xóa
              </button>
            </li>
          ))
        ) : (
          <li className="no-sessions">Chưa có phiên chat nào.</li>
        )}
      </ul>
    </div>
  );
};

export default SessionManager;