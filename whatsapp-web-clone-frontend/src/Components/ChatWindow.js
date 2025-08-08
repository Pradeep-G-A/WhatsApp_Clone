import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import './ChatWindow.css';


export default function ChatWindow({ wa_id, apiBase }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await axios.get(`${apiBase}/messages/${wa_id}`);
        setMessages(res.data);
        scrollToBottom();
      } catch (e) {
        console.error('Error fetching messages', e);
      }
    }
    if (wa_id) {
      fetchMessages();
    }
  }, [wa_id]);

  const scrollToBottom = () => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  async function sendMessage(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    try {
      const res = await axios.post(`${apiBase}/messages/${wa_id}`, { text: trimmed });
      setMessages(prev => [...prev, res.data]);
      setInput('');
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message', err);
    }
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        Chat: {wa_id}
      </div>
      <div className="messages-container">
        {messages.map(msg => {
          const isFromMe = msg.from === '918329446654'; // update this to your business number
          return (
            <div
              key={msg.id}
              className={`message-bubble ${isFromMe ? 'sent' : 'received'}`}
            >
              <div>{msg.text}</div>
              <div className="message-info">
                {dayjs.unix(msg.timestamp).format('HH:mm')} • {msg.status}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="message-input-container">
        <input
          type="text"
          placeholder="Type a message"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="message-input"
        />
        <button type="submit" className="send-button" disabled={!input.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
}
