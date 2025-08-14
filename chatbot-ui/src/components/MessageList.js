import React from 'react';
import ReactMarkdown from 'react-markdown'; // 1. Import thư viện

const MessageList = ({ messages }) => {
  return (
    <div className="message-list">
      {messages.map((msg, index) => (
        <div key={index} className={`message ${msg.sender}`}>
          {/* 2. Sử dụng component ReactMarkdown để bọc nội dung tin nhắn */}
          {/* Nó sẽ tự động xử lý các ký tự xuống dòng và các định dạng markdown khác */}
          <ReactMarkdown>{msg.text}</ReactMarkdown>
        </div>
      ))}
    </div>
  );
};

export default MessageList;