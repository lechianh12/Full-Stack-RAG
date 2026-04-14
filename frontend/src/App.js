import React, { useState, useEffect, useCallback } from 'react';
import { getAllUserSessions, createSession, deleteSession, getCurrentUserInfo, getMe } from './services/api';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import WelcomePage from './components/WelcomePage';
import ChatWindow from './components/ChatWindow';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check auth state on mount — đồng bộ role thực từ DB
  useEffect(() => {
    const info = getCurrentUserInfo();
    if (info.token) {
      setIsLoggedIn(true);
      setUserInfo(info);
      // Gọi /me để lấy role thực từ DB và cập nhật localStorage nếu lệch
      getMe().then(me => {
        if (me.role !== info.role) {
          localStorage.setItem('userRole', me.role);
          localStorage.setItem('username', me.username);
        }
        setUserInfo({ ...info, role: me.role, username: me.username });
      }).catch(() => {}); // nếu token hết hạn sẽ bị handleLogout ở fetchSessions
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserInfo(null);
    setSessions([]);
    setActiveSessionId(null);
  }, []);

  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const data = await getAllUserSessions();
      const sorted = (data || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setSessions(sorted);
      setActiveSessionId(prev => {
        if (!prev && sorted.length > 0) return sorted[0].session_id;
        if (prev && !sorted.some(s => s.session_id === prev)) {
          return sorted.length > 0 ? sorted[0].session_id : null;
        }
        return prev;
      });
    } catch (err) {
      if (err?.response?.status === 401) handleLogout();
    } finally {
      setIsLoadingSessions(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    if (isLoggedIn) fetchSessions();
  }, [isLoggedIn, fetchSessions]);

  const handleLogin = (info) => {
    setIsLoggedIn(true);
    // info.role đến từ response login (từ DB), dùng trực tiếp
    setUserInfo(info);
  };

  const handleCreateSession = async () => {
    try {
      const newSession = await createSession();
      const data = await getAllUserSessions();
      const sorted = (data || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setSessions(sorted);
      setActiveSessionId(newSession.session_id);
    } catch (err) {
      if (err?.response?.status === 401) handleLogout();
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteSession(sessionId);
      setSessions(prev => {
        const remaining = prev.filter(s => s.session_id !== sessionId);
        if (activeSessionId === sessionId) {
          setActiveSessionId(remaining.length > 0 ? remaining[0].session_id : null);
        }
        return remaining;
      });
    } catch (err) {
      if (err?.response?.status === 401) handleLogout();
    }
  };

  const handleSessionNameUpdate = useCallback((sessionId, newName) => {
    setSessions(prev =>
      prev.map(s => s.session_id === sessionId ? { ...s, display_name: newName } : s)
    );
  }, []);

  if (!isLoggedIn) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isLoading={isLoadingSessions}
        userInfo={userInfo}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
        onSelectSession={setActiveSessionId}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        onLogout={handleLogout}
      />
      <main className="flex-1 min-w-0 overflow-hidden">
        {activeSessionId ? (
          <ChatWindow
            key={activeSessionId}
            sessionId={activeSessionId}
            userRole={userInfo?.role}
            username={userInfo?.username}
            onUnauthorized={handleLogout}
            onSessionNameUpdate={handleSessionNameUpdate}
          />
        ) : (
          <WelcomePage
            username={userInfo?.username}
            onCreateSession={handleCreateSession}
          />
        )}
      </main>
    </div>
  );
}

export default App;
