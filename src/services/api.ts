import type { ChatRequest, FeedbackRequest } from '../types/agent';
import {
  consumeAgentEventStream,
  type AgentStreamHandlers,
} from './agentStream.ts';

const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export const chatAPI = {
  sendMessageStream: async (
    payload: ChatRequest,
    handlers: AgentStreamHandlers,
    signal?: AbortSignal,
  ) => {
    try {
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Agent API ${response.status}: ${detail || response.statusText}`);
      }

      if (!response.body) throw new Error('No readable stream');

      await consumeAgentEventStream(response.body, {
        ...handlers,
        onMalformedEvent: (error) => console.error('Unable to parse streaming event', error),
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Error communicating with Agent API:', error);
      }
      handlers.onError(error);
    }
  },

  sendFeedback: async (payload: FeedbackRequest, signal?: AbortSignal) => {
    const response = await fetch(`${API_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Feedback API ${response.status}: ${detail || response.statusText}`);
    }
  },
};
