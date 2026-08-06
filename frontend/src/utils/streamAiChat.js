const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function parseSseBlock(block) {
  const lines = block.split('\n');
  const dataLines = [];

  for (const line of lines) {
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  const payload = dataLines.join('\n');

  if (payload === '[DONE]') {
    return { type: 'done' };
  }

  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function streamAiChat(payload, { onChunk, onDone, onError, signal }) {
  const response = await fetch(`${API_BASE}/ai/chat/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let message = 'Failed to get a response from AI';

    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch {
      // ignore JSON parse errors
    }

    throw new Error(message);
  }

  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error('Streaming is not supported in this browser.');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';

    for (const block of blocks) {
      const event = parseSseBlock(block.trim());

      if (!event) {
        continue;
      }

      if (event.type === 'chunk' && event.text) {
        onChunk?.(event.text);
      } else if (event.type === 'error') {
        onError?.(event.message || 'Streaming failed');
        return;
      } else if (event.type === 'done') {
        onDone?.();
        return;
      }
    }
  }

  onDone?.();
}
