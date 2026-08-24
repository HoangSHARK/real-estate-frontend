export interface ServerSentEvent {
  event: string;
  data: string;
  id?: string;
}

export interface SSEParser {
  push: (chunk: string) => void;
  finish: (finalChunk?: string) => void;
}

const eventBoundary = /\r\n\r\n|\n\n|\r\r/;

const parseBlock = (block: string): ServerSentEvent | null => {
  let event = 'message';
  let id: string | undefined;
  let hasData = false;
  const data: string[] = [];

  for (const rawLine of block.split(/\r\n|\r|\n/)) {
    const line = rawLine.replace(/^\uFEFF/, '');
    if (!line || line.startsWith(':')) continue;

    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'event') {
      event = value || 'message';
    } else if (field === 'data') {
      hasData = true;
      data.push(value);
    } else if (field === 'id' && !value.includes('\0')) {
      id = value;
    }
  }

  return hasData ? { event, data: data.join('\n'), id } : null;
};

export const createSSEParser = (
  onEvent: (event: ServerSentEvent) => void,
): SSEParser => {
  let buffer = '';
  let finished = false;

  const dispatch = (block: string) => {
    const event = parseBlock(block);
    if (event) onEvent(event);
  };

  const drainCompleteBlocks = () => {
    while (true) {
      const boundary = eventBoundary.exec(buffer);
      if (!boundary || boundary.index === undefined) return;
      dispatch(buffer.slice(0, boundary.index));
      buffer = buffer.slice(boundary.index + boundary[0].length);
    }
  };

  return {
    push(chunk) {
      if (finished || !chunk) return;
      buffer += chunk;
      drainCompleteBlocks();
    },
    finish(finalChunk = '') {
      if (finished) return;
      if (finalChunk) buffer += finalChunk;
      drainCompleteBlocks();
      if (buffer.trim()) dispatch(buffer);
      buffer = '';
      finished = true;
    },
  };
};
