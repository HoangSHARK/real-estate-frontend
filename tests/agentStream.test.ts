import assert from 'node:assert/strict';
import test from 'node:test';
import {
  consumeAgentEventStream,
  createAgentEventDispatcher,
} from '../src/services/agentStream.ts';
import { createSSEParser, type ServerSentEvent } from '../src/services/sse.ts';
import { createMessageId, getOrCreateAnonymousUserId } from '../src/utils/identity.ts';

test('SSE parser handles chunk boundaries, CRLF and multi-line data', () => {
  const events: ServerSentEvent[] = [];
  const parser = createSSEParser(event => events.push(event));
  const input = ': keepalive\r\nevent: sample\r\nid: evt-1\r\ndata: first\r\ndata: second\r\n\r\n';
  const chunkSizes = [1, 2, 5, 3, 8, 1, 13];
  let offset = 0;

  for (const size of chunkSizes) {
    parser.push(input.slice(offset, offset + size));
    offset += size;
  }
  parser.push(input.slice(offset));
  parser.finish();

  assert.deepEqual(events, [{ event: 'sample', data: 'first\nsecond', id: 'evt-1' }]);
});

test('SSE parser flushes one unterminated trailing event exactly once', () => {
  const events: ServerSentEvent[] = [];
  const parser = createSSEParser(event => events.push(event));

  parser.push('event: response.output_text.delta\ndata: {"delta":"xin chào"}');
  assert.equal(events.length, 0);
  parser.finish();
  parser.finish();

  assert.equal(events.length, 1);
  assert.equal(events[0]?.event, 'response.output_text.delta');
});

test('agent dispatcher extracts final metadata and completes once', () => {
  const text: string[] = [];
  const actions: unknown[] = [];
  const completions: unknown[] = [];
  const parseErrors: unknown[] = [];
  const transportErrors: unknown[] = [];
  const dispatcher = createAgentEventDispatcher({
    onText: delta => text.push(delta),
    onAction: action => actions.push(action),
    onDone: metadata => completions.push(metadata),
    onError: error => transportErrors.push(error),
    onMalformedEvent: error => parseErrors.push(error),
  });

  dispatcher.dispatch({
    event: 'response.created',
    data: JSON.stringify({ response_id: 'resp-fallback' }),
  });
  dispatcher.dispatch({
    event: 'response.output_text.delta',
    data: JSON.stringify({ delta: 'hello' }),
  });
  dispatcher.dispatch({
    event: 'response.action',
    data: JSON.stringify({ action: { type: 'cta', items: [] } }),
  });
  dispatcher.dispatch({
    event: 'response.done',
    data: JSON.stringify({
      message_id: 'msg-server',
      trace_id: 'trace-1',
      feedback_token: 'token-1',
      response: { text: 'hello', actions: [] },
    }),
  });
  dispatcher.dispatch({
    event: 'response.done',
    data: JSON.stringify({ message_id: 'duplicate' }),
  });
  dispatcher.finish();

  assert.deepEqual(text, ['hello']);
  assert.deepEqual(actions, [{ type: 'cta', items: [] }]);
  assert.equal(completions.length, 1);
  assert.deepEqual(completions[0], {
    message_id: 'msg-server',
    trace_id: 'trace-1',
    feedback_token: 'token-1',
    response: { text: 'hello', actions: [] },
  });
  assert.equal(parseErrors.length, 0);
  assert.equal(transportErrors.length, 0);
});

test('agent dispatcher reports an incomplete stream when EOF arrives before done', () => {
  const completions: unknown[] = [];
  const parseErrors: unknown[] = [];
  const transportErrors: unknown[] = [];
  const dispatcher = createAgentEventDispatcher({
    onText: () => undefined,
    onAction: () => undefined,
    onDone: metadata => completions.push(metadata),
    onError: error => transportErrors.push(error),
    onMalformedEvent: error => parseErrors.push(error),
  });

  dispatcher.dispatch({ event: 'response.created', data: '{"response_id":"resp-1"}' });
  dispatcher.dispatch({ event: 'response.output_text.delta', data: '{bad json' });
  dispatcher.finish();

  assert.equal(parseErrors.length, 1);
  assert.deepEqual(completions, []);
  assert.equal(transportErrors.length, 1);
  assert.match(String(transportErrors[0]), /response\.done/);
});

test('stream consumer treats clean EOF without response.done as an error', async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(
        'event: response.output_text.delta\ndata: {"delta":"partial"}\n\n',
      ));
      controller.close();
    },
  });
  const text: string[] = [];
  const errors: unknown[] = [];

  await consumeAgentEventStream(stream, {
    onText: delta => text.push(delta),
    onAction: () => undefined,
    onDone: () => assert.fail('incomplete streams must not complete successfully'),
    onError: error => errors.push(error),
  });

  assert.deepEqual(text, ['partial']);
  assert.equal(errors.length, 1);
  assert.match(String(errors[0]), /response\.done/);
});

test('stream consumer reads through EOF after response.done without cancelling', async () => {
  const encoder = new TextEncoder();
  const chunks = [
    encoder.encode('event: response.done\ndata: {"message_id":"msg-1"}\n\n'),
    encoder.encode('event: response.output_text.delta\ndata: {"delta":"ignored"}\n\n'),
  ];
  let delivered = 0;
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      const chunk = chunks[delivered];
      if (chunk) {
        delivered += 1;
        controller.enqueue(chunk);
      } else {
        controller.close();
      }
    },
    cancel() {
      cancelled = true;
    },
  }, { highWaterMark: 0 });
  let completionCount = 0;

  await consumeAgentEventStream(stream, {
    onText: () => assert.fail('events after response.done must be ignored'),
    onAction: () => undefined,
    onDone: () => { completionCount += 1; },
    onError: error => assert.fail(String(error)),
  });

  assert.equal(delivered, chunks.length);
  assert.equal(cancelled, false);
  assert.equal(completionCount, 1);
});

test('anonymous user ID is stable in storage and request message IDs are unique', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };

  const first = getOrCreateAnonymousUserId(storage);
  const second = getOrCreateAnonymousUserId(storage);
  const firstMessage = createMessageId();
  const secondMessage = createMessageId();

  assert.equal(first, second);
  assert.match(first, /^anon_/);
  assert.match(firstMessage, /^msg_/);
  assert.notEqual(firstMessage, secondMessage);
});
