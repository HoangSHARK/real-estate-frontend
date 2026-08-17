import type { ChatRequest } from '../types/agent';

// In a real app, this would be an env variable like import.meta.env.VITE_API_URL
const API_URL = 'http://127.0.0.1:8000';

export const chatAPI = {
  sendMessageStream: async (
    message: string, 
    thread_id: string, 
    intent: string | undefined,
    onText: (text: string) => void,
    onAction: (action: any) => void,
    onDone: () => void,
    onError: (error: any) => void
  ) => {
    try {
      const payload: ChatRequest = { message, thread_id, intent };
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.body) throw new Error('No readable stream');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split(/\r?\n\r?\n/);
        buffer = lines.pop() || ''; // Keep the incomplete part

        for (const block of lines) {
          if (!block.trim()) continue;
          const eventLine = block.split(/\r?\n/).find(l => l.startsWith('event:'));
          const dataLine = block.split(/\r?\n/).find(l => l.startsWith('data:'));
          
          if (eventLine && dataLine) {
            const event = eventLine.replace('event:', '').trim();
            const dataStr = dataLine.replace('data:', '').trim();
            try {
              const data = JSON.parse(dataStr);
              if (event === 'response.output_text.delta') {
                onText(data.delta);
              } else if (event === 'response.action') {
                onAction(data.action);
              }
            } catch (e) {
              console.error('Parse error', e);
            }
          }
        }
      }
      onDone();
    } catch (error) {
      console.error('Error communicating with Agent API:', error);
      onError(error);
    }
  },
};
