import { useCallback, useEffect, useRef, useState } from 'react';
import { chatAPI } from '../services/api';
<<<<<<< Updated upstream
import type { Message } from '../types/agent';
import {
  cancelAgentProgress,
  completeAgentProgress,
  createAgentProgress,
  failAgentProgress,
  reduceProgressEvent,
  updateProgressClock,
} from '../utils/agentProgress';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
=======
import type { FeedbackRequest, FeedbackValue, Message } from '../types/agent';
import {
  createMessageId,
  createThreadId,
  getOrCreateAnonymousUserId,
} from '../utils/identity';

type FeedbackTarget = Omit<FeedbackRequest, 'value' | 'comment'>;

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';
>>>>>>> Stashed changes

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: createMessageId(),
      role: 'bot',
      content: 'Xin chào! Tôi là Trợ Lý Bất Động Sản AI. Tôi có thể tìm kiếm thông tin, dự án, hoặc tư vấn về nhà đất. Bạn đang quan tâm đến điều gì?',
      actions: [
        { type: 'clarify', prompt: '', suggestions: [
          { label: '🏠 Tìm mua nhà', intent: 'US1_SEARCH' },
          { label: '🏢 Thuê căn hộ', intent: 'US1_SEARCH' },
          { label: '✨ Đặt lịch tham quan', intent: 'US2_1_VISIT' },
          { label: '⚖️ Tư vấn chuyên sâu', intent: 'US2_2_CONSULT' },
        ] },
      ],
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
<<<<<<< Updated upstream
  const threadId = useRef<string>(`session_${generateId()}`);
  const activeRequest = useRef<{
    id: string;
    controller: AbortController;
    progressTimer: ReturnType<typeof setInterval>;
  } | null>(null);

  const stopActiveRequest = useCallback((markCancelled: boolean) => {
    const request = activeRequest.current;
    if (!request) return;
    clearInterval(request.progressTimer);
    request.controller.abort();
    activeRequest.current = null;
    if (markCancelled) {
      setMessages(previous => previous.map(message => message.progress?.summaryStatus === 'running'
        ? { ...message, progress: cancelAgentProgress(message.progress) }
        : message));
    }
  }, []);

  useEffect(() => () => stopActiveRequest(false), [stopActiveRequest]);
=======
  const threadId = useRef<string>(createThreadId());
  const anonymousUserId = useRef<string>(getOrCreateAnonymousUserId());
  const feedbackTargets = useRef(new Map<string, FeedbackTarget>());
  const activeRequest = useRef<{ id: string; controller: AbortController } | null>(null);

  useEffect(() => () => {
    activeRequest.current?.controller.abort();
    activeRequest.current = null;
  }, []);
>>>>>>> Stashed changes

  const sendMessage = useCallback(async (content: string, explicitIntent?: string) => {
    if (!content.trim() && !explicitIntent) return;

<<<<<<< Updated upstream
    stopActiveRequest(true);

    const requestContent = content || explicitIntent || '';
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: requestContent,
    };
    setMessages(previous => [...previous, userMessage]);
    setIsLoading(true);

    const botMessageId = generateId();
    setMessages(previous => [...previous, {
      id: botMessageId,
      role: 'bot',
      content: '',
      actions: [],
      progress: createAgentProgress(),
    }]);
=======
    activeRequest.current?.controller.abort();

    const requestContent = content || explicitIntent || '';
    const requestMessageId = createMessageId();
    const botMessageId = createMessageId();
    const requestId = createMessageId();
    const controller = new AbortController();
    activeRequest.current = { id: requestId, controller };

    setMessages(previous => [
      ...previous,
      {
        id: requestMessageId,
        role: 'user',
        content: requestContent,
      },
      {
        id: botMessageId,
        role: 'bot',
        content: '',
        actions: [],
      },
    ]);
    setIsLoading(true);

    const isCurrentRequest = () => activeRequest.current?.id === requestId;
    const finishRequest = () => {
      if (!isCurrentRequest()) return false;
      activeRequest.current = null;
      return true;
    };

    await chatAPI.sendMessageStream(
      {
        message: requestContent,
        thread_id: threadId.current,
        request_message_id: requestMessageId,
        user_id: anonymousUserId.current,
        intent: explicitIntent,
      },
      {
        onText: textDelta => {
          if (!isCurrentRequest()) return;
          setMessages(previous => previous.map(message =>
            message.id === botMessageId
              ? { ...message, content: message.content + textDelta }
              : message));
        },
        onAction: action => {
          if (!isCurrentRequest()) return;
          setMessages(previous => previous.map(message =>
            message.id === botMessageId
              ? { ...message, actions: [...(message.actions || []), action] }
              : message));
        },
        onDone: metadata => {
          if (!finishRequest()) return;

          const { message_id, trace_id, feedback_token } = metadata;
          if (message_id && trace_id && feedback_token) {
            feedbackTargets.current.set(botMessageId, {
              message_id,
              trace_id,
              feedback_token,
            });
          }

          setMessages(previous => previous.map(message =>
            message.id === botMessageId
              ? {
                  ...message,
                  message_id,
                  trace_id,
                  feedback_token,
                }
              : message));
          setIsLoading(false);
        },
        onError: error => {
          if (!finishRequest()) return;
          if (!isAbortError(error)) {
            setMessages(previous => previous.map(message =>
              message.id === botMessageId
                ? {
                    ...message,
                    content: message.content || 'Xin lỗi, đã có lỗi kết nối tới máy chủ. Vui lòng thử lại sau.',
                  }
                : message));
          }
          setIsLoading(false);
        },
      },
      controller.signal,
    );
  }, []);

  const submitFeedback = useCallback(async (
    localMessageId: string,
    value: FeedbackValue,
    comment?: string,
  ) => {
    const target = feedbackTargets.current.get(localMessageId);
    if (!target) return;

    setMessages(previous => previous.map(message =>
      message.id === localMessageId
        ? {
            ...message,
            feedback: {
              value: message.feedback?.value,
              pendingValue: value,
              status: 'submitting',
            },
          }
        : message));
>>>>>>> Stashed changes

    const requestId = generateId();
    const controller = new AbortController();
    const progressTimer = setInterval(() => {
      if (activeRequest.current?.id !== requestId) return;
      setMessages(previous => previous.map(message => message.id === botMessageId && message.progress
        ? { ...message, progress: updateProgressClock(message.progress) }
        : message));
    }, 1_000);
    activeRequest.current = { id: requestId, controller, progressTimer };

    const isCurrentRequest = () => activeRequest.current?.id === requestId;
    const finishRequest = () => {
      if (!isCurrentRequest()) return false;
      clearInterval(progressTimer);
      activeRequest.current = null;
      return true;
    };

    try {
<<<<<<< Updated upstream
      await chatAPI.sendMessageStream(
        requestContent,
        threadId.current,
        explicitIntent,
        {
          onText: (textDelta) => {
            if (!isCurrentRequest()) return;
            setMessages(previous => previous.map(message => message.id === botMessageId
              ? {
                  ...message,
                  content: message.content + textDelta,
                  progress: message.progress ? completeAgentProgress(message.progress) : undefined,
                }
              : message));
          },
          onAction: (action) => {
            if (!isCurrentRequest()) return;
            setMessages(previous => previous.map(message => message.id === botMessageId
              ? { ...message, actions: [...(message.actions || []), action] }
              : message));
          },
          onProgress: (event) => {
            if (!isCurrentRequest()) return;
            setMessages(previous => previous.map(message => message.id === botMessageId && message.progress
              ? { ...message, progress: reduceProgressEvent(message.progress, event) }
              : message));
          },
          onDone: () => {
            if (!finishRequest()) return;
            setMessages(previous => previous.map(message => message.id === botMessageId && message.progress
              ? { ...message, progress: completeAgentProgress(message.progress) }
              : message));
            setIsLoading(false);
          },
          onError: (error) => {
            if (!finishRequest()) return;
            if (error instanceof DOMException && error.name === 'AbortError') {
              setIsLoading(false);
              return;
            }
            setMessages(previous => previous.map(message => message.id === botMessageId && message.progress
              ? {
                  ...message,
                  progress: failAgentProgress(message.progress),
                  retry: { content: requestContent, intent: explicitIntent },
                }
              : message));
            setIsLoading(false);
          },
        },
        controller.signal,
      );
    } catch {
      // Stream errors are handled by the callback above.
=======
      await chatAPI.sendFeedback({ ...target, value, comment });
      setMessages(previous => previous.map(message =>
        message.id === localMessageId
          ? { ...message, feedback: { value, status: 'submitted' } }
          : message));
    } catch {
      setMessages(previous => previous.map(message =>
        message.id === localMessageId
          ? {
              ...message,
              feedback: {
                value: message.feedback?.value,
                status: 'error',
                error: 'Không gửi được đánh giá. Vui lòng thử lại.',
              },
            }
          : message));
>>>>>>> Stashed changes
    }
  }, [stopActiveRequest]);

<<<<<<< Updated upstream
  return { messages, isLoading, sendMessage };
=======
  return {
    messages,
    isLoading,
    sendMessage,
    submitFeedback,
  };
>>>>>>> Stashed changes
};
