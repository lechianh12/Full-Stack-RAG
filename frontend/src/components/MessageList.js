import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

const MessageList = ({ messages }) => {
  // Tạo một ref để tham chiếu đến phần tử cuối cùng của danh sách
  const messagesEndRef = useRef(null);

  // Hàm để tự động cuộn xuống dưới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Gọi hàm scrollToBottom mỗi khi danh sách tin nhắn thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map((msg, index) => (
        <div key={index} className={`message ${msg.sender}`}>
          <ReactMarkdown>{msg.text}</ReactMarkdown>
        </div>
      ))}
      {/* Đặt phần tử vô hình này ở cuối danh sách để làm mốc cuộn */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;