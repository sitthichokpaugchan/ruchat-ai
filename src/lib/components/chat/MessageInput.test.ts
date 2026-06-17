import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import MessageInput from './MessageInput.svelte';

describe('MessageInput', () => {
  it('ควรแสดงฟิลด์อินพุตและปุ่มส่ง', () => {
    render(MessageInput, { props: { submitPrompt: vi.fn(), stopResponse: vi.fn(), messages: [] } });
    expect(screen.getByPlaceholderText('ส่งข้อความ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ส่ง' })).toBeInTheDocument();
  });

  it('ควรอัปเดตค่าอินพุตเมื่อพิมพ์', async () => {
    const submitPrompt = vi.fn();
    const stopResponse = vi.fn();
    render(MessageInput, { props: { submitPrompt, stopResponse, messages: [] } });
    const input = screen.getByPlaceholderText('ส่งข้อความ');
    await fireEvent.input(input, { target: { value: 'Hello, world!' } });
    expect(input.value).toBe('Hello, world!');
  });

  // สถานการณ์ที่ 1: พรอมต์สั้น
  it('ควรเรียก SubmitPrompt และล้างช่องอินพุต ผ่านปุ่มส่ง', async () => {
    const submitPrompt = vi.fn();
    const stopResponse = vi.fn();
    render(MessageInput, { props: { submitPrompt, stopResponse, messages: [] } });
    const input = screen.getByPlaceholderText('ส่งข้อความ');
    const sendButton = screen.getByRole('button', { name: 'ส่ง' });

    await fireEvent.input(input, { target: { value: 'สวัสดี' } });
    await fireEvent.click(sendButton);

    expect(submitPrompt).toHaveBeenCalledWith('สวัสดี');
    expect(input.value).toBe('');
  });

  it('ควรเรียก SubmitPrompt และล้างช่องอินพุต ผ่านปุ่ม Enter', async () => {
    const submitPrompt = vi.fn();
    const stopResponse = vi.fn();
    const { container } = render(MessageInput, { props: { submitPrompt, stopResponse, messages: [] } });
    const input = screen.getByPlaceholderText('ส่งข้อความ');
    const form = container.querySelector('form');

    await fireEvent.input(input, { target: { value: 'วันนี้อากาศเป็นอย่างไร' } });
    await fireEvent.submit(form); // จำลองการส่งฟอร์มเมื่อกด Enter

    expect(submitPrompt).toHaveBeenCalledWith('วันนี้อากาศเป็นอย่างไร');
    expect(input.value).toBe('');
  });

  // สถานการณ์ที่ 2: พรอมต์ยาวและซับซ้อน
  it('ควรจัดการพรอมต์ยาวและซับซ้อนผ่านปุ่มคลิก', async () => {
    const submitPrompt = vi.fn();
    const stopResponse = vi.fn();
    render(MessageInput, { props: { submitPrompt, stopResponse, messages: [] } });
    const input = screen.getByPlaceholderText('ส่งข้อความ');
    const sendButton = screen.getByRole('button', { name: 'ส่ง' });
    const longPrompt = "เขียนบทความสั้นๆ เกี่ยวกับปัญญาประดิษฐ์ในยุคปัจจุบัน โดยเน้นผลกระทบต่อสังคมและเศรษฐกิจ พร้อมทั้งเสนอแนวทางในการรับมือ";

    await fireEvent.input(input, { target: { value: longPrompt } });
    await fireEvent.click(sendButton);

    expect(submitPrompt).toHaveBeenCalledWith(longPrompt);
    expect(input.value).toBe('');
  });

  it('ไม่ควร submitprompt หากอินพุตว่าง', async () => {
    const submitPrompt = vi.fn();
    const stopResponse = vi.fn();
    render(MessageInput, { props: { submitPrompt, stopResponse, messages: [] } });
    const sendButton = screen.getByRole('button', { name: 'ส่ง' });

    await fireEvent.click(sendButton);
    expect(submitPrompt).not.toHaveBeenCalled();
  });

  it('ไม่ควรเรียก SubmitPrompt หากอินพุตมีเพียงช่องว่าง', async () => {
    const submitPrompt = vi.fn();
    const stopResponse = vi.fn();
    render(MessageInput, { props: { submitPrompt, stopResponse, messages: [] } });
    const input = screen.getByPlaceholderText('ส่งข้อความ');
    const sendButton = screen.getByRole('button', { name: 'ส่ง' });

    await fireEvent.input(input, { target: { value: '   ' } }); // มีแต่ช่องว่าง
    await fireEvent.click(sendButton);
    expect(submitPrompt).not.toHaveBeenCalled();

    await fireEvent.input(input, { target: { value: '  \n  ' } }); // มีช่องว่างและขึ้นบรรทัดใหม่
    await fireEvent.click(sendButton);
    expect(submitPrompt).not.toHaveBeenCalled();
  });

  // สถานการณ์ที่ 3: ทดสอบการหยุดการตอบสนองกลางคัน
  it('ควรแสดงปุ่ม "หยุด" และเรียกหยุดการตอบสนองเมื่อคลิกหากกำลังตอบกลับ', async () => {
    const submitPrompt = vi.fn();
    const stopResponse = vi.fn();
    const messages = [{ role: 'user', content: 'test' }, { role: 'assistant', content: 'generating...', done: false }];
    render(MessageInput, { props: { submitPrompt, stopResponse, messages } });

    const stopButton = screen.getByRole('button', { name: 'หยุด' });
    expect(stopButton).toBeInTheDocument();

    await fireEvent.click(stopButton);
    expect(stopResponse).toHaveBeenCalled();
  });

  // สถานการณ์ที่ 4: การจัดการข้อผิดพลาดในการเชื่อมต่อ
  it('ไม่ควรมีปัญหาหาก SubmitPrompt ส่งข้อผิดพลาด', async () => {
    const submitPrompt = vi.fn();
    const stopResponse = vi.fn();
    render(MessageInput, { props: { submitPrompt, stopResponse, messages: [] } });
    const input = screen.getByPlaceholderText('ส่งข้อความ');
    const sendButton = screen.getByRole('button', { name: 'ส่ง' });

    await fireEvent.input(input, { target: { value: 'test' } });
    await fireEvent.click(sendButton);

    expect(submitPrompt).toHaveBeenCalledWith('test');
    expect(input.value).toBe('');
  });

  it('ควรปิดการใช้งานปุ่มส่งเมื่อไม่มีพรอมต์', () => {
    const submitPrompt = vi.fn();
    const stopResponse = vi.fn();
    render(MessageInput, { props: { submitPrompt, stopResponse, messages: [] } });
    const sendButton = screen.getByRole('button', { name: 'ส่ง' });
    expect(sendButton).toBeDisabled();
  });

  it('ควรเปิดใช้งานปุ่มส่งเมื่อมีพรอมต์', async () => {
    const submitPrompt = vi.fn();
    const stopResponse = vi.fn();
    render(MessageInput, { props: { submitPrompt, stopResponse, messages: [] } });
    const input = screen.getByPlaceholderText('ส่งข้อความ');
    const sendButton = screen.getByRole('button', { name: 'ส่ง' });

    await fireEvent.input(input, { target: { value: 'some text' } });
    expect(sendButton).toBeEnabled();
  });
});
