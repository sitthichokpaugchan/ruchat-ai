import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

// มิดเดิลแวร์จัดการการอนุญาต Cross-Origin Resource Sharing (CORS) สำหรับ API request
const cors: Handle = async ({ event, resolve }) => {
  // จัดการคำขอ preflight แบบ OPTIONS ทันที
  if (event.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-requested-with",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = await resolve(event);
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-requested-with",
  );

  return response;
};

// ส่งออก handle function ของ SvelteKit Server Hook
export const handle = sequence(cors);
