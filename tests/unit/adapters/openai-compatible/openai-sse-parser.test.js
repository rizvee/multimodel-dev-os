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

  it('throws TypeError for invalid parser options', () => {
    expect(() => createOpenAISSEParser({ max_buffer_size: -10 })).toThrow(TypeError);
    expect(() => createOpenAISSEParser({ max_buffer_size: 0 })).toThrow(TypeError);
    expect(() => createOpenAISSEParser({ max_event_size: 'invalid' })).toThrow(TypeError);
  });

  it('rejects arbitrary object input without calling .toString()', () => {
    const parser = createOpenAISSEParser();
    const badInput = { toString() { throw new Error('should not be called'); } };

    const events = parser.feed(badInput);
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('error');
    expect(events[0].error.code).toBe('stream_error');
    expect(events[0].error.message).toContain('Invalid SSE chunk input type');
  });

  it('correctly handles multi-byte UTF-8 character split across byte chunks', () => {
    const parser = createOpenAISSEParser();
    // Multi-byte character '🚀' is 4 bytes: 0xF0, 0x9F, 0x99, 0x80
    // JSON: {"choices":[{"delta":{"content":"🚀"}}]}
    const jsonStr = JSON.stringify({ choices: [{ delta: { content: '🚀' } }] });
    const fullLine = `data: ${jsonStr}\n\n`;
    const fullBuffer = Buffer.from(fullLine, 'utf-8');

    // Split right inside the 4-byte UTF-8 emoji
    const emojiPos = fullBuffer.indexOf(Buffer.from('🚀'));
    const chunk1 = fullBuffer.subarray(0, emojiPos + 2);
    const chunk2 = fullBuffer.subarray(emojiPos + 2);

    const events1 = parser.feed(chunk1);
    expect(events1.length).toBe(0);

    const events2 = parser.feed(chunk2);
    expect(events2.length).toBe(1);
    expect(events2[0].type).toBe('chunk');
    expect(events2[0].data.choices[0].delta.content).toBe('🚀');
  });

  it('enforces eventLines accumulation byte limit without blank delimiter', () => {
    const parser = createOpenAISSEParser({ max_event_size: 100 });
    // Feed multiple lines without a blank line \n\n delimiter
    parser.feed('data: line1\n');
    parser.feed('data: line2\n');
    const events = parser.feed('data: ' + 'x'.repeat(100) + '\n');

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('error');
    expect(events[0].error.code).toBe('stream_error');
    expect(events[0].error.message).toContain('Oversized SSE event payload');
  });

  it('joins multi-line data fields with newlines per SSE specification', () => {
    const parser = createOpenAISSEParser();
    const payloadStr = JSON.stringify({ choices: [{ delta: { content: 'line1\nline2' } }] });
    // Splitting JSON payload across multiple data: lines within the same event block
    const sseText = `data: {"choices":[{"delta":{"content":\ndata: "line1\\nline2"}}]}\n\n`;

    const events = parser.feed(sseText);
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('chunk');
    expect(events[0].data.choices[0].delta.content).toBe('line1\nline2');
  });

  it('enforces terminal [DONE] state, feed after [DONE], and reset after [DONE]', () => {
    const parser = createOpenAISSEParser();
    const eventsDone = parser.feed('data: [DONE]\n\n');
    expect(eventsDone.length).toBe(1);
    expect(eventsDone[0].type).toBe('done');

    // Feed after [DONE] emits stream error
    const eventsAfterDone = parser.feed('data: {"choices":[{"delta":{"content":"after"}}]}\n\n');
    expect(eventsAfterDone.length).toBe(1);
    expect(eventsAfterDone[0].type).toBe('error');
    expect(eventsAfterDone[0].error.message).toContain('terminal [DONE]');

    // reset() clears done state
    parser.reset();
    const eventsAfterReset = parser.feed('data: {"choices":[{"delta":{"content":"fresh"}}]}\n\n');
    expect(eventsAfterReset.length).toBe(1);
    expect(eventsAfterReset[0].type).toBe('chunk');
    expect(eventsAfterReset[0].data.choices[0].delta.content).toBe('fresh');
  });

  it('supports multi-choice delta allowlisting', () => {
    const parser = createOpenAISSEParser();
    const multiChoiceJson = JSON.stringify({
      choices: [
        { index: 0, delta: { role: 'assistant', content: 'Choice 0' } },
        { index: 1, delta: { role: 'assistant', content: 'Choice 1' } },
      ],
    });

    const events = parser.feed(`data: ${multiChoiceJson}\n\n`);
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('chunk');
    expect(events[0].data.choices).toHaveLength(2);
    expect(events[0].data.choices[0].delta.content).toBe('Choice 0');
    expect(events[0].data.choices[1].delta.content).toBe('Choice 1');
  });

  it('emits error for unsupported tool-call delta when capability is false', () => {
    const parser = createOpenAISSEParser({
      context: { capability: { tool_calls: false } },
    });
    const toolDeltaJson = JSON.stringify({
      choices: [{ delta: { tool_calls: [{ id: 'call_1', type: 'function' }] } }],
    });

    const events = parser.feed(`data: ${toolDeltaJson}\n\n`);
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('error');
    expect(events[0].error.code).toBe('unsupported_capability');
  });

  it('handles fragmented SSE chunks across multiple feed calls', () => {
    const text = readTextFixture('sse-normal-sequence.txt');
    const parser = createOpenAISSEParser();

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
