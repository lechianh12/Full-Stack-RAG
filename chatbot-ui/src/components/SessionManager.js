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
              key={session.id}
              className={session.session_id === activeSessionId ? 'active' : ''}
            >
              <span className="session-name" onClick={() => onSessionSelect(session.session_id)}>
                Chat {session.session_id.substring(0, 8)}...
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