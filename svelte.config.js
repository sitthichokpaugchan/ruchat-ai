// นำเข้า adapter ที่จำเป็นสำหรับการสร้างแอปพลิเคชัน SvelteKit
import adapter from "@sveltejs/adapter-static";
// นำเข้า vitePreprocess สำหรับการประมวลผลไฟล์ Svelte ด้วย Vite
import { vitePreprocess } from "@sveltejs/kit/vite";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		csrf: {
			checkOrigin: false
		},
		adapter: adapter({
			// กำหนดไดเรกทอรีสำหรับหน้าที่สร้างขึ้น
			pages: "build",
			// กำหนดไดเรกทอรีสำหรับ assets ที่สร้างขึ้น
			assets: "build",
			// ไฟล์สำรองสำหรับ single-page applications
			fallback: "index.html"
		})
	}
};

// ส่งออกการตั้งค่าเพื่อให้ SvelteKit ใช้งาน
export default config;