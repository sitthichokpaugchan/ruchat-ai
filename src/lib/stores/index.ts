import { writable, type Writable } from "svelte/store";

// โครงสร้างข้อมูลสำหรับแชทแต่ละรายการ
export interface Chat {
    id: string;
    title: string;
}

// โครงสร้างเมธอดสำหรับจัดการฐานข้อมูลแชท (IndexedDB)
export interface ChatDatabase {
    getChats(): Promise<Chat[]>;
    updateChatById(id: string, updates: { title?: string }): Promise<void>;
    deleteChatById(id: string): Promise<void>;
}

// Store สำหรับอินสแตนซ์ฐานข้อมูล IndexedDB
export const db: Writable<ChatDatabase | undefined> = writable(undefined);

// Store สำหรับเก็บ ID ของแชทที่กำลังเปิดใช้งานอยู่ในปัจจุบัน
export const chatId: Writable<string> = writable("");

// Store สำหรับเก็บรายการแชททั้งหมดในประวัติ
export const chats: Writable<Chat[]> = writable([]);

// Store สำหรับเก็บรายการโมเดล AI ทั้งหมดที่ดึงมาจาก Ollama
export const models: Writable<any[]> = writable([]);

// Store สำหรับเก็บการตั้งค่าของผู้ใช้ เช่น โมเดลเริ่มต้น
export const settings: Writable<any> = writable({});