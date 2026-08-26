import './index.css';
import { RotateCcw, Sparkles } from 'lucide-react';
import { ChatArea } from './components/chat/ChatArea';
import { useChat } from './hooks/useChat';

function App() {
  const { messages, isLoading, sendMessage, stopActiveRequest, submitFeedback } = useChat();

  const handleResetChat = () => {
    window.location.reload();
  };

  return (
    <main className="app-shell">
      <section className="chat-device" aria-label="Trợ lý bất động sản AI">
        <header className="chat-header">
          <div className="header-brand">
            <div className="brand-mark">
              <Sparkles size={20} />
            </div>
            <div className="header-meta">
              <h1>
                Trợ lý Bất Động Sản AI
                <span className="header-badge">PRO</span>
              </h1>
              <p>
                <span className="status-dot" />
                Sẵn sàng tư vấn trực tuyến 24/7
              </p>
            </div>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="header-btn"
              onClick={handleResetChat}
              title="Làm mới cuộc trò chuyện"
            >
              <RotateCcw size={14} />
              <span>Cuộc trò chuyện mới</span>
            </button>
          </div>
        </header>

        <ChatArea
          messages={messages}
          isLoading={isLoading}
          sendMessage={sendMessage}
          onStop={stopActiveRequest}
          submitFeedback={submitFeedback}
        />
      </section>
    </main>
  );
}

export default App;


