import React from 'react';
import './ChatList.css';

export default function ChatList({ conversations, selectedWaId, onSelect }) {
  return (
    <div className="chat-list">
      <h2 className="chat-list-header">Chats</h2>
      {conversations.map(conv => (
        <div
          key={conv._id}
          onClick={() => onSelect(conv._id)}
          className={`chat-item ${conv._id === selectedWaId ? 'selected' : ''}`}
        >
          <div className="chat-item-user">{conv._id}</div>
          <div className="chat-item-last-message">{conv.lastMessage}</div>
        </div>
      ))}
    </div>
  );
}
