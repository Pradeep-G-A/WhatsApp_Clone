import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatList from './Components/ChatList';
import ChatWindow from './Components/ChatWindow';

const API_BASE = 'http://localhost:5000';

function App() {
  const [conversations, setConversations] = useState([]);
  const [selectedWaId, setSelectedWaId] = useState(null);

  useEffect(() => {
    async function fetchConversations() {
      const res = await axios.get(`${API_BASE}/conversations`);
      setConversations(res.data);
      if (!selectedWaId && res.data.length) setSelectedWaId(res.data[0]._id);
    }
    fetchConversations();
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <ChatList conversations={conversations} selectedWaId={selectedWaId} onSelect={setSelectedWaId} />
      {selectedWaId && <ChatWindow wa_id={selectedWaId} apiBase={API_BASE} />}
    </div>
  );
}

export default App;
