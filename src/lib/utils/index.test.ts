import { describe, it, expect } from 'vitest';
import { splitStream } from './index';

// กลุ่มการทดสอบสำหรับฟังก์ชัน splitStream
describe('splitStream', () => {
  it('ควรแยกสตรีมตามตัวคั่นที่กำหนด', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('hello\nworld\n');
        controller.close();
      },
    });

    const transformedStream = stream.pipeThrough(splitStream('\n'));
    const reader = transformedStream.getReader();

    const result1 = await reader.read();
    expect(result1.value).toBe('hello');
    expect(result1.done).toBe(false);

    const result2 = await reader.read();
    expect(result2.value).toBe('world');
    expect(result2.done).toBe(false);

    const result3 = await reader.read();
    expect(result3.value).toBe(undefined);
    expect(result3.done).toBe(true);
  });

  it('ควรจัดการกับส่วนที่ไม่ได้จบลงด้วยตัวคั่น', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('part1');
        controller.enqueue('part2\n');
        controller.enqueue('part3');
        controller.close();
      },
    });

    const transformedStream = stream.pipeThrough(splitStream('\n'));
    const reader = transformedStream.getReader();

    const result1 = await reader.read();
    expect(result1.value).toBe('part1part2');
    expect(result1.done).toBe(false);

    const result2 = await reader.read();
    expect(result2.value).toBe('part3');
    expect(result2.done).toBe(false);

    const result3 = await reader.read();
    expect(result3.value).toBe(undefined);
    expect(result3.done).toBe(true);
  });

  it('ควรจัดการสตรีมที่ว่าง', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    const transformedStream = stream.pipeThrough(splitStream('\n'));
    const reader = transformedStream.getReader();

    const result = await reader.read();
    expect(result.value).toBe(undefined);
    expect(result.done).toBe(true);
  });

  it('ควรจัดการสตรีมที่มีเพียงตัวคั่น', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('\n');
        controller.close();
      },
    });

    const transformedStream = stream.pipeThrough(splitStream('\n'));
    const reader = transformedStream.getReader();

    const result1 = await reader.read();
    expect(result1.value).toBe('');
    expect(result1.done).toBe(false);

    const result2 = await reader.read();
    expect(result2.value).toBe(undefined);
    expect(result2.done).toBe(true);
  });
});
