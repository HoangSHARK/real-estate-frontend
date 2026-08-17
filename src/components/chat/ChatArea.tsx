import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../../types/agent';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string, explicitIntent?: string) => Promise<void>;
}

export const ChatArea = ({ messages, isLoading, sendMessage }: ChatAreaProps) => {
  const [inputValue, setInputValue] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (inputValue.trim() || isLoading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Find clarify suggestions from the last message to render as Quick Replies
  const lastMsg = messages[messages.length - 1];
  const clarifyAction = lastMsg?.role === 'bot' ? lastMsg.actions?.find(a => a.type === 'clarify') : null;

  return (
    <div className="flex-1 flex flex-col relative" style={{ minWidth: '400px', background: 'transparent' }}>
      
      {/* Header */}
      <header 
        style={{ 
          height: '72px', 
          borderBottom: '1px solid var(--border-light)', 
          padding: '0 24px', 
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(10px)'
        }} 
        className="flex items-center justify-between shrink-0 relative z-10"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl shadow-lg relative" style={{ width: 44, height: 44, background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: 'white' }}>
            <div className="absolute inset-0 rounded-xl animate-pulse-glow"></div>
            <Sparkles size={22} className="relative z-10" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">Trợ Lý Bất Động Sản AI</h1>
            <div className="text-xs text-secondary flex items-center gap-1.5 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Đang hoạt động
            </div>
          </div>
        </div>
      </header>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 relative z-0">
        {messages.map(msg => {
          const cardsAction = msg.actions?.find(a => a.type === 'cards') as any;
          const clarifyAction = msg.actions?.find(a => a.type === 'clarify') as any;
          const ctaAction = msg.actions?.find(a => a.type === 'cta') as any;
          const isLatestBotMsg = msg.id === lastMsg?.id && msg.role === 'bot';

          return (
            <React.Fragment key={msg.id}>
              {msg.content && <MessageBubble role={msg.role} content={msg.content} />}
              
              {/* Render Cards directly in the chat if available */}
              {cardsAction && cardsAction.items && (
                <div className="flex gap-4 overflow-x-auto w-full mb-4 pl-12 pb-4 snap-x">
                  {cardsAction.items.map((item: any, idx: number) => (
                    <div 
                      key={idx} 
                      onClick={() => sendMessage(`Bạn có thể giới thiệu chi tiết cho tôi về căn có mã ${item.id} được không?`, 'US3_DETAIL')}
                      className="glass-card shrink-0 snap-center w-64 rounded-2xl overflow-hidden flex flex-col cursor-pointer"
                    >
                      <div className="relative h-36 w-full overflow-hidden">
                        <img 
                          src={item.image_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"} 
                          alt="" 
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" 
                          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <div className="font-bold text-sm truncate drop-shadow-md" title={item.title}>{item.title}</div>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-900/40 backdrop-blur-md">
                        <div className="text-xs text-slate-300 line-clamp-2" title={item.subtitle} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action CTA Buttons */}
              {ctaAction && ctaAction.items && (
                <div className="flex gap-3 flex-wrap pl-12 mb-4">
                  {ctaAction.items.filter((cta: any) => cta.label !== 'Xem tất cả').map((cta: any, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => sendMessage(cta.label, cta.intent)}
                      disabled={isLoading}
                      className="transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-white disabled:opacity-50 text-sm font-medium px-5 py-2.5 rounded-full border border-primary/50 text-white bg-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] backdrop-blur-sm"
                    >
                      {cta.label}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Quick Replies below the latest bot message */}
              {isLatestBotMsg && clarifyAction && clarifyAction.suggestions && (
                <div className="flex gap-3 flex-wrap pl-12 mb-4">
                  {clarifyAction.suggestions.map((sug: any, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => sendMessage(sug.value || sug.label, sug.intent)}
                      disabled={isLoading}
                      className="transition-all duration-300 hover:scale-105 hover:border-primary disabled:opacity-50 text-sm font-medium px-5 py-2.5 rounded-full border border-white/20 text-slate-200 bg-white/5 shadow-sm backdrop-blur-sm"
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              )}
            </React.Fragment>
          );
        })}
        
        {isLoading && (
          <div className="flex w-full mb-6 justify-start animate-fade-in pl-12">
            <div className="flex gap-3 items-end">
              <div style={{ padding: '16px 20px', background: 'var(--bg-bot-bubble)', backdropFilter: 'blur(10px)', borderRadius: '24px 24px 24px 4px', border: '1px solid var(--border-light)' }}>
                 <div className="flex gap-1.5 items-center h-5">
                   <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                   <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                   <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                 </div>
              </div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>
      
      {/* Input Area */}
      <div style={{ padding: '24px', borderTop: '1px solid var(--border-light)', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)' }} className="shrink-0 relative z-10">
        <div 
          style={{ 
            display: 'flex', 
            border: '1px solid var(--border-light)', 
            borderRadius: '24px', 
            padding: '12px 24px', 
            alignItems: 'center', 
            background: 'rgba(255, 255, 255, 0.05)', 
            transition: 'all 0.3s ease'
          }}
          className="focus-within:border-primary focus-within:shadow-[0_0_15px_rgba(59,130,246,0.2)] focus-within:bg-white/10"
        >
          <input 
            type="text" 
            placeholder="Bạn cần tìm gì hôm nay?" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            className="text-white placeholder:text-slate-400"
            style={{ border: 'none', outline: 'none', flex: 1, backgroundColor: 'transparent', fontSize: '15px' }} 
          />
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 ml-4"
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', border: 'none', color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '50%' }}
          >
            <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
          </button>
        </div>
      </div>
      
    </div>
  );
};
