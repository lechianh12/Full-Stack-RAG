// src/components/DocumentList.js

import React from 'react';

// Component con để render từng mục tài liệu (giữ nguyên)
const DocumentItem = ({ doc, isSelected, onSelect }) => (
  <li
    key={doc.collection_name}
    className={`document-item ${isSelected ? 'selected' : ''}`}
    onClick={() => onSelect(doc.collection_name)}
    title={doc.original_filename}
  >
    {doc.is_global && <span className="global-icon" title="Tài liệu chung">🌍</span>}
    <span className="document-name">{doc.original_filename}</span>
  </li>
);

const DocumentList = ({ documents, selectedCollection, onSelectDocument }) => {
  
  const globalDocs = documents.filter(doc => doc.is_global);
  const userDocs = documents.filter(doc => !doc.is_global);

  return (
    <div className="document-list-container">
      <h4>Tài liệu RAG</h4>
      
      {/* SỬA: Thêm một div bọc (wrapper) ở đây */}
      <div className="document-lists-wrapper">
        
        {/* PHẦN TÀI LIỆU CHUNG (ADMIN) */}
        {globalDocs.length > 0 && (
          <section className="document-list-section"> {/* Dùng <section> */}
            <h5 className="document-list-header">Tài liệu chung</h5>
            <ul className="document-list">
              {globalDocs.map(doc => (
                <DocumentItem
                  key={doc.collection_name}
                  doc={doc}
                  isSelected={selectedCollection === doc.collection_name}
                  onSelect={onSelectDocument}
                />
              ))}
            </ul>
          </section>
        )}

        {/* PHẦN TÀI LIỆU CỦA BẠN (USER) */}
        {userDocs.length > 0 && (
          <section className="document-list-section">
            <h5 className="document-list-header">Tài liệu của bạn</h5>
            <ul className="document-list">
              {userDocs.map(doc => (
                <DocumentItem
                  key={doc.collection_name}
                  doc={doc}
                  isSelected={selectedCollection === doc.collection_name}
                  onSelect={onSelectDocument}
                />
              ))}
            </ul>
          </section>
        )}
      </div> {/* <-- Kết thúc div bọc */}


      {/* Hiển thị khi không có tài liệu nào */}
      {documents.length === 0 && (
        <p className="no-documents-message">
          Chưa có tài liệu nào. <br/>
          Bạn có thể tải lên file ở ô chat bên dưới.
        </p>
      )}
    </div>
  );
};

export default DocumentList;