import React, { useState } from 'react';
import { login } from '../services/api'; // Chúng ta sẽ cập nhật file này sau

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Xóa lỗi cũ
    try {
      const data = await login(username, password);
      if (data.access_token) {
        onLoginSuccess(); // Báo cho App.js biết đã đăng nhập thành công
      }
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      setError('Tên đăng nhập hoặc mật khẩu không đúng.');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin}>
        <h2>Đăng nhập Chatbot</h2>
        {error && <p className="error-message">{error}</p>}
        <div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tên đăng nhập"
            required
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu"
            required
          />
        </div>
        <button type="submit">Đăng nhập</button>
      </form>
    </div>
  );
};

export default Login;