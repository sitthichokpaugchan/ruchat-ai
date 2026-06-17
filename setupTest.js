// นำเข้า jest-dom matchers สำหรับ vitest
import '@testing-library/jest-dom/vitest';

// จำลอง (Mock) window.scrollTo เพื่อป้องกันข้อผิดพลาด "Not implemented" ใน JSDOM
window.scrollTo = vi.fn();
