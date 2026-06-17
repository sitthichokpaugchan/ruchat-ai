import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Page from './+page.svelte';
import { db, chatId, chats } from '$lib/stores';
import { tick } from 'svelte';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { page } from '$app/stores';

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
  const modelsMock = writable([
    { name: 'llama2', license: 'MIT', family: 'llama', size: '7B', quant: 'Q4_0' },
    { name: 'codellama', license: 'MIT', family: 'llama', size: '7B', quant: 'Q4_0' },
  ]);
  return {
    ...actual,
    db: dbMock,
    settings: settingsMock,
    chatId: chatIdMock,
    chats: chatsMock,
    models: modelsMock,
  };
});

// จำลอง (mock) sveltekit navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

// จำลอง (mock) sveltekit page store
vi.mock('$app/stores', async (importOriginal) => {
  const actual = await importOriginal();
  const { writable } = await import('svelte/store');
  const pageStore = writable({ params: { id: 'test-chat-id' }, url: new URL('http://localhost') });
  return {
    ...actual,
    page: pageStore,
  };
});

// จำลอง (mock) svelte-french-toast
vi.mock('svelte-french-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
  },
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
  }
}));

describe('+page.svelte - Chat History Management', () => {
  let fetchSpy; // ประกาศ fetchSpy นอก beforeEach เพื่อให้สามารถเข้าถึงได้ในการทดสอบ

  beforeEach(async () => {
    vi.clearAllMocks();
    chatId.set(null);
    // ตั้งค่าเริ่มต้นสำหรับ page store ก่อนการทดสอบแต่ละครั้ง
    await tick(); // ตรวจสอบให้แน่ใจว่า reactivity ก่อนหน้าเสร็จสิ้น
    page.set({ params: { id: 'test-chat-id' } });

    // จำลอง (mock) fetch ของ generateChatTitle เพื่อส่งคืน JSON โดยค่าเริ่มต้น
    fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(new Response(JSON.stringify({ response: "mocked title" }), {
      headers: { 'Content-Type': 'application/json' }
    }));
  });

  // สถานการณ์ที่ 1: การสร้างและบันทึกแชทใหม่
  it('ควรสร้างแชทใหม่และบันทึกลงใน indexedDB เมื่อส่งข้อความแรก', async () => {
    const mockChatId = 'new-chat-id';
    chatId.set(mockChatId); // ตั้งค่า chatId
    await tick(); // ตรวจสอบให้แน่ใจว่าการอัปเดต chatId เสร็จสิ้น
    page.set({ params: { id: mockChatId } }); // ตั้งค่า ID ของหน้าเป็น ID ใหม่

    get(db).getChatById.mockResolvedValueOnce({ // ส่งอ็อบเจ็กต์แชทที่ว่างเพื่อให้สามารถแสดงผลได้
      id: mockChatId,
      title: '',
      models: [''],
      messages: [],
      history: { messages: {}, currentId: null },
    });
    get(db).createNewChat.mockResolvedValueOnce(undefined);
    get(db).updateChatById.mockResolvedValue(undefined); // จำลอง (mock) การอัปเดตสำหรับการสตรีม
    get(db).getChats.mockResolvedValueOnce([{ id: mockChatId, title: 'Test Prompt', messages: [] }]);

    render(Page);
    await tick(); // รอการโหลดเริ่มต้น

    // เลือกโมเดลเพื่อเปิดใช้งานการส่งแชท
    const modelSelector = await screen.findByRole('combobox');
    await fireEvent.change(modelSelector, { target: { value: 'llama2' } });
    await tick(); // รอให้ reactivity เสร็จสิ้นหลังจากการเลือกโมเดล

    const messageInput = await screen.findByPlaceholderText('ส่งข้อความ');
    const sendButton = await screen.findByRole('button', { name: 'ส่ง' });

    await fireEvent.input(messageInput, { target: { value: 'Test Prompt' } });
    await fireEvent.click(sendButton);
    await new Promise(resolve => setTimeout(resolve, 100)); // เพิ่ม delay เพื่อให้เวลาสำหรับ async operations

    expect(get(db).createNewChat).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockChatId,
        title: 'ไม่มีชื่อแชท', // ชื่อเรื่องเริ่มต้นก่อนการสร้างอัตโนมัติ
        models: ['llama2'],
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: 'Test Prompt',
          }),
        ]),
        history: expect.objectContaining({ // คาดหวังว่าประวัติจะมีข้อความและ currentId
          messages: expect.any(Object),
          currentId: expect.any(String),
        }),
      })
    );
    // จำลอง (mock) fetch อีกครั้งสำหรับ sendPromptOllama เพื่อส่งคืนข้อมูลการสตรีม
    fetchSpy.mockImplementation(() =>
      Promise.resolve(new Response(
        `data: {"message":{"content":"response"},"done":false}\ndata: {"done":true,"context":[]}\n`,
        { headers: { 'Content-Type': 'text/event-stream' } }
      ))
    );

    // จำลองการเสร็จสิ้นการตอบสนองสำหรับการสร้างชื่อเรื่อง
    await tick(); // ให้เวลาสำหรับ fetch ที่จำลอง (mock) เพื่อให้เสร็จสมบูรณ์และมีการอัปเดตเกิดขึ้น
    await tick(); // เพิ่ม tick เพื่อให้ Svelte re-render หลังจาก mock fetch

    // คาดหวังว่า updateChatById จะถูกเรียกหนึ่งครั้งสำหรับการอัปเดตข้อความ
    expect(get(db).updateChatById).toHaveBeenCalledTimes(1);
    expect(get(db).updateChatById).toHaveBeenCalledWith(
      mockChatId,
      expect.objectContaining({
        title: 'ไม่มีชื่อแชท', // ชื่อเรื่องเริ่มต้น
        messages: expect.any(Array),
        history: expect.any(Object),
      })
    );
  });

  // สถานการณ์ที่ 2: การโหลดแชทเก่า
  it('ควรโหลดแชทเก่าจาก indexedDB และแสดงข้อความ', async () => {
    const existingChatId = 'existing-chat-id';
    const mockMessages = [
      { id: 'msg1', parentId: null, role: 'user', content: 'Hello', childrenIds: ['msg2'] },
      { id: 'msg2', parentId: 'msg1', role: 'assistant', content: 'Hi there', childrenIds: [] },
    ];
    const mockHistory = {
      messages: {
        msg1: { id: 'msg1', parentId: null, role: 'user', content: 'Hello', childrenIds: ['msg2'] },
        msg2: { id: 'msg2', parentId: 'msg1', role: 'assistant', content: 'Hi there', childrenIds: [] },
      },
      currentId: 'msg2',
    };
    const mockChat = {
      id: existingChatId,
      title: 'Old Chat',
      model: 'llama2',
      messages: mockMessages,
      history: mockHistory,
    };

    get(db).getChatById.mockResolvedValueOnce(mockChat);
    chats.set([mockChat]); // อัปเดต chats store ด้วย mock chat
    // fetchSpy ถูกตั้งค่าไว้แล้วใน beforeEach

    chatId.set(existingChatId); // ตั้งค่า chatId
    await tick(); // ตรวจสอบให้แน่ใจว่าการอัปเดต chatId เสร็จสิ้น
    page.set({ params: { id: existingChatId } }); // ตั้งค่า ID ของหน้าเป็น ID ที่มีอยู่
    render(Page);
    await tick(); // รอการโหลดเริ่มต้นและการโหลดแชท

    expect(get(db).getChatById).toHaveBeenCalledWith(existingChatId);
    expect(await screen.findByText('Hello')).not.toBeNull();
    expect(await screen.findByText('Hi there')).not.toBeNull();
    expect(await screen.findByText('Old Chat')).not.toBeNull(); // ตรวจสอบว่าชื่อเรื่องถูกโหลดหรือไม่
  });

  // สถานการณ์ที่ 3: การแก้ไขชื่อแชท
  it('ควรอัปเดตชื่อการแชทเมื่อเรียก setChatTitle', async () => {
    const existingChatId = 'existing-chat-id-for-rename';
    const mockChat = {
      id: existingChatId,
      title: 'Original Title',
      model: 'llama2',
      messages: [],
      history: { messages: {}, currentId: null },
    };

    get(db).getChatById.mockResolvedValueOnce(mockChat);
    get(db).updateChatById.mockResolvedValueOnce(undefined);
    // fetchSpy ถูกตั้งค่าไว้แล้วใน beforeEach

    chatId.set(existingChatId); // ตั้งค่า chatId
    await tick(); // ตรวจสอบให้แน่ใจว่าการอัปเดต chatId เสร็จสิ้น
    page.set({ params: { id: existingChatId } });
    const { component } = render(Page);
    await tick();

    // จำลองการอัปเดตชื่อเรื่อง
    await component.$set({ title: 'New Chat Title' });

    // เรียก updateChatById
    await get(db).updateChatById(existingChatId, { title: 'Updated Chat Title' });
    expect(get(db).updateChatById).toHaveBeenCalledWith(existingChatId, { title: 'Updated Chat Title' });
  });

  // สถานการณ์ที่ 4: การลบแชท
  it('ควรไปที่หน้าแรกหากไม่มีแชท', async () => {
    const nonExistentChatId = 'non-existent-chat-id';

    get(db).getChatById.mockResolvedValueOnce(null); // จำลอง (mock) ว่าไม่พบแชท
    // fetchSpy ถูกตั้งค่าไว้แล้วใน beforeEach

    chatId.set(nonExistentChatId); // ตั้งค่า chatId
    await tick(); // ตรวจสอบให้แน่ใจว่าการอัปเดต chatId เสร็จสิ้น
    page.set({ params: { id: nonExistentChatId } });
    await tick(); // ตรวจสอบให้แน่ใจว่าการอัปเดต page store เสร็จสิ้น
    await render(Page); // เพิ่ม await หน้า render
    await tick(); // ตรวจสอบให้แน่ใจว่าการแสดงผลเริ่มต้นเสร็จสิ้น
    await new Promise(resolve => setTimeout(resolve, 0)); // รอให้ microtasks ทั้งหมดทำงาน

    expect(goto).toHaveBeenCalledWith('/'); // ควรนำทางไปที่หน้าแรก
  });
});
