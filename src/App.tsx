import React from 'react';
import './index.css';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/chat/ChatArea';
import { RightPanel } from './components/dynamic/RightPanel';
import { useChat } from './hooks/useChat';

function App() {
  const { messages, isLoading, sendMessage } = useChat();
  
  // Extract the latest UI actions from the most recent bot message
  const lastBotMessage = [...messages].reverse().find(m => m.role === 'bot');
  const activeActions = lastBotMessage?.actions || [];

  return (
    <div className="app-container">
      <main className="main-content">
        <Sidebar />
        <ChatArea messages={messages} isLoading={isLoading} sendMessage={sendMessage} />
        <RightPanel actions={activeActions} sendMessage={sendMessage} />
      </main>
    </div>
  );
}

export default App;

