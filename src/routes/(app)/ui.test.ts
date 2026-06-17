import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import ChatPage from './+page.svelte';
import Messages from '$lib/components/chat/Messages.svelte';
import { tick } from 'svelte';
import { writable, get } from 'svelte/store';

// จำลอง (mock) svelte stores
vi.mock('$lib/stores', async (importOriginal) => {
  const actual = await importOriginal();
  const { writable } = await import('svelte/store');
  const dbMock = writable({
    getChatById: vi.fn(),
    createNewChat: vi.fn(),
    updateChatById: vi.fn(),
    getChats: vi.fn(() => Promise.resolve([])),
    deleteChat: vi.fn(),
  });
  const settingsMock = writable({
    ollamaApiBaseUrl: 'http://localhost:11434',
    authHeader: null,
    notificationEnabled: false,
    responseAutoCopy: false,
    titleAutoGenerate: true,
  });
  const chatIdMock = writable(null);
  const chatsMock = writable([]);
  return {
    ...actual,
    db: dbMock,
    settings: settingsMock,
    chatId: chatIdMock,
    chats: chatsMock,
  };
});

// จำลอง (mock) sveltekit navigation และ page สำหรับ ChatPage
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));
vi.mock('$app/stores', async (importOriginal) => {
  const actual = await importOriginal();
  const { writable } = await import('svelte/store');
  return {
    ...actual,
    page: writable({ params: { id: 'test-chat-id' }, url: new URL('http://localhost') }),
  };
});
vi.spyOn(window, 'fetch').mockResolvedValue(new Response('{}'));

// กลุ่มการทดสอบสำหรับการตอบสนองของ UI
describe('UI Responsiveness Tests', () => {
  // สถานการณ์ที่ 1: การปรับขนาดหน้าจอ (จำลอง viewports ที่แตกต่างกัน)
  it('ควรปรับเค้าโครงสำหรับหน้าจอขนาดเล็ก', async () => {
    // แสดงผล ChatPage
    render(ChatPage);
    await tick();

    // จำลอง viewport ของมือถือ
    window.innerWidth = 375;
    window.innerHeight = 667;
    window.dispatchEvent(new Event('resize'));
    await tick();

    expect(screen.getByPlaceholderText('ส่งข้อความ')).toBeInTheDocument();
  });

  it('ควรปรับเค้าโครงสำหรับหน้าจอแท็บเล็ต', async () => {
    render(ChatPage);
    await tick();

    // จำลอง viewport ของแท็บเล็ต
    window.innerWidth = 768;
    window.innerHeight = 1024;
    window.dispatchEvent(new Event('resize'));
    await tick();

    expect(screen.getByPlaceholderText('ส่งข้อความ')).toBeInTheDocument();
  });

  // สถานการณ์ที่ 2: ฟังก์ชันการเลื่อนอัตโนมัติ
  it('ควรเลื่อนอัตโนมัติไปด้านล่างเมื่อข้อความใหม่ปรากฏขึ้นและ AutoScroll เป็น true', async () => {
    const mockSendPrompt = vi.fn();
    const mockRegenerateResponse = vi.fn();
    const mockMessages = writable([
      { id: '1', role: 'user', content: 'Hello' },
    ]);

    // จำลอง (mock) window.scrollTo
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => { });

    const { component } = render(Messages, {
      props: {
        messages: get(mockMessages),
        sendPrompt: mockSendPrompt,
        regenerateResponse: mockRegenerateResponse,
        autoScroll: true,
        bottomPadding: true, // เพิ่มเพื่อให้แน่ใจว่าเงื่อนไขการเลื่อนอัตโนมัติเป็นจริง
        history: { messages: {}, currentId: null },
      },
    });

    await tick(); // การแสดงผลเริ่มต้น

    // เพิ่มข้อความใหม่
    mockMessages.update(m => [...m, { id: '2', role: 'assistant', content: 'Hi there', done: true }]);
    component.$set({ messages: get(mockMessages) });

    await tick(); // รอให้ Svelte ประมวลผลการอัปเดต
    expect(scrollToSpy).toHaveBeenCalledWith({ top: document.body.scrollHeight, behavior: 'smooth' });

    scrollToSpy.mockRestore(); // ล้าง spy
  });

  it('ไม่ควรเลื่อนอัตโนมัติถ้า autoscroll เป็น false แต่อนุญาตให้เลื่อนด้วยตนเอง', async () => {
    const mockSendPrompt = vi.fn();
    const mockRegenerateResponse = vi.fn();
    const mockMessages = writable([
      { id: '1', role: 'user', content: 'Hello' },
    ]);

    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => { });

    const { component } = render(Messages, {
      props: {
        messages: get(mockMessages),
        sendPrompt: mockSendPrompt,
        regenerateResponse: mockRegenerateResponse,
        autoScroll: false, // ตั้งค่า autoScroll เป็น false
        bottomPadding: true, // เพิ่มเพื่อให้แน่ใจว่าเงื่อนไขการเลื่อนอัตโนมัติเป็นจริง
        history: { messages: {}, currentId: null },
      },
    });

    await tick(); // การแสดงผลเริ่มต้น

    // เพิ่มข้อความใหม่
    mockMessages.update(m => [...m, { id: '2', role: 'assistant', content: 'Hi there', done: true }]);
    component.$set({ messages: get(mockMessages) });

    await tick();
    expect(scrollToSpy).not.toHaveBeenCalled(); // ไม่ควรเรียกใช้การเลื่อนอัตโนมัติ

    scrollToSpy.mockRestore();
  });

});
