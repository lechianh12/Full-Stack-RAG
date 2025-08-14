import React, { useState, useEffect } from 'react'; // <-- Đã sửa lỗi ở đây
import Login from './components/Login';
import SessionManager from './components/SessionManager';
import ChatWindow from './components/ChatWindow';
import { getAllUserSessions, createSession, deleteSession } from './services/api';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  const fetchSessions = async () => {
    if (!isLoggedIn) return;
    setIsLoadingSessions(true);
    try {
      const data = await getAllUserSessions();
      setSessions(data);
      if (data.length > 0 && !activeSessionId) {
        setActiveSessionId(data[0].session_id);
      }
    } catch (error) {
      console.error('Không thể tải danh sách session:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    if(isLoggedIn) {
      fetchSessions();
    }
  }, [isLoggedIn]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setSessions([]);
    setActiveSessionId(null);
  };

  const handleCreateSession = async () => {
    try {
      const newSession = await createSession();
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.session_id);
    } catch (error) {
      console.error('Không thể tạo session mới:', error);
    }
  };

  // Bên trong file src/App.js

    const handleDeleteSession = async (sessionToDelete) => {
        // Hỏi người dùng xác nhận
        if (window.confirm('Bạn có chắc muốn xóa phiên chat này không?')) {
            try {
                // 1. Gọi API để xóa session trên server
                await deleteSession(sessionToDelete.session_id);

                // 2. Sau khi xóa thành công, gọi lại hàm fetchSessions()
                //    để tải lại danh sách phiên chat mới nhất từ server.
                //    Đây là thay đổi quan trọng nhất.
                fetchSessions();

            } catch (error) {
                console.error('Không thể xóa session trên server:', error);
                alert('Đã xảy ra lỗi khi xóa phiên chat.');
            }
        }
    };

  if (!isLoggedIn) {
    return (
      <div className="App">
        <header className="App-header"><h1>Chatbot RAG</h1></header>
        <main><Login onLoginSuccess={handleLoginSuccess} /></main>
      </div>
    );
  }

  return (
    <div className="App app-grid">
      <header className="App-header">
        <h1>Chatbot RAG</h1>
        <button onClick={handleLogout} className="logout-button">Đăng xuất</button>
      </header>
      
      <aside className="app-sidebar">
        <SessionManager 
          sessions={sessions}
          isLoading={isLoadingSessions}
          activeSessionId={activeSessionId}
          onSessionSelect={setActiveSessionId}
          onCreateSession={handleCreateSession}
          onDeleteSession={handleDeleteSession}
        />
      </aside>

      <main className="app-main-content">
        <ChatWindow sessionId={activeSessionId} />
      </main>
    </div>
  );
}

export default App;