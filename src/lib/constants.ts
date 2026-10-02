import { env } from '$env/dynamic/public';
import { MODEL_NAME } from './modelfile';

// URL ปลายทางของ Ollama API (ค่าเริ่มต้นคือ Ollama Cloud: https://ollama.com)
export const OLLAMA_HOST = env.PUBLIC_OLLAMA_HOST;

// API Key สำหรับเชื่อมต่อบริการ Ollama Cloud
export const OLLAMA_API_KEY = env.PUBLIC_OLLAMA_API_KEY;

// โมเดลเริ่มต้นที่ใช้งาน (ดึงค่าจาก Modelfile)
export const DEFAULT_MODEL = MODEL_NAME;

// รองรับความเข้ากันได้ย้อนหลัง หากยังมีโค้ดส่วนอื่นอ้างอิงถึง OLLAMA_API_BASE_URL
export const OLLAMA_API_BASE_URL = `${OLLAMA_HOST.replace(/\/+$/, '')}/api`;