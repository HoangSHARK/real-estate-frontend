import type {
  ChatResponse,
  StreamDoneMetadata,
  UIAction,
} from '../types/agent.ts';
import { createSSEParser, type ServerSentEvent } from './sse.ts';

export interface AgentStreamHandlers {
  onText: (text: string) => void;
  onAction: (action: UIAction) => void;
  onDone: (metadata: StreamDoneMetadata) => void;
  onError: (error: unknown) => void;
  onMalformedEvent?: (error: unknown) => void;
}

export interface AgentEventDispatcher {
  dispatch: (event: ServerSentEvent) => void;
  finish: () => void;
  isDone: () => boolean;
}

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const metadataFrom = (
  payload: Record<string, unknown>,
  fallbackMessageId?: string,
): StreamDoneMetadata => {
  const responseRecord = asRecord(payload.response);
  const response = responseRecord as ChatResponse | undefined;

  return {
    message_id: asString(payload.message_id)
      ?? asString(responseRecord?.message_id)
      ?? fallbackMessageId,
    trace_id: asString(payload.trace_id) ?? asString(responseRecord?.trace_id),
    feedback_token: asString(payload.feedback_token)
      ?? asString(responseRecord?.feedback_token),
    response,
  };
};

export const createAgentEventDispatcher = (
  handlers: AgentStreamHandlers,
): AgentEventDispatcher => {
  let completed = false;
  let createdMessageId: string | undefined;

  const complete = (metadata: StreamDoneMetadata = {}) => {
    if (completed) return;
    completed = true;
    handlers.onDone(metadata);
  };

  return {
    dispatch(event) {
      if (completed) return;

      try {
        const payload = asRecord(JSON.parse(event.data));
        if (!payload) return;
        const eventType = event.event === 'message'
          ? asString(payload.type) ?? event.event
          : event.event;

        if (eventType === 'response.created') {
          createdMessageId = asString(payload.message_id)
            ?? asString(payload.response_id)
            ?? createdMessageId;
        } else if (
          eventType === 'response.output_text.delta'
          && typeof payload.delta === 'string'
        ) {
          handlers.onText(payload.delta);
        } else if (eventType === 'response.action') {
          const action = asRecord(payload.action);
          if (action && typeof action.type === 'string') {
            handlers.onAction(action as unknown as UIAction);
          }
        } else if (eventType === 'response.done' || eventType === 'done') {
          complete(metadataFrom(payload, createdMessageId));
        }
      } catch (error) {
        handlers.onMalformedEvent?.(new Error('Không thể đọc sự kiện streaming từ Agent.', {
          cause: error,
        }));
      }
    },
    finish() {
      if (completed) return;
      completed = true;
      handlers.onError(new Error(
        'Luồng phản hồi kết thúc trước sự kiện response.done.',
      ));
    },
    isDone() {
      return completed;
    },
  };
};

export const consumeAgentEventStream = async (
  stream: ReadableStream<Uint8Array>,
  handlers: AgentStreamHandlers,
) => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const dispatcher = createAgentEventDispatcher(handlers);
  const parser = createSSEParser(event => dispatcher.dispatch(event));

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.push(decoder.decode(value, { stream: true }));
    }

    parser.finish(decoder.decode());
    dispatcher.finish();
  } finally {
    reader.releaseLock();
  }
};
