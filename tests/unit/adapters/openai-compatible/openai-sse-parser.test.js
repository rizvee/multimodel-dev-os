import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createOpenAISSEParser } from '../../../../src/gateway/adapters/openai-compatible/sse.js';

const fixtureDir = join(process.cwd(), 'tests/fixtures/gateway/adapters/openai-compatible');

function readTextFixture(name) {
  return readFileSync(join(fixtureDir, name), 'utf8');
}

describe('OpenAI-compatible Incremental SSE Parser', () => {
  it('parses a clean, normal SSE text sequence', () => {
    const text = readTextFixture('sse-normal-sequence.txt');
    const parser = createOpenAISSEParser({
      context: { request_id: 'req-sse-1', provider_id: 'openai-provider', model_id: 'gpt-4o' },
    });

    const events = parser.feed(text);
    events.push(...parser.flush());

    expect(events.length).toBe(4);
    expect(events[0].type).toBe('chunk');
    expect(events[0].data.object).toBe('chat.completion.chunk');
    expect(events[0].data.choices[0].delta.content).toBe('Hello');
    expect(events[1].type).toBe('chunk');
    expect(events[1].data.choices[0].delta.content).toBe(' world!');
    expect(events[2].type).toBe('chunk');
    expect(events[2].data.choices[0].finish_reason).toBe('stop');
    expect(events[3].type).toBe('done');
  });

  it('handles fragmented SSE chunks across multiple feed calls', () => {
    const text = readTextFixture('sse-normal-sequence.txt');
    const parser = createOpenAISSEParser();

    // Split text into small fragments of 10 characters
    const allEvents = [];
    for (let i = 0; i < text.length; i += 10) {
      const fragment = text.slice(i, i + 10);
      const events = parser.feed(fragment);
      allEvents.push(...events);
    }
    allEvents.push(...parser.flush());

    expect(allEvents.length).toBe(4);
    expect(allEvents[0].type).toBe('chunk');
    expect(allEvents[0].data.choices[0].delta.content).toBe('Hello');
    expect(allEvents[3].type).toBe('done');
  });

  it('handles multiple events in a single feed call', () => {
    const text = readTextFixture('sse-multiple-events.txt');
    const parser = createOpenAISSEParser();

    const events = parser.feed(text);
    events.push(...parser.flush());

    expect(events.length).toBe(3);
    expect(events[0].data.choices[0].delta.content).toBe('A');
    expect(events[1].data.choices[0].delta.content).toBe('B');
    expect(events[2].data.choices[0].delta.content).toBe('C');
    expect(events[2].data.choices[0].finish_reason).toBe('stop');
  });

  it('handles standalone [DONE] signal', () => {
    const text = readTextFixture('sse-done.txt');
    const parser = createOpenAISSEParser();

    const events = parser.feed(text);
    events.push(...parser.flush());

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('done');
  });

  it('emits error event for malformed SSE JSON payload', () => {
    const text = readTextFixture('sse-malformed-json.txt');
    const parser = createOpenAISSEParser();

    const events = parser.feed(text);
    events.push(...parser.flush());

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('error');
    expect(events[0].error.code).toBe('stream_error');
    expect(events[0].error.redacted).toBe(true);
  });

  it('emits error event when buffer size exceeds limit', () => {
    const parser = createOpenAISSEParser({ max_buffer_size: 100 });
    const hugeChunk = 'data: ' + 'x'.repeat(150);

    const events = parser.feed(hugeChunk);

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('error');
    expect(events[0].error.code).toBe('stream_error');
    expect(events[0].error.message).toContain('capacity exceeded limit');
  });

  it('emits error event when individual event size exceeds limit', () => {
    const parser = createOpenAISSEParser({ max_event_size: 50 });
    const text = readTextFixture('sse-oversized-event.txt');

    const events = parser.feed(text);
    events.push(...parser.flush());

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('error');
    expect(events[0].error.code).toBe('stream_error');
    expect(events[0].error.message).toContain('Oversized SSE event payload');
  });

  it('clears state on reset()', () => {
    const parser = createOpenAISSEParser();
    parser.feed('data: {"incomplete":');
    parser.reset();
    const events = parser.flush();
    expect(events.length).toBe(0);
  });
});
