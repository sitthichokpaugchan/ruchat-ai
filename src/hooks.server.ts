import { sequence } from "@sveltejs/kit/hooks";

const cors = async ({ event, resolve }) => {
  // Handle preflight OPTIONS requests immediately
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

export const handle = sequence(cors);
