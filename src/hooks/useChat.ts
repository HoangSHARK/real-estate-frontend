import { useState, useCallback, useRef } from 'react';
import { chatAPI } from '../services/api';
import type { Message } from '../types/agent';

// Simple ID generator since we didn't install uuid
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      role: 'bot',
      content: 'Xin chào! Tôi là Trợ Lý Bất Động Sản AI. Tôi có thể tìm kiếm thông tin, dự án, hoặc tư vấn về nhà đất. Bạn đang quan tâm đến điều gì?',
      actions: [
        { type: 'clarify', prompt: '', suggestions: [
          { label: '🏠 Tìm mua nhà', intent: 'US1_SEARCH' },
          { label: '🏢 Thuê căn hộ', intent: 'US1_SEARCH' },
          { label: '✨ Đặt lịch tham quan', intent: 'US2_1_VISIT' },
          { label: '⚖️ Tư vấn chuyên sâu', intent: 'US2_2_CONSULT' },
        ]}
      ]
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use a ref to persist thread_id across renders without triggering effects
  const threadId = useRef<string>(`session_${generateId()}`);

  const sendMessage = useCallback(async (content: string, explicitIntent?: string) => {
    if (!content.trim() && !explicitIntent) return;

    // Add user message to UI immediately
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: content || explicitIntent || '',
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const botMsgId = generateId();
    setMessages(prev => [...prev, {
      id: botMsgId,
      role: 'bot',
      content: '',
      actions: [],
    }]);

    try {
      await chatAPI.sendMessageStream(
        content || explicitIntent || '',
        threadId.current,
        explicitIntent,
        (textDelta) => {
          setMessages(prev => prev.map(msg => 
            msg.id === botMsgId ? { ...msg, content: msg.content + textDelta } : msg
          ));
        },
        (action) => {
          setMessages(prev => prev.map(msg => 
            msg.id === botMsgId ? { ...msg, actions: [...(msg.actions || []), action] } : msg
          ));
        },
        () => {
          setIsLoading(false);
        },
        () => {
          const errorMsg: Message = {
            id: generateId(),
            role: 'bot',
            content: 'Xin lỗi, đã có lỗi kết nối tới máy chủ. Vui lòng thử lại sau.',
          };
          setMessages(prev => [...prev, errorMsg]);
          setIsLoading(false);
        }
      );
    } catch (error) {
      // Errors are mostly caught in the stream handler's onError callback
    }
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
  };
};
