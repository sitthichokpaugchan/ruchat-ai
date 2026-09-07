/** @type {import('tailwindcss').Config} */
export default {
	// ระบุไฟล์ที่ Tailwind จะสแกนหาคลาสเพื่อสร้าง CSS
	content: ["./src/**/*.{html,js,svelte,ts}"],
	// ส่วนขยายธีมของ Tailwind
	theme: {
		extend: {}
	},
	// ปลั๊กอินที่ใช้กับ Tailwind
	plugins: []
};