import React, { useState } from 'react';
// --- BẮT ĐẦU THAY ĐỔI ---
import { login, register } from '../services/api'; // Thêm import 'register'
// --- KẾT THÚC THAY ĐỔI ---

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // --- BẮT ĐẦU THAY ĐỔI ---
  const [email, setEmail] = useState(''); // Thêm state cho email
  const [isRegistering, setIsRegistering] = useState(false); // State để chuyển form
  const [message, setMessage] = useState(''); // State cho thông báo (vd: đăng ký thành công)
  // --- KẾT THÚC THAY ĐỔI ---

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); 
    setMessage(''); // Xóa thông báo cũ
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

  // --- BẮT ĐẦU THAY ĐỔI ---
  // HÀM MỚI ĐỂ ĐĂNG KÝ
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      // Gọi API register với 3 trường
      await register(username, password, email);
      
      setMessage('Đăng ký thành công! Vui lòng đăng nhập.');
      setError('');
      setIsRegistering(false); // Chuyển về form login
      // Xóa trường input
      setUsername('');
      setPassword('');
      setEmail('');

    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      if (err.response && err.response.data && err.response.data.detail) {
          // Thử hiển thị lỗi chi tiết từ server (ví dụ: username đã tồn tại)
          setError(err.response.data.detail);
      } else if (err.response && err.response.status === 422) {
          setError('Lỗi xác thực. Vui lòng kiểm tra lại thông tin.');
      } else {
          setError('Đã xảy ra lỗi khi đăng ký. Tên đăng nhập có thể đã tồn tại.');
      }
    }
  };

  // HÀM MỚI ĐỂ CHUYỂN FORM
  const toggleForm = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setMessage('');
    setUsername('');
    setPassword('');
    setEmail('');
  };
  // --- KẾT THÚC THAY ĐỔI ---


  return (
    <div className="login-container">
      {/* --- BẮT ĐẦU THAY ĐỔI --- */}
      <form onSubmit={isRegistering ? handleRegister : handleLogin}>
        <h2>{isRegistering ? 'Đăng ký tài khoản' : 'Đăng nhập Chatbot'}</h2>
        
        {/* Hiển thị thông báo lỗi hoặc thành công */}
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        
        <div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tên đăng nhập"
            required
          />
        </div>
        
        {/* THÊM TRƯỜNG EMAIL KHI ĐĂNG KÝ */}
        {isRegistering && (
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (bắt buộc)"
              required
            />
          </div>
        )}

        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu"
            required
          />
        </div>
        <button type="submit">{isRegistering ? 'Đăng ký' : 'Đăng nhập'}</button>
      </form>
      
      {/* Nút để chuyển đổi 2 form */}
      <button onClick={toggleForm} className="toggle-form-btn">
        {isRegistering ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký'}
      </button>
      {/* --- KẾT THÚC THAY ĐỔI --- */}
    </div>
  );
};

export default Login;