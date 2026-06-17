import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, mergeConfig } from "vite";

// การตั้งค่าพื้นฐานสำหรับ Vite
const config = {
	plugins: [sveltekit()],
	server: {
		cors: true,
		allowedHosts: true
	},
	preview: {
		allowedHosts: true
	}
};

// ส่งออกการตั้งค่า Vite โดยรวมการตั้งค่าพื้นฐานเข้ากับการตั้งค่าสำหรับการทดสอบ
export default defineConfig(mergeConfig(config, {
	test: {
		// กำหนดสภาพแวดล้อมการทดสอบเป็น jsdom
		environment: 'jsdom',
		// ไฟล์ที่ต้องตั้งค่าก่อนการทดสอบ
		setupFiles: ['./setupTest.js'],
		// กำหนดให้ตัวแปร global สามารถใช้งานได้ในการทดสอบ
		globals: true
	}
}));