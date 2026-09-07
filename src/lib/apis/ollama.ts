import { Ollama, type Message, type ChatResponse } from 'ollama/browser';
import { OLLAMA_HOST, OLLAMA_API_KEY, DEFAULT_MODEL } from '$lib/constants';
import { MODEL_CONFIG, SYSTEM_PROMPT, MODEL_PARAMETERS, CLOUD_MODEL_NAME } from '$lib/modelfile';

// กำหนด fetch พิเศษสำหรับเบราว์เซอร์ เพื่อส่ง request ผ่าน Vite proxy ในเครื่องเมื่อเรียกใช้ ollama.com
const customFetch: typeof fetch = async (input, init) => {
  let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  // สำหรับบนเบราว์เซอร์ หากเรียกไปที่ https://ollama.com ให้วิ่งผ่าน /ollama-proxy (ตัดพอร์ต :443 ที่ ollama-js มักใส่มาออก)
  if (typeof window !== 'undefined') {
    url = url.replace(/^https?:\/\/ollama\.com(?::443)?/, '/ollama-proxy');
    url = url.replace(/^\/ollama-proxy:443/, '/ollama-proxy');
  }

  return fetch(url, init);
};

export const getOllamaClient = (authHeader?: string) => {
  const token = authHeader || (OLLAMA_API_KEY ? `Bearer ${OLLAMA_API_KEY}` : undefined);
  return new Ollama({
    host: OLLAMA_HOST,
    headers: token ? { Authorization: token } : undefined,
    fetch: customFetch
  });
};

export const resolveModelName = (model?: string): string => {
  if (!model || model === 'ru-faq' || model === 'ru-faq:latest' || model === '') {
    return DEFAULT_MODEL;
  }
  return model;
};

export interface ChatStreamParams {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  authHeader?: string;
}

/**
 * แชทกับ Ollama ในโหมดสตรีม (stream) พร้อมส่งค่าพารามิเตอร์และ System Prompt จาก Modelfile
 */
export const chatStream = async ({
  model,
  messages,
  authHeader
}: ChatStreamParams) => {
  const client = getOllamaClient(authHeader);
  const targetModel = resolveModelName(model);

  // เตรียมข้อความ: ตรวจสอบให้แน่ใจว่าได้ใส่ SYSTEM_PROMPT จาก Modelfile เป็นข้อความแรกสุด
  const hasSystemPrompt = messages.some((m) => m.role === 'system');
  const finalMessages: Message[] = hasSystemPrompt
    ? (messages as Message[])
    : [{ role: 'system', content: SYSTEM_PROMPT }, ...(messages as Message[])];

  // ค่าพารามิเตอร์จาก Modelfile: temperature, top_p, top_k, repeat_penalty
  const options = {
    ...MODEL_PARAMETERS
  };

  return client.chat({
    model: targetModel,
    messages: finalMessages,
    options,
    stream: true
  });
};

/**
 * สร้างชื่อเรื่องของแชทจากข้อความเริ่มต้นของผู้ใช้
 */
export const generateChatTitle = async (
  userPrompt: string,
  model?: string,
  authHeader?: string
): Promise<string> => {
  try {
    const client = getOllamaClient(authHeader);
    const targetModel = resolveModelName(model);

    const res = await client.generate({
      model: targetModel,
      prompt: `สร้างหัวข้อแชทตรงตามภาษาเขา ไม่เกิน 10 คำ และไม่รวมคำนำหน้า จากนั้นโปรดตอบกลับโดยใช้หัวข้อแชทเท่านั้น: ${userPrompt}`,
      stream: false,
      options: {
        temperature: 0.3
      }
    });

    return res.response.trim();
  } catch (error) {
    console.error('generateChatTitle error:', error);
    return 'แชทใหม่';
  }
};

/**
 * ดึงรายการโมเดลที่ใช้งานได้จาก Ollama Cloud
 */
export const listModels = async (authHeader?: string) => {
  try {
    const client = getOllamaClient(authHeader);
    const res = await client.list();
    const modelList = res?.models ?? [];

    const hasDefault = modelList.some(
      (m: any) => m.name === DEFAULT_MODEL || m.model === DEFAULT_MODEL
    );
    if (!hasDefault) {
      modelList.unshift({
        name: DEFAULT_MODEL,
        model: DEFAULT_MODEL,
        modified_at: new Date().toISOString(),
        size: 0,
        digest: 'ruchat-modelfile',
        details: { family: 'gemma' }
      } as any);
    }
    return modelList;
  } catch (error) {
    console.error('Failed to list models from Ollama:', error);
    return [
      {
        name: DEFAULT_MODEL,
        model: DEFAULT_MODEL,
        modified_at: new Date().toISOString(),
        size: 0,
        digest: 'ruchat-modelfile',
        details: { family: 'gemma' }
      }
    ];
  }
};

export { MODEL_CONFIG, SYSTEM_PROMPT, MODEL_PARAMETERS, CLOUD_MODEL_NAME };
