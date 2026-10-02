// นำเข้าฟังก์ชัน v4 จากไลบรารี uuid เพื่อสร้าง ID ที่ไม่ซ้ำกัน
import { v4 as uuidv4 } from "uuid";

/**
 * สร้าง TransformStream ใหม่ที่แบ่งสตรีมอินพุตตามตัวคั่นที่ระบุ
 *
 * @param {string} splitOn - ตัวคั่นที่จะใช้แบ่งสตรีมอินพุต
 */
export const splitStream = (splitOn) => {
	// เริ่มต้นบัฟเฟอร์ว่างเพื่อเก็บส่วนของข้อมูล
	let buffer = "";

	// ส่งคืน TransformStream ใหม่ที่แบ่งสตรีมอินพุต
	return new TransformStream({
		/**
		 * ฟังก์ชัน transform จะถูกเรียกสำหรับแต่ละส่วนของข้อมูลในสตรีมอินพุต
		 *
		 * @param {Buffer} chunk - ส่วนของข้อมูลปัจจุบัน
		 * @param {AbortController} controller - AbortController ที่ใช้ในการยกเลิกสตรีม
		 */
		transform(chunk, controller) {
			// ต่อส่วนของข้อมูลปัจจุบันเข้ากับบัฟเฟอร์
			buffer += chunk;

			// แบ่งบัฟเฟอร์ออกเป็นส่วนๆ ตามตัวคั่น
			const parts = buffer.split(splitOn);

			// นำแต่ละส่วนในสตรีมเอาต์พุต ยกเว้นส่วนสุดท้าย
			parts.slice(0, -1).forEach((part) => controller.enqueue(part));

			// อัปเดตบัฟเฟอร์ให้เป็นส่วนสุดท้าย
			buffer = parts[parts.length - 1];
		},

		/**
		 * ฟังก์ชัน flush จะถูกเรียกเมื่อไม่มีส่วนของข้อมูลในสตรีมอินพุตแล้ว
		 *
		 * @param {AbortController} controller - AbortController ที่ใช้ในการยกเลิกสตรีม
		 */
		flush(controller) {
			// นำข้อมูลบัฟเฟอร์ที่เหลืออยู่ออกมา
			if (buffer) controller.enqueue(buffer);
		}
	});
};

/**
 * แปลงอาร์เรย์ของข้อความให้เป็นโครงสร้างที่แต่ละข้อความมี ID ลูก
 *
 * @param {object[]} messages - อาร์เรย์ของข้อความที่จะแปลง
 * @returns {object} โครงสร้างของข้อความที่แปลงแล้ว
 */
export const convertMessagesToHistory = (messages) => {
	let history = {
		messages: {},
		currentId: null
	};

	let parentMessageId = null;
	let messageId = null;

	for (const message of messages) {
		// สร้าง ID ใหม่สำหรับข้อความ
		messageId = uuidv4();

		// หากมีข้อความพาเรนต์ ให้เพิ่ม ID ของข้อความปัจจุบันลงในรายการ ID ลูกของพาเรนต์
		if (parentMessageId !== null) {
			history.messages[parentMessageId].childrenIds = [
				...history.messages[parentMessageId].childrenIds,
				messageId
			];
		}

		// สร้างอ็อบเจ็กต์ข้อความใหม่ด้วย ID ที่สร้างขึ้นและเพิ่มลงในอ็อบเจ็กต์ messages
		history.messages[messageId] = {
			...message,
			id: messageId,
			parentId: parentMessageId,
			childrenIds: []
		};

		parentMessageId = messageId;
	}

	history.currentId = messageId;

	return history;
};

/**
 * คัดลอกข้อความไปยังคลิปบอร์ดโดยใช้ navigator.clipboard API
 *
 * @param {string} text - ข้อความที่จะคัดลอกไปยังคลิปบอร์ด
 */
// คัดลอกข้อความไปยังคลิปบอร์ด
export const copyToClipboard = (text) => {
	if (!navigator.clipboard) {
		var textArea = document.createElement("textarea");
		textArea.value = text;

		textArea.style.top = "0";
		textArea.style.left = "0";
		textArea.style.position = "fixed";

		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		try {
			var successful = document.execCommand("copy");
			var msg = successful ? "ประสบความสำเร็จ" : "ไม่สำเร็จ";
			console.log("การคัดลอก" + msg);
		} catch (err) {
			console.error("ไม่สามารถคัดลอกได้", err);
		}

		document.body.removeChild(textArea);
		return;
	}
	navigator.clipboard.writeText(text).then(
		function () {
			console.log("คัดลอกไปยังคลิปบอร์ดแล้ว");
		},
		function (err) {
			console.error("ไม่สามารถคัดลอกข้อความ: ", err);
		}
	);
};